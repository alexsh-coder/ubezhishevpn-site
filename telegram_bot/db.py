import os
import psycopg2
import psycopg2.extras
import psycopg2.errors
from contextlib import contextmanager
from datetime import datetime, timezone


def _pg_config():
    return {
        "host":     os.environ.get("PG_HOST", "localhost"),
        "port":     int(os.environ.get("PG_PORT", "5432")),
        "user":     os.environ.get("PG_USER", "vpn_user"),
        "password": os.environ.get("PG_PASSWORD", "gagatub1"),
        "dbname":   os.environ.get("PG_DBNAME", "ubezishche_vpn"),
    }


class _Conn:
    """Thin wrapper that lets callers use conn.execute() like sqlite3."""
    def __init__(self, pg_conn):
        self._conn = pg_conn
        self._cur = pg_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    def execute(self, sql, params=()):
        self._cur.execute(sql, params)
        return self._cur

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._cur.close()
        self._conn.close()


@contextmanager
def get_conn():
    pg = psycopg2.connect(**_pg_config())
    conn = _Conn(pg)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    tables = [
        """
        CREATE TABLE IF NOT EXISTS users (
            user_id      BIGINT PRIMARY KEY,
            username     TEXT,
            referrer_id  BIGINT,
            trial_used   INTEGER DEFAULT 0,
            created_at   TEXT NOT NULL,
            region       TEXT,
            balance      DOUBLE PRECISION NOT NULL DEFAULT 0,
            total_earned DOUBLE PRECISION NOT NULL DEFAULT 0
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS subscriptions (
            id             SERIAL PRIMARY KEY,
            user_id        BIGINT NOT NULL,
            username       TEXT,
            remna_uuid     TEXT NOT NULL,
            sub_id         TEXT NOT NULL,
            sub_url        TEXT NOT NULL,
            created_at     TEXT NOT NULL,
            expires_at     TEXT NOT NULL,
            tariff         TEXT,
            devices        INTEGER NOT NULL DEFAULT 2,
            remna_username TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS promocodes (
            code      TEXT PRIMARY KEY,
            discount  INTEGER NOT NULL,
            uses_left INTEGER NOT NULL DEFAULT -1,
            is_active INTEGER NOT NULL DEFAULT 1
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS promo_uses (
            code    TEXT NOT NULL,
            user_id BIGINT NOT NULL,
            used_at TEXT NOT NULL,
            PRIMARY KEY (code, user_id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS payments (
            invoice_id          TEXT PRIMARY KEY,
            user_id             BIGINT NOT NULL,
            amount              DOUBLE PRECISION NOT NULL,
            days                INTEGER NOT NULL,
            tariff              TEXT NOT NULL,
            promo               TEXT,
            status              TEXT NOT NULL DEFAULT 'pending',
            created_at          TEXT NOT NULL,
            paid_at             TEXT,
            yookassa_payment_id TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS referral_bonuses (
            id         SERIAL PRIMARY KEY,
            referrer   BIGINT NOT NULL,
            referee    BIGINT NOT NULL UNIQUE,
            granted_at TEXT NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS balance_tx (
            id          SERIAL PRIMARY KEY,
            user_id     BIGINT NOT NULL,
            amount      DOUBLE PRECISION NOT NULL,
            kind        TEXT NOT NULL,
            description TEXT,
            created_at  TEXT NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS reminder_sent (
            sub_id     INTEGER NOT NULL,
            hours      INTEGER NOT NULL,
            expires_at TEXT NOT NULL,
            sent_at    TEXT NOT NULL,
            PRIMARY KEY (sub_id, hours)
        )
        """,
    ]

    with get_conn() as conn:
        for sql in tables:
            conn.execute(sql)

    # Migrations — each in its own transaction so a duplicate-column error
    # does not abort the rest (PostgreSQL invalidates the whole txn on error).
    for sql in [
        "ALTER TABLE payments ADD COLUMN yookassa_payment_id TEXT",
        "ALTER TABLE subscriptions ADD COLUMN devices INTEGER NOT NULL DEFAULT 2",
        "ALTER TABLE users ADD COLUMN balance DOUBLE PRECISION NOT NULL DEFAULT 0",
        "ALTER TABLE users ADD COLUMN total_earned DOUBLE PRECISION NOT NULL DEFAULT 0",
        "ALTER TABLE users ADD COLUMN region TEXT",
        "ALTER TABLE subscriptions ADD COLUMN remna_username TEXT",
    ]:
        try:
            with get_conn() as conn:
                conn.execute(sql)
        except Exception:
            pass

    for code, discount in [("GOGA", 15), ("ШАШЛЫЧКИ", 15)]:
        with get_conn() as conn:
            conn.execute(
                "INSERT INTO promocodes(code, discount, uses_left) "
                "VALUES (%s, %s, -1) ON CONFLICT (code) DO NOTHING",
                (code, discount),
            )


def _now_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")

def _parse_dt(s: str) -> datetime:
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(s, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    raise ValueError(f"Cannot parse datetime: {s!r}")

# ---- users ----
def ensure_user(user_id, username, referrer_id=None, region=None):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT user_id FROM users WHERE user_id=%s", (user_id,)
        ).fetchone()
        if row:
            conn.execute(
                "UPDATE users SET username=%s WHERE user_id=%s",
                (username, user_id),
            )
            return
        conn.execute(
            "INSERT INTO users(user_id, username, referrer_id, "
            "created_at, region) VALUES (%s,%s,%s,%s,%s)",
            (user_id, username, referrer_id, _now_str(), region),
        )

def get_user(user_id):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE user_id=%s", (user_id,)
        ).fetchone()
    return dict(row) if row else None

def mark_trial_used(user_id):
    with get_conn() as conn:
        conn.execute(
            "UPDATE users SET trial_used=1 WHERE user_id=%s", (user_id,)
        )

def delete_user_data(user_id: int):
    """Полное удаление данных пользователя (для тестирования)."""
    with get_conn() as conn:
        conn.execute("DELETE FROM users WHERE user_id=%s", (user_id,))
        conn.execute("DELETE FROM subscriptions WHERE user_id=%s", (user_id,))
        conn.execute("DELETE FROM payments WHERE user_id=%s", (user_id,))
        conn.execute("DELETE FROM promo_uses WHERE user_id=%s", (user_id,))
        conn.execute(
            "DELETE FROM referral_bonuses WHERE referee=%s OR referrer=%s",
            (user_id, user_id),
        )
        conn.execute("DELETE FROM balance_tx WHERE user_id=%s", (user_id,))

# ---- subscriptions ----
def save_sub(user_id, username, remna_uuid, sub_id, sub_url,
             created_at, expires_at, tariff, devices=2,
             remna_username=None):
    with get_conn() as conn:
        row = conn.execute(
            """INSERT INTO subscriptions
               (user_id, username, remna_uuid, sub_id, sub_url,
                created_at, expires_at, tariff, devices, remna_username)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
               RETURNING id""",
            (user_id, username, remna_uuid, sub_id, sub_url,
             created_at, expires_at, tariff, devices, remna_username),
        ).fetchone()
        return row["id"]

def get_user_subs(user_id):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM subscriptions WHERE user_id=%s ORDER BY id DESC",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]

def get_sub_by_id(sub_id):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM subscriptions WHERE id=%s", (sub_id,)
        ).fetchone()
    return dict(row) if row else None

def get_latest_active_sub(user_id):
    subs = get_user_subs(user_id)
    now = datetime.now(timezone.utc)
    for s in subs:
        try:
            if _parse_dt(s["expires_at"]) > now:
                return s
        except Exception:
            continue
    return None

def extend_sub(sub_row_id, new_expires_at):
    with get_conn() as conn:
        conn.execute(
            "UPDATE subscriptions SET expires_at=%s WHERE id=%s",
            (new_expires_at, sub_row_id),
        )

def set_sub_devices(sub_row_id, devices):
    with get_conn() as conn:
        conn.execute(
            "UPDATE subscriptions SET devices=%s WHERE id=%s",
            (devices, sub_row_id),
        )

def update_sub_remna(sub_row_id, remna_uuid, sub_url, sub_id, devices):
    with get_conn() as conn:
        conn.execute(
            "UPDATE subscriptions "
            "SET remna_uuid=%s, sub_url=%s, sub_id=%s, devices=%s WHERE id=%s",
            (remna_uuid, sub_url, sub_id, devices, sub_row_id),
        )

# ---- promocodes ----
def get_promo(code):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM promocodes WHERE code=%s AND is_active=1",
            (code.upper(),),
        ).fetchone()
    return dict(row) if row else None

def has_user_used_promo(code, user_id):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT 1 FROM promo_uses WHERE code=%s AND user_id=%s",
            (code.upper(), user_id),
        ).fetchone()
    return row is not None

def mark_promo_used(code, user_id):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO promo_uses(code, user_id, used_at) "
            "VALUES (%s,%s,%s) ON CONFLICT (code, user_id) DO NOTHING",
            (code.upper(), user_id, _now_str()),
        )
        conn.execute(
            "UPDATE promocodes SET uses_left = uses_left - 1 "
            "WHERE code=%s AND uses_left > 0",
            (code.upper(),),
        )

# ---- payments ----
def create_payment(invoice_id, user_id, amount, days, tariff, promo):
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO payments
               (invoice_id, user_id, amount, days, tariff, promo,
                status, created_at)
               VALUES (%s,%s,%s,%s,%s,%s,'pending',%s)""",
            (invoice_id, user_id, amount, days, tariff, promo, _now_str()),
        )

def get_payment(invoice_id):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM payments WHERE invoice_id=%s", (invoice_id,),
        ).fetchone()
    return dict(row) if row else None

def mark_payment_paid(invoice_id, yookassa_payment_id=""):
    with get_conn() as conn:
        conn.execute(
            "UPDATE payments SET status='paid', paid_at=%s, "
            "yookassa_payment_id=%s WHERE invoice_id=%s AND status='pending'",
            (_now_str(), yookassa_payment_id, invoice_id),
        )

def get_payment_by_yookassa_id(yookassa_payment_id):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM payments WHERE yookassa_payment_id=%s",
            (yookassa_payment_id,),
        ).fetchone()
    return dict(row) if row else None

def user_has_any_paid(user_id):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT 1 FROM payments WHERE user_id=%s AND status='paid' LIMIT 1",
            (user_id,),
        ).fetchone()
    return row is not None

# ---- referrals & balance ----
def grant_referral_bonus(referrer, referee):
    try:
        with get_conn() as conn:
            conn.execute(
                "INSERT INTO referral_bonuses(referrer, referee, granted_at) "
                "VALUES (%s,%s,%s)",
                (referrer, referee, _now_str()),
            )
        return True
    except psycopg2.errors.UniqueViolation:
        return False

def get_balance(user_id) -> float:
    u = get_user(user_id)
    return float(u["balance"]) if u else 0.0

def add_balance(user_id, amount, kind, description=""):
    """Зачисляет/списывает с баланса. amount может быть отрицательным."""
    with get_conn() as conn:
        conn.execute(
            "UPDATE users SET balance = balance + %s WHERE user_id=%s",
            (amount, user_id),
        )
        if kind == "referral" and amount > 0:
            conn.execute(
                "UPDATE users SET total_earned = total_earned + %s "
                "WHERE user_id=%s",
                (amount, user_id),
            )
        conn.execute(
            "INSERT INTO balance_tx(user_id, amount, kind, description, "
            "created_at) VALUES (%s,%s,%s,%s,%s)",
            (user_id, amount, kind, description, _now_str()),
        )

def spend_balance(user_id, amount, description="") -> bool:
    """Атомарное списание. Возвращает False если недостаточно."""
    with get_conn() as conn:
        row = conn.execute(
            "SELECT balance FROM users WHERE user_id=%s", (user_id,)
        ).fetchone()
        if not row or float(row["balance"]) < amount:
            return False
        conn.execute(
            "UPDATE users SET balance = balance - %s WHERE user_id=%s",
            (amount, user_id),
        )
        conn.execute(
            "INSERT INTO balance_tx(user_id, amount, kind, description, "
            "created_at) VALUES (%s,%s,%s,%s,%s)",
            (user_id, -amount, "spend", description, _now_str()),
        )
        return True

def get_balance_tx(user_id, limit=10):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM balance_tx WHERE user_id=%s "
            "ORDER BY id DESC LIMIT %s",
            (user_id, limit),
        ).fetchall()
    return [dict(r) for r in rows]

def get_referral_count(user_id) -> int:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS c FROM users WHERE referrer_id=%s", (user_id,)
        ).fetchone()
    return int(row["c"]) if row else 0

# ---- settings ----
def get_setting(key, default=None):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT value FROM settings WHERE key=%s", (key,)
        ).fetchone()
    return row["value"] if row else default

def set_setting(key, value):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO settings(key, value) VALUES (%s,%s) "
            "ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value",
            (key, str(value)),
        )

# ---- reminders ----
def get_active_subscriptions() -> list:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM subscriptions WHERE expires_at > %s", (now,)
        ).fetchall()
    return [dict(r) for r in rows]

def check_reminder_sent(sub_id: int, hours: int, expires_at: str) -> bool:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT expires_at FROM reminder_sent WHERE sub_id=%s AND hours=%s",
            (sub_id, hours),
        ).fetchone()
    if not row:
        return False
    return row["expires_at"] == expires_at

def mark_reminder_sent(sub_id: int, hours: int, expires_at: str):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO reminder_sent(sub_id, hours, expires_at, sent_at) "
            "VALUES (%s,%s,%s,%s) "
            "ON CONFLICT (sub_id, hours) DO UPDATE "
            "SET expires_at=EXCLUDED.expires_at, sent_at=EXCLUDED.sent_at",
            (sub_id, hours, expires_at, _now_str()),
        )
