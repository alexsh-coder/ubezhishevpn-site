import asyncio
import os
import secrets
import logging
import random
import string
from datetime import datetime, timedelta, timezone

from yookassa_client import create_payment as yk_create_payment
import webhook_server

from dotenv import load_dotenv
from aiohttp import web

from telegram import (
    Update, InlineKeyboardButton, InlineKeyboardMarkup,
)
from telegram.error import BadRequest
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler,
    MessageHandler, ContextTypes, filters,
)

from db import (
    init_db, ensure_user, get_user, mark_trial_used,
    save_sub, get_user_subs, get_latest_active_sub, extend_sub,
    set_sub_devices, get_sub_by_id,
    get_promo, has_user_used_promo, mark_promo_used,
    create_payment, get_payment, mark_payment_paid,
    grant_referral_bonus, update_sub_remna,
    get_balance, add_balance, spend_balance, get_balance_tx,
    get_referral_count, get_setting, set_setting,
    delete_user_data,
    get_active_subscriptions, check_reminder_sent, mark_reminder_sent,
)
from remnawave import RemnawaveClient

load_dotenv()

# ── Конфиг ───────────────────────────────────────────────────────────────────
BOT_TOKEN     = os.getenv("BOT_TOKEN", "")
BOT_USERNAME  = os.getenv("PUBLIC_BOT_USERNAME", "")
POLICY_URL    = os.getenv("POLICY_URL", "")
AGREEMENT_URL = os.getenv("AGREEMENT_URL", "")
SUPPORT_URL   = os.getenv("SUPPORT_URL", "https://t.me/ubezhishevpn_support")
SUPPORT_USERNAME = os.getenv("SUPPORT_USERNAME", "@ubezhishevpn_support")

WEBHOOK_HOST = os.getenv("WEBHOOK_HOST", "0.0.0.0")
WEBHOOK_PORT = int(os.getenv("WEBHOOK_PORT", "8081"))
RETURN_URL   = os.getenv(
    "RETURN_URL",
    f"https://t.me/{os.getenv('PUBLIC_BOT_USERNAME', '')}",
)

REMNA_URL   = os.getenv("REMNA_URL", "")
REMNA_TOKEN = os.getenv("REMNA_API_TOKEN", "")

ADMIN_ID = 827359575
REFERRAL_PERCENT = 20  # % от покупки рефералу
REFERRAL_PERCENT_LIMITED = 10

# TIME_MULTIPLIER > 1 сжимает время для тестирования напоминаний:
# при TIME_MULTIPLIER=60 один реальный час превращается в одну реальную минуту.
TIME_MULTIPLIER = 1
REMINDER_THRESHOLDS_H = [24, 12, 6, 2, 1]

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    level=logging.INFO,
)
log = logging.getLogger(__name__)

remna = RemnawaveClient(REMNA_URL, REMNA_TOKEN)

DEVICES_PRICE_RUB = 50
DEVICES_STEP      = 2
DEVICES_DEFAULT   = 4

# ── Утилиты ──────────────────────────────────────────────────────────────────
def _now() -> datetime:
    return datetime.now(timezone.utc)

def _fmt(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d %H:%M")

def _fmt_short(dt: datetime) -> str:
    return dt.strftime("%d.%m.%Y")

def _parse_expires(s: str) -> datetime:
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(s, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    raise ValueError(s)

def _reminder_interval() -> float:
    return max(5.0, 60.0 / TIME_MULTIPLIER)

def _threshold_real_seconds(hours: int) -> float:
    return hours * 3600.0 / TIME_MULTIPLIER

def _hours_label(hours: int) -> str:
    if hours == 1:
        return "1 час"
    if hours < 24:
        return f"{hours} часов"
    days = hours // 24
    if days == 1:
        return "1 день"
    if 2 <= days <= 4:
        return f"{days} дня"
    return f"{days} дней"

def _make_remna_username(length: int = 12) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return ''.join(random.choices(alphabet, k=length))

def _plural_devices(n: int) -> str:
    if 11 <= n % 100 <= 14:
        return "устройств"
    last = n % 10
    if last == 1:
        return "устройство"
    if 2 <= last <= 4:
        return "устройства"
    return "устройств"

def _env_int(name: str, default: int) -> int:
    return int(os.getenv(name, default))

def _is_admin(user_id: int) -> bool:
    return user_id == ADMIN_ID

def _prices_overridden() -> bool:
    return get_setting("price_override", "0") == "1"

# ── Тарифы ───────────────────────────────────────────────────────────────────
TARIFFS = {
    "trial": {
        "days": _env_int("TRIAL_DAYS", 3),
        "price_rub": _env_int("TRIAL_PRICE_RUB", 0),
        "traffic_limit_bytes": 0,
    },
    "m1": {
        "days": _env_int("M1_DAYS", 30),
        "price_rub": _env_int("M1_PRICE_RUB", 100),
        "traffic_limit_bytes": 0,
    },
    "m3": {
        "days": _env_int("M3_DAYS", 90),
        "price_rub": _env_int("M3_PRICE_RUB", 270),
        "traffic_limit_bytes": 0,
    },
    "m12": {
        "days": _env_int("M12_DAYS", 365),
        "price_rub": _env_int("M12_PRICE_RUB", 900),
        "traffic_limit_bytes": 0,
    },
}

MSC_PRICES = {
    "m1":  _env_int("MSC_M1_PRICE_RUB", 150),
    "m3":  _env_int("MSC_M3_PRICE_RUB", 400),
    "m12": _env_int("MSC_M12_PRICE_RUB", 1200),
}

def _tariff_price(key: str, region: str | None, user_id: int = 0) -> int:
    if _prices_overridden() and key != "trial" and user_id == ADMIN_ID:
        return 1
    if region == "msc" and key in MSC_PRICES:
        return MSC_PRICES[key]
    return TARIFFS[key]["price_rub"]

def _tariff_title(key: str, region: str | None, user_id: int = 0) -> str:
    price = _tariff_price(key, region, user_id)
    if key == "trial":
        return f"🎁 Пробный · {price} ₽"
    months = TARIFFS[key]["days"] // 30
    suffix = "а" if months in (2, 3, 4) else ""
    return f"{months} месяц{suffix} · {price} ₽"

# ── Выдача / продление подписки ──────────────────────────────────────────────
async def issue_or_extend(user_id, username, days, tariff):
    active = get_latest_active_sub(user_id)
    new_exp = _now() + timedelta(days=days)
    traffic_limit = TARIFFS.get(tariff, {}).get("traffic_limit_bytes", 0)

    if active and active.get("remna_uuid"):
        remna_uuid = active["remna_uuid"]
        existing = await remna.get_user(remna_uuid)
        if existing:
            cur_exp = datetime.strptime(
                active["expires_at"], "%Y-%m-%d %H:%M"
            ).replace(tzinfo=timezone.utc)
            new_exp = cur_exp + timedelta(days=days)
            ok = await remna.update_user_expire(remna_uuid, new_exp)
            if ok:
                extend_sub(active["id"], _fmt(new_exp))
                return True, active["sub_url"], new_exp, active["id"]

    remna_username = _make_remna_username()
    devices = (active or {}).get("devices", DEVICES_DEFAULT)

    result = await remna.create_user(
        username=remna_username,
        expire_at=new_exp,
        traffic_limit_bytes=traffic_limit,
        description=f"Telegram @{username} (id={user_id}), tariff={tariff}",
        device_limit=devices,
        telegram_id=user_id,
    )
    if not result:
        return False, "", new_exp, None

    remna_uuid = result.get("uuid", "")
    sub_id = result.get("shortUuid", remna_uuid[:8])
    sub_url = result.get("subscriptionUrl", "")
    if not sub_url:
        return False, "", new_exp, None

    row_id = save_sub(
        user_id=user_id, username=username, remna_uuid=remna_uuid,
        sub_id=sub_id, sub_url=sub_url,
        created_at=_fmt(_now()), expires_at=_fmt(new_exp),
        tariff=tariff, devices=devices,
        remna_username=remna_username
    )
    return True, sub_url, new_exp, row_id

async def add_devices(user_id):
    active = get_latest_active_sub(user_id)
    if not active or not active.get("remna_uuid"):
        return False, 0

    cur = active.get("devices", DEVICES_DEFAULT)
    new = cur + DEVICES_STEP
    remna_uuid = active["remna_uuid"]

    existing = await remna.get_user(remna_uuid)
    if not existing:
        db_user = get_user(user_id)
        username = (db_user or {}).get("username", "")
        exp = datetime.strptime(
            active["expires_at"], "%Y-%m-%d %H:%M"
        ).replace(tzinfo=timezone.utc)
        result = await remna.create_user(
            username=_make_remna_username(),
            expire_at=exp, traffic_limit_bytes=0,
            description=f"Telegram @{username} (id={user_id}), recreated",
            device_limit=new,
            telegram_id=user_id,
        )
        if not result:
            return False, cur
        update_sub_remna(
            active["id"], result.get("uuid", ""),
            result.get("subscriptionUrl", active["sub_url"]),
            result.get("shortUuid", result.get("uuid", "")[:8]),
            new,
        )
        return True, new

    if await remna.set_device_limit(remna_uuid, new):
        set_sub_devices(active["id"], new)
        return True, new
    return False, cur

# ── Унифицированная отправка/редактирование ──────────────────────────────────
async def send_view(update: Update, ctx: ContextTypes.DEFAULT_TYPE,
                    text: str, kb: InlineKeyboardMarkup,
                    parse_mode="Markdown"):
    """Если из callback — редактируем; иначе шлём новое."""
    if update.callback_query:
        try:
            await update.callback_query.edit_message_text(
                text, parse_mode=parse_mode, reply_markup=kb,
                disable_web_page_preview=True,
            )
            return
        except BadRequest as e:
            if "not modified" in str(e).lower():
                return
        except Exception:
            pass
    chat_id = update.effective_chat.id
    await ctx.bot.send_message(
        chat_id=chat_id, text=text, parse_mode=parse_mode,
        reply_markup=kb, disable_web_page_preview=True,
    )

# ── Кнопка "Как подключить" (после оплаты/триала) ────────────────────────────
def post_payment_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📲 Как подключить", callback_data="connect")],
        [InlineKeyboardButton("🏠 В меню", callback_data="menu")],
    ])

# ── ГЛАВНОЕ МЕНЮ ─────────────────────────────────────────────────────────────
async def view_main_menu(update, ctx):
    u = update.effective_user
    ensure_user(u.id, u.username or "")
    db_user = get_user(u.id)
    balance = get_balance(u.id)
    active = get_latest_active_sub(u.id)

    nick = f"{u.username}" if u.username else f"id{u.id}"
    lines = [
        "🏠 *Личный кабинет УбежищеVPN*",
        "",
        f"👤 Аккаунт: *{nick}*",
        f"💰 Баланс: *{balance:.0f} ₽*",
    ]
    if active:
        exp = datetime.strptime(
            active["expires_at"], "%Y-%m-%d %H:%M"
        ).replace(tzinfo=timezone.utc)
        days_left = max(0, (exp - _now()).days)
        lines.append("✅ Подписка активна")
        # lines.append(f"✅ Подписка активна — *{days_left + 1}* дн.")
    else:
        lines.append("❗ Активной подписки нет")

    lines += ["", "Выберите раздел ниже 👇"]

    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("👤 Профиль",        callback_data="cabinet"),
         InlineKeyboardButton("📋 Мои подписки",   callback_data="subs")],
        [InlineKeyboardButton("💳 Купить подписку", callback_data="buy")],
        [InlineKeyboardButton("💰 Баланс",         callback_data="balance"),
         InlineKeyboardButton("🎁 Пригласить",     callback_data="referral")],
        [InlineKeyboardButton("🎟 Промокод",       callback_data="promo"),
         InlineKeyboardButton("🛟 Поддержка",      callback_data="support")],
    ])
    await send_view(update, ctx, "\n".join(lines), kb)

# ── ПРОФИЛЬ (личный кабинет) ─────────────────────────────────────────────────
async def view_cabinet(update, ctx):
    u = update.effective_user
    db_user = get_user(u.id)
    if not db_user:
        ensure_user(u.id, u.username or "")
        db_user = get_user(u.id)

    nick = f"{u.username}" if u.username else "—"
    referrals = get_referral_count(u.id)
    earned = float(db_user.get("total_earned") or 0)
    balance = float(db_user.get("balance") or 0)

    text = (
        "👤 *Личный кабинет*\n\n"
        f"🆔 ID: `{u.id}`\n"
        f"📛 Логин: *{nick}*\n"
        f"📅 Дата регистрации: `{db_user['created_at']} UTC`\n"
        f"{'🎁 Пробный период: использован' if db_user.get('trial_used') else '🎁 Пробный период: доступен'}\n\n"
        f"👥 Приглашено друзей: *{referrals}*\n"
        f"💰 Всего заработано: *{earned:.0f} ₽*\n"
        f"💼 Текущий баланс: *{balance:.0f} ₽*"
    )
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("🎁 Пригласить друга", callback_data="referral")],
        [InlineKeyboardButton("◀️ В меню", callback_data="menu")],
    ])
    await send_view(update, ctx, text, kb)

# ── ПОДПИСКИ ─────────────────────────────────────────────────────────────────
async def view_subs(update, ctx):
    u = update.effective_user
    subs = get_user_subs(u.id)
    now = _now()

    lines = ["📋 *Мои подписки*\n"]
    rows = []


    if not subs:
        lines.append("❗ У вас пока нет подписок.")
    else:

        for s_key, s in enumerate(subs, start=1):
            try:
                exp = datetime.strptime(
                    s["expires_at"], "%Y-%m-%d %H:%M"
                ).replace(tzinfo=timezone.utc)
                active = exp > now
            except Exception:
                active = False
                exp = None
            mark = "✅" if active else "⏳"
            tariff_label = TARIFFS.get(s.get("tariff", ""), {}).get("days", 0)
            tariff_label = f"{tariff_label // 30} мес." if tariff_label else (
                "Пробный" if s.get("tariff") == "trial" else s.get("tariff", "—")
            )

            exp_str = _fmt_short(exp) if exp else "—"
            name = s.get("remna_username") or f"#{s['id']}"
            status = "Активна" if active else "Истекла"

            lines.append(
                f"{s_key}. *{name}* • {status} • до {exp_str}"
            )
            rows.append([InlineKeyboardButton(
                f"📦 {name} • до {exp_str}",
                callback_data=f"sub:{s['id']}",
            )])

    rows.append([InlineKeyboardButton(
        "💳 Купить подписку", callback_data="buy"
    )])
    rows.append([InlineKeyboardButton("◀️ В меню", callback_data="menu")])

    await send_view(update, ctx, "\n".join(lines), InlineKeyboardMarkup(rows))

async def view_sub_details(update, ctx, sub_id: int):
    u = update.effective_user
    s = get_sub_by_id(sub_id)
    if not s or s["user_id"] != u.id:
        await send_view(update, ctx, "❌ Подписка не найдена.",
                        InlineKeyboardMarkup([[InlineKeyboardButton(
                            "◀️ Назад", callback_data="subs")]]))
        return

    exp = datetime.strptime(
        s["expires_at"], "%Y-%m-%d %H:%M"
    ).replace(tzinfo=timezone.utc)

    now = _now()
    is_active = exp > now

    delta = exp - now
    total_seconds = int(delta.total_seconds())

    days_left = max(0, total_seconds // 86400)
    hours_left = max(0, (total_seconds % 86400) // 3600)

    devices = s.get("devices", DEVICES_DEFAULT)

    remna_devices = await remna.get_user_devices(s["remna_uuid"])
    dev_list = remna_devices.get("devices", []) if isinstance(
        remna_devices, dict) else []
    used = len(dev_list)
    free = max(0, devices - used)

    dev_text = ""
    if dev_list:
        dev_text = "\n*Подключённые устройства:*\n" + "".join(
            f"  {i}. {d.get('deviceModel', 'устройство')}\n"
            for i, d in enumerate(dev_list, 1)
        )

    name = s.get("remna_username") or f"#{s['id']}"

    remaining_text = (
        f"*{days_left} дн. {hours_left} ч.*"
        if is_active else "*0 дн. 0 ч.*"
    )

    text = (
        f"📦 *{name}*\n\n"
        f"Статус: {'✅ Активна' if is_active else '⏳ Истекла'}\n"
        f"Осталось: {remaining_text}\n"
        f"Лимит устройств: *{used}/{devices}* "
        f"(свободно {free})\n"
        f"{dev_text}\n"
        f"🔗 Ссылка подписки:\n(нажмите чтобы скопировать)\n`{s['sub_url']}`"
    )

    rows = []
    if is_active:
        rows.append([InlineKeyboardButton(
            "📲 Как подключить", callback_data="connect")])
    rows.append([InlineKeyboardButton(
        f"📱 Устройства ({used}/{devices})",
        callback_data=f"devs:{s['id']}")])
    rows.append([InlineKeyboardButton(
            "🔄 Продлить", callback_data="buy")])    
    rows.append([InlineKeyboardButton("◀️ К списку", callback_data="subs")])

    await send_view(update, ctx, text, InlineKeyboardMarkup(rows))

# ── УСТРОЙСТВА ───────────────────────────────────────────────────────────────
async def view_devices(update, ctx, sub_id: int):
    u = update.effective_user
    s = get_sub_by_id(sub_id)
    if not s or s["user_id"] != u.id:
        await send_view(update, ctx, "❌ Подписка не найдена.",
                        InlineKeyboardMarkup([[InlineKeyboardButton(
                            "◀️ Назад", callback_data="subs")]]))
        return

    devices = s.get("devices", DEVICES_DEFAULT)
    remna_devices = await remna.get_user_devices(s["remna_uuid"])
    dev_list = remna_devices.get("devices", []) if isinstance(
        remna_devices, dict) else []
    used = len(dev_list)

    lines = [f"📱 Устройства подписки *{s['remna_username']}*\n"]
    lines.append(f"Лимит: *{used}/{devices}*\n")

    rows = []
    if dev_list:
        lines.append("Подключённые:")
        for i, d in enumerate(dev_list, 1):
            name = d.get("deviceModel", "устройство")
            hwid = d.get("hwid") or d.get("hwId") or d.get("id") or ""
            lines.append(f"  {i}. {name}")
            if hwid:
                rows.append([InlineKeyboardButton(
                    f"❌ Удалить #{i}",
                    callback_data=f"delr:{s['id']}:{hwid}"
                )])
    else:
        lines.append("_Пока никто не подключён._")

    rows.append([InlineKeyboardButton(
        f"➕ +{DEVICES_STEP} устройства · {DEVICES_PRICE_RUB} ₽",
        callback_data=f"adddev:{s['id']}"
    )])
    rows.append([InlineKeyboardButton(
        "◀️ Назад", callback_data=f"sub:{s['id']}"
    )])

    await send_view(update, ctx, "\n".join(lines),
                    InlineKeyboardMarkup(rows))

async def cb_delete_device(update, ctx):
    q = update.callback_query
    parts = q.data.split(":", 2)
    if len(parts) < 3:
        await q.answer()
        return
    sub_id = int(parts[1])
    hwid = parts[2]
    s = get_sub_by_id(sub_id)
    u = update.effective_user
    if not s or s["user_id"] != u.id:
        await q.answer("❌ Нет доступа", show_alert=True)
        return
    ok = await remna.delete_device(s["remna_uuid"], hwid)
    await q.answer("Удалено ✅" if ok else "Не удалось ❌", show_alert=False)
    await view_devices(update, ctx, sub_id)

# ── ПОДКЛЮЧЕНИЕ ──────────────────────────────────────────────────────────────
INSTALL_TEXTS = {
    "android": (
        "*Android*\n\n"
        "1️⃣ Установи [Happ](https://play.google.com/store/apps/details?id=com.happproxy) "
        "или [v2rayNG](https://play.google.com/store/apps/details?id=com.v2ray.ang)\n\n"
        "2️⃣ Открой «Мои подписки» в боте и скопируй ссылку\n\n"
        "3️⃣ В приложении нажми **+** → *Import from clipboard*\n\n"
        "4️⃣ Подключись. Готово ✅\n\n"
    ),

    "ios": (
        "*iOS*\n\n"
        "*Как подключиться:*\n\n"
        "1️⃣ Открой App Store\n"
        "Найди приложение *Happ* и установи его\n\n"
        "2️⃣ Открой «Мои подписки» в боте\n"
        "Нажми на нужную — скопируй ссылку\n\n"
        "3️⃣ В Happ нажми **+** → *Вставить из буфера обмена*\n\n"
        "4️⃣ Подключись. Готово ✅\n\n"
    ),

    "win": (
        "*Windows*\n\n"
        "1️⃣ Скачай [Happ Desktop](https://github.com/Happ-proxy/happ-desktop/releases)\n\n"
        "2️⃣ Открой программу → *Add subscription*\n"
        "Вставь ссылку из «Мои подписки»\n\n"
        "3️⃣ Нажми *Update* → *Connect* ▶️\n\n"
    ),

    "mac": (
        "*macOS*\n\n"
        "1️⃣ Скачай [Happ Desktop](https://github.com/Happ-proxy/happ-desktop/releases)\n\n"
        "2️⃣ *Add subscription* → вставь ссылку\n\n"
        "3️⃣ Подключись ▶️\n\n"
    ),

    "linux": (
        "*Linux*\n\n"
        "1️⃣ Скачай [Happ](https://github.com/Happ-proxy/happ-desktop/releases)\n\n"
        "2️⃣ *Add subscription* → вставь ссылку\n\n"
        "3️⃣ Connect ▶️\n\n"
    ),

    "router": (
        "*Роутер*\n\n"
        "Для OpenWrt / Keenetic напиши в поддержку:\n"
        f"{SUPPORT_USERNAME}"
    ),
}

def connect_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🤖 Android", callback_data="inst:android"),
         InlineKeyboardButton("🍎 iOS",     callback_data="inst:ios")],
        [InlineKeyboardButton("🪟 Windows", callback_data="inst:win"),
         InlineKeyboardButton("💻 macOS",   callback_data="inst:mac")],
        [InlineKeyboardButton("🐧 Linux",   callback_data="inst:linux"),
         InlineKeyboardButton("📡 Роутер",  callback_data="inst:router")],
        [InlineKeyboardButton("◀️ В меню", callback_data="menu")],
    ])

async def view_connect(update, ctx):
    text = "📲 *Как подключиться*\n\nВыберите ваше устройство:"
    await send_view(update, ctx, text, connect_kb())

async def cb_install(update, ctx):
    q = update.callback_query
    await q.answer()
    key = q.data.split(":", 1)[1]
    text = INSTALL_TEXTS.get(key, "Нет инструкции.")
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("◀️ К выбору устройства", callback_data="connect")],
        [InlineKeyboardButton("🏠 В меню", callback_data="menu")],
    ])
    await send_view(update, ctx, text, kb)

# ── ПОКУПКА ──────────────────────────────────────────────────────────────────
async def view_buy(update, ctx):
    u = update.effective_user
    db_user = get_user(u.id) or {}
    region = db_user.get("region")
    balance = get_balance(u.id)
    promo = ctx.user_data.get("promo")

    lines = ["💳 *Тарифы УбежищеVPN*\n"]
    lines.append(f"💼 Ваш баланс: *{balance:.0f} ₽*")
    if promo:
        lines.append(
            f"🎟 Промокод `{promo['code']}` — скидка {promo['discount']}%"
        )
    lines.append("\nВыберите тариф:")

    rows = []
    for key in TARIFFS.keys():
        if key == "trial" and db_user.get("trial_used"):
            continue
        rows.append([InlineKeyboardButton(
            _tariff_title(key, region, user_id=u.id),
            callback_data=f"buy:{key}"
        )])
    rows.append([InlineKeyboardButton("◀️ В меню", callback_data="menu")])

    await send_view(update, ctx, "\n".join(lines),
                    InlineKeyboardMarkup(rows))

async def cb_buy_tariff(update, ctx):
    q = update.callback_query
    await q.answer()
    user = q.from_user
    key = q.data.split(":", 1)[1]

    if key not in TARIFFS:
        await q.answer("❌ Неизвестный тариф", show_alert=True)
        return

    db_user = get_user(user.id) or {}
    region = db_user.get("region")
    price_rub = _tariff_price(key, region, user_id=user.id)
    title = _tariff_title(key, region, user_id=user.id)

    # Триал
    if key == "trial":
        if db_user.get("trial_used"):
            await send_view(update, ctx,
                "❗ Пробный период уже был использован.",
                InlineKeyboardMarkup([[InlineKeyboardButton(
                    "◀️ К тарифам", callback_data="buy")]]))
            return
        ok, sub_url, exp, _ = await issue_or_extend(
            user.id, user.username or "", TARIFFS["trial"]["days"], "trial"
        )
        if not ok:
            await send_view(update, ctx,
                "❌ Не удалось выдать пробную подписку. Попробуйте позже.",
                InlineKeyboardMarkup([[InlineKeyboardButton(
                    "◀️ К тарифам", callback_data="buy")]]))
            return
        mark_trial_used(user.id)
        text = (
            "✅ *Пробная подписка активна!*\n\n"
            f"📅 До: *{_fmt(exp)} UTC*\n\n"
            f"🔗 Ссылка подписки:\n(нажмите чтобы скопировать)\n`{sub_url}`"
        )
        await send_view(update, ctx, text, post_payment_kb())
        return

    # Применение промокода
    promo_data = ctx.user_data.get("promo")
    final_price = price_rub
    if promo_data:
        final_price = max(
            1, round(price_rub * (100 - promo_data["discount"]) / 100)
        )

    balance = get_balance(user.id)
    days = TARIFFS[key]["days"]

    text = (
        "🧾 *Оформление*\n\n"
        f"Тариф: *{title}*\n"
        f"Сумма к оплате: *{final_price} ₽*\n"
    )
    if promo_data:
        text += f"🎟 Промокод `{promo_data['code']}` −{promo_data['discount']}%\n"
    text += f"\n💼 Ваш баланс: *{balance:.0f} ₽*\nВыберите способ оплаты:"

    rows = []
    if balance >= final_price:
        rows.append([InlineKeyboardButton(
            f"💼 Оплатить с баланса ({final_price} ₽)",
            callback_data=f"paybal:{key}:{final_price}"
        )])
    rows.append([InlineKeyboardButton(
        f"💳 Оплатить картой ({final_price} ₽)",
        callback_data=f"paycard:{key}:{final_price}"
    )])
    rows.append([InlineKeyboardButton("◀️ К тарифам", callback_data="buy")])

    await send_view(update, ctx, text, InlineKeyboardMarkup(rows))

async def cb_pay_balance(update, ctx):
    q = update.callback_query
    await q.answer()
    user = q.from_user
    _, key, price_str = q.data.split(":", 2)
    price = int(price_str)

    if key not in TARIFFS:
        return

    if not spend_balance(
        user.id, price, f"Покупка тарифа {key}"
    ):
        await send_view(update, ctx,
            "❌ Недостаточно средств на балансе.",
            InlineKeyboardMarkup([[InlineKeyboardButton(
                "◀️ К тарифам", callback_data="buy")]]))
        return

    promo_data = ctx.user_data.pop("promo", None)
    if promo_data:
        mark_promo_used(promo_data["code"], user.id)

    days = TARIFFS[key]["days"]
    ok, sub_url, exp, _ = await issue_or_extend(
        user.id, user.username or "", days, key
    )
    if not ok:
        # Возвращаем средства
        add_balance(user.id, price, "refund",
                    "Возврат: не удалось выдать подписку")
        await send_view(update, ctx,
            "❌ Не удалось выдать подписку. Средства возвращены на баланс.",
            InlineKeyboardMarkup([[InlineKeyboardButton(
                "🏠 В меню", callback_data="menu")]]))
        return

    # Реферальные 10%
    await _credit_referral(user.id, price, ctx)

    text = (
        "✅ *Подписка активирована!*\n\n"
        f"📅 До: *{_fmt(exp)} UTC*\n"
        f"💼 Списано с баланса: *{price} ₽*\n\n"
        f"🔗 Ссылка подписки:\n(нажмите чтобы скопировать)\n`{sub_url}`"
    )
    await send_view(update, ctx, text, post_payment_kb())

async def cb_pay_card(update, ctx):
    q = update.callback_query
    await q.answer()
    user = q.from_user
    _, key, price_str = q.data.split(":", 2)
    price = int(price_str)

    if key not in TARIFFS:
        return

    promo_data = ctx.user_data.get("promo")
    days = TARIFFS[key]["days"]

    invoice_id = f"{user.id}_{int(_now().timestamp())}"
    create_payment(
        invoice_id=invoice_id, user_id=user.id, amount=float(price),
        days=days, tariff=key,
        promo=promo_data["code"] if promo_data else None,
    )
    if promo_data:
        mark_promo_used(promo_data["code"], user.id)
        ctx.user_data.pop("promo", None)

    yk = await yk_create_payment(
        amount_rub=float(price),
        description=f"УбежищеVPN · {_tariff_title(key, None, user_id=user.id)}",
        invoice_id=invoice_id, return_url=RETURN_URL,
    )
    if not yk:
        await send_view(update, ctx, "❌ Не удалось создать платёж.",
            InlineKeyboardMarkup([[InlineKeyboardButton(
                "◀️ К тарифам", callback_data="buy")]]))
        return

    pay_url = yk["confirmation"]["confirmation_url"]
    text = (
        "🧾 *Счёт на оплату*\n\n"
        f"Тариф: *{_tariff_title(key, None)}*\n"
        f"Сумма: *{price} ₽*\n\n"
        "После оплаты подписка будет выдана автоматически.\n"
        "_Ссылка действительна 1 час._"
    )
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("💳 Перейти к оплате", url=pay_url)],
        [InlineKeyboardButton("◀️ К тарифам", callback_data="buy")],
    ])
    await send_view(update, ctx, text, kb)

# ── ДОБАВЛЕНИЕ УСТРОЙСТВ ─────────────────────────────────────────────────────
async def cb_add_devices(update, ctx):
    q = update.callback_query
    await q.answer()
    user = q.from_user
    sub_id = int(q.data.split(":", 1)[1])
    s = get_sub_by_id(sub_id)
    if not s or s["user_id"] != user.id:
        return

    balance = get_balance(user.id)
    cur = s.get("devices", DEVICES_DEFAULT)

    text = (
        f"➕ *Добавить устройства к подписке #{s['id']}*\n\n"
        f"Сейчас: {cur} {_plural_devices(cur)}\n"
        f"После оплаты: {cur + DEVICES_STEP} "
        f"{_plural_devices(cur + DEVICES_STEP)}\n"
        f"Стоимость: *{DEVICES_PRICE_RUB} ₽*\n\n"
        f"💼 Баланс: *{balance:.0f} ₽*"
    )
    rows = []
    if balance >= DEVICES_PRICE_RUB:
        rows.append([InlineKeyboardButton(
            f"💼 С баланса ({DEVICES_PRICE_RUB} ₽)",
            callback_data="devbal"
        )])
    rows.append([InlineKeyboardButton(
        f"💳 Картой ({DEVICES_PRICE_RUB} ₽)", callback_data="devcard"
    )])
    rows.append([InlineKeyboardButton(
        "◀️ Назад", callback_data=f"devs:{s['id']}"
    )])
    await send_view(update, ctx, text, InlineKeyboardMarkup(rows))

async def cb_devices_balance(update, ctx):
    q = update.callback_query
    await q.answer()
    user = q.from_user

    if not spend_balance(user.id, DEVICES_PRICE_RUB,
                         "Покупка доп. устройств"):
        await send_view(update, ctx,
            "❌ Недостаточно средств.",
            InlineKeyboardMarkup([[InlineKeyboardButton(
                "🏠 В меню", callback_data="menu")]]))
        return

    ok, new_limit = await add_devices(user.id)
    if not ok:
        add_balance(user.id, DEVICES_PRICE_RUB, "refund",
                    "Возврат: не удалось добавить устройства")
        await send_view(update, ctx,
            "❌ Не удалось добавить устройства. Средства возвращены.",
            InlineKeyboardMarkup([[InlineKeyboardButton(
                "🏠 В меню", callback_data="menu")]]))
        return

    text = (
        "✅ *Устройства добавлены!*\n\n"
        f"Новый лимит: *{new_limit}* устройств."
    )
    await send_view(update, ctx, text, InlineKeyboardMarkup([
        [InlineKeyboardButton("📋 Мои подписки", callback_data="subs")],
        [InlineKeyboardButton("🏠 В меню",       callback_data="menu")],
    ]))

async def cb_devices_card(update, ctx):
    q = update.callback_query
    await q.answer()
    user = q.from_user
    active = get_latest_active_sub(user.id)
    if not active:
        await send_view(update, ctx, "❗ Нет активной подписки.",
            InlineKeyboardMarkup([[InlineKeyboardButton(
                "🏠 В меню", callback_data="menu")]]))
        return

    invoice_id = f"{user.id}_dev_{int(_now().timestamp())}"
    create_payment(
        invoice_id=invoice_id, user_id=user.id,
        amount=float(DEVICES_PRICE_RUB), days=0,
        tariff="devices", promo=None,
    )
    yk = await yk_create_payment(
        amount_rub=float(DEVICES_PRICE_RUB),
        description=f"УбежищеVPN · +{DEVICES_STEP} устройства",
        invoice_id=invoice_id, return_url=RETURN_URL,
    )
    if not yk:
        await send_view(update, ctx, "❌ Не удалось создать платёж.",
            InlineKeyboardMarkup([[InlineKeyboardButton(
                "🏠 В меню", callback_data="menu")]]))
        return
    pay_url = yk["confirmation"]["confirmation_url"]
    await send_view(update, ctx,
        f"🧾 Оплата +{DEVICES_STEP} устройств: *{DEVICES_PRICE_RUB} ₽*\n\n"
        "После оплаты лимит обновится автоматически.",
        InlineKeyboardMarkup([
            [InlineKeyboardButton("💳 Перейти к оплате", url=pay_url)],
            [InlineKeyboardButton("🏠 В меню", callback_data="menu")],
        ]))

# ── БАЛАНС ───────────────────────────────────────────────────────────────────
async def view_balance(update, ctx):
    u = update.effective_user
    balance = get_balance(u.id)
    txs = get_balance_tx(u.id, limit=10)

    lines = [
        "💰 *Баланс*\n",
        f"💼 Текущий баланс: *{balance:.0f} ₽*\n",
    ]
    if txs:
        lines.append("📜 *Последние операции:*")
        for t in txs:
            sign = "+" if t["amount"] > 0 else ""
            kind_label = {
                "topup": "Пополнение",
                "referral": "Реферальный бонус",
                "spend": "Списание",
                "withdraw": "Вывод",
                "refund": "Возврат",
            }.get(t["kind"], t["kind"])
            desc = f" — {t['description']}" if t.get("description") else ""
            lines.append(
                f"  `{t['created_at']}` {sign}{t['amount']:.0f} ₽ "
                f"· {kind_label}{desc}"
            )
    else:
        lines.append("_Операций пока не было._")

    kb = InlineKeyboardMarkup([
        # [InlineKeyboardButton("⬆️ Пополнить", callback_data="topup")],
        [InlineKeyboardButton("⬇️ Вывести средства", callback_data="withdraw")],
        [InlineKeyboardButton("◀️ В меню", callback_data="menu")],
    ])
    await send_view(update, ctx, "\n".join(lines), kb)

TOPUP_AMOUNTS = [100, 300, 500, 1000, 2000]

async def view_topup(update, ctx):
    text = (
        "⬆️ *Пополнение баланса*\n\n"
        "Выберите сумму или введите свою (пришлите числом в чат):"
    )
    rows = [
        [InlineKeyboardButton(f"{a} ₽", callback_data=f"topupamt:{a}")]
        for a in TOPUP_AMOUNTS
    ]
    rows.append([InlineKeyboardButton("◀️ Назад", callback_data="balance")])
    ctx.user_data["awaiting_topup"] = True
    await send_view(update, ctx, text, InlineKeyboardMarkup(rows))

async def cb_topup_amount(update, ctx):
    q = update.callback_query
    await q.answer()
    amount = int(q.data.split(":", 1)[1])
    await _start_topup_payment(update, ctx, amount)

async def _start_topup_payment(update, ctx, amount: int):
    user = update.effective_user
    if amount < 50 or amount > 100000:
        await send_view(update, ctx,
            "❌ Сумма должна быть от 50 до 100 000 ₽",
            InlineKeyboardMarkup([[InlineKeyboardButton(
                "◀️ Назад", callback_data="balance")]]))
        return

    invoice_id = f"{user.id}_bal_{int(_now().timestamp())}"
    create_payment(
        invoice_id=invoice_id, user_id=user.id, amount=float(amount),
        days=0, tariff="balance", promo=None,
    )
    yk = await yk_create_payment(
        amount_rub=float(amount),
        description=f"УбежищеVPN · Пополнение баланса",
        invoice_id=invoice_id, return_url=RETURN_URL,
    )
    if not yk:
        await send_view(update, ctx, "❌ Не удалось создать платёж.",
            InlineKeyboardMarkup([[InlineKeyboardButton(
                "◀️ Назад", callback_data="balance")]]))
        return
    pay_url = yk["confirmation"]["confirmation_url"]
    text = (
        f"🧾 *Пополнение баланса*\n\n"
        f"Сумма: *{amount} ₽*\n\n"
        "После оплаты средства появятся на балансе автоматически."
    )
    await send_view(update, ctx, text, InlineKeyboardMarkup([
        [InlineKeyboardButton("💳 Перейти к оплате", url=pay_url)],
        [InlineKeyboardButton("◀️ Назад", callback_data="balance")],
    ]))
    ctx.user_data.pop("awaiting_topup", None)

async def view_withdraw(update, ctx):
    u = update.effective_user
    balance = get_balance(u.id)
    text = (
        "⬇️ *Вывод средств*\n\n"
        f"💼 Доступно: *{balance:.0f} ₽*\n\n"
        "Для вывода средств напишите в поддержку. "
        "Минимальная сумма к выводу — 300 ₽."
    )
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("✉️ Написать в поддержку", url=SUPPORT_URL)],
        [InlineKeyboardButton("◀️ Назад", callback_data="balance")],
    ])
    await send_view(update, ctx, text, kb)

# ── РЕФЕРАЛЬНАЯ СИСТЕМА ──────────────────────────────────────────────────────
async def view_referral(update, ctx):
    u = update.effective_user
    db_user = get_user(u.id) or {}
    referrals = get_referral_count(u.id)
    earned = float(db_user.get("total_earned") or 0)
    ref_link = f"https://t.me/{BOT_USERNAME}?start=ref_{u.id}"

    text = (
        "🎁 *Приведи друга*\n\n"
        f"Поделитесь ссылкой с другом. Когда он купит подписку — "
        f"вы получите *{REFERRAL_PERCENT}%* от его оплаты на баланс. "
        "Деньги можно тратить на VPN или вывести.\n\n"
        f"👥 Приглашено: *{referrals}*\n"
        f"💰 Всего заработано: *{earned:.0f} ₽*\n\n"
        "🔗 Ваша ссылка:\n"
        f"`{ref_link}`"
    )
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("💰 Баланс", callback_data="balance")],
        [InlineKeyboardButton("◀️ В меню", callback_data="menu")],
    ])
    await send_view(update, ctx, text, kb)

# ── ПОДДЕРЖКА ────────────────────────────────────────────────────────────────
async def view_support(update, ctx):
    # Экранируем username для Markdown — используем HTML-подобный
    # способ: просто не используем parse_mode для этого сообщения,
    # а форматируем вручную через MarkdownV2 или plain text.
    # Проще всего — убрать parse_mode и вставить ник как есть.
    support_handle = SUPPORT_USERNAME  # например "@ubezhishevpn_support"
    text = (
        "🛟 Поддержка\n\n"
        "Возникли вопросы или проблемы? Напишите нам — мы поможем.\n\n"
        f"Контакт: {support_handle}"
    )
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            "💬 Написать в поддержку", url=SUPPORT_URL
        )],
        [InlineKeyboardButton(
            "📄 Политика", url=POLICY_URL or RETURN_URL
        )],
        [InlineKeyboardButton(
            "📄 Соглашение", url=AGREEMENT_URL or RETURN_URL
        )],
        [InlineKeyboardButton("◀️ В меню", callback_data="menu")],
    ])
    # Намеренно без parse_mode — в тексте есть _ в нике
    if update.callback_query:
        try:
            await update.callback_query.edit_message_text(
                text, reply_markup=kb,
                disable_web_page_preview=True,
            )
            return
        except Exception:
            pass
    await ctx.bot.send_message(
        chat_id=update.effective_chat.id,
        text=text,
        reply_markup=kb,
        disable_web_page_preview=True,
    )

# ── ПРОМОКОД ─────────────────────────────────────────────────────────────────
async def view_promo(update, ctx):
    promo = ctx.user_data.get("promo")
    text = "🎟 *Промокод*\n\n"
    if promo:
        text += (
            f"Сейчас применён: `{promo['code']}` — "
            f"скидка {promo['discount']}%\n\n"
            "Чтобы заменить — пришлите новый код сообщением."
        )
    else:
        text += "Введите промокод одним сообщением."
    ctx.user_data["awaiting_promo"] = True
    kb = InlineKeyboardMarkup([
        [InlineKeyboardButton("◀️ В меню", callback_data="menu")],
    ])
    await send_view(update, ctx, text, kb)

# ── РЕФЕРАЛЬНЫЕ ОТЧИСЛЕНИЯ ───────────────────────────────────────────────────
def _get_ref_percent(referrer_id: int) -> int:
    count = get_referral_count(referrer_id)
    return REFERRAL_PERCENT if count < 100 else REFERRAL_PERCENT_LIMITED

async def _credit_referral(user_id: int, amount: float, ctx):
    """Начисляет реферу при покупке."""
    db_user = get_user(user_id)
    if not db_user:
        return
    ref = db_user.get("referrer_id")
    if not ref:
        return
    percent = _get_ref_percent(ref)
    bonus = round(amount * percent / 100, 2)
    if bonus <= 0:
        return
    add_balance(
        ref, bonus, "referral",
        f"{percent}% от оплаты пользователя id{user_id}"
    )
    try:
        await ctx.bot.send_message(
            chat_id=ref,
            text=(
                "🎉 *Реферальный бонус!*\n\n"
                f"Ваш приглашённый друг оплатил подписку.\n"
                f"На баланс зачислено: *{bonus:.2f} ₽*"
            ),
            parse_mode="Markdown",
        )
    except Exception as e:
        log.warning("notify referrer %s: %s", ref, e)

# ── /start ───────────────────────────────────────────────────────────────────
async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    u = update.effective_user
    ref = None
    region = None
    if ctx.args:
        parts = ctx.args[0].split("_")
        i = 0
        while i < len(parts):
            part = parts[i]
            if part == "ref" and i + 1 < len(parts):
                try:
                    cand = int(parts[i + 1])
                    if cand != u.id:
                        ref = cand
                except ValueError:
                    pass
                i += 2
                continue
            if part == "reg" and i + 1 < len(parts):
                region = parts[i + 1]
                i += 2
                continue
            i += 1
    ensure_user(u.id, u.username or "", ref, region)
    await view_main_menu(update, ctx)

# ── Текстовые сообщения ──────────────────────────────────────────────────────
async def on_text(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = (update.message.text or "").strip()

    # Промокод
    if ctx.user_data.get("awaiting_promo"):
        ctx.user_data.pop("awaiting_promo", None)
        code = text.upper()
        u = update.effective_user
        promo = get_promo(code)
        if not promo:
            await update.message.reply_text("❌ Промокод не найден.")
            await view_main_menu(update, ctx)
            return
        if promo["uses_left"] == 0:
            await update.message.reply_text("❌ Промокод исчерпан.")
            return
        if has_user_used_promo(code, u.id):
            await update.message.reply_text(
                "❌ Вы уже использовали этот промокод."
            )
            return
        ctx.user_data["promo"] = {
            "code": code, "discount": promo["discount"]
        }
        await update.message.reply_text(
            f"✅ Промокод `{code}` применён — скидка {promo['discount']}%",
            parse_mode="Markdown",
        )
        await view_buy(update, ctx)
        return

    # Своя сумма для пополнения
    if ctx.user_data.get("awaiting_topup"):
        try:
            amount = int(text)
            await _start_topup_payment(update, ctx, amount)
        except ValueError:
            await update.message.reply_text(
                "❌ Введите число — сумму в рублях."
            )
        return

    # По умолчанию — главное меню
    await view_main_menu(update, ctx)

# ── CALLBACK-роутер ──────────────────────────────────────────────────────────
async def on_callback(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    data = q.data or ""
    try:
        if data == "menu":
            await q.answer()
            await view_main_menu(update, ctx); return
        if data == "cabinet":
            await q.answer()
            await view_cabinet(update, ctx); return
        if data == "subs":
            await q.answer()
            await view_subs(update, ctx); return
        if data.startswith("sub:"):
            await q.answer()
            await view_sub_details(update, ctx, int(data.split(":")[1]))
            return
        if data.startswith("devs:"):
            await q.answer()
            await view_devices(update, ctx, int(data.split(":")[1]))
            return
        if data.startswith("delr:"):
            await cb_delete_device(update, ctx); return
        if data.startswith("adddev:"):
            await cb_add_devices(update, ctx); return
        if data == "devbal":
            await cb_devices_balance(update, ctx); return
        if data == "devcard":
            await cb_devices_card(update, ctx); return
        if data == "connect":
            await q.answer()
            await view_connect(update, ctx); return
        if data.startswith("inst:"):
            await cb_install(update, ctx); return
        if data == "buy":
            await q.answer()
            await view_buy(update, ctx); return
        if data.startswith("buy:"):
            await cb_buy_tariff(update, ctx); return
        if data.startswith("paybal:"):
            await cb_pay_balance(update, ctx); return
        if data.startswith("paycard:"):
            await cb_pay_card(update, ctx); return
        if data == "balance":
            await q.answer()
            await view_balance(update, ctx); return
        if data == "topup":
            await q.answer()
            await view_topup(update, ctx); return
        if data.startswith("topupamt:"):
            await cb_topup_amount(update, ctx); return
        if data == "withdraw":
            await q.answer()
            await view_withdraw(update, ctx); return
        if data == "referral":
            await q.answer()
            await view_referral(update, ctx); return
        if data == "promo":
            await q.answer()
            await view_promo(update, ctx); return
        if data == "support":
            await q.answer()
            await view_support(update, ctx); return
        await q.answer()
    except Exception as e:
        log.exception("callback error: %s", e)
        try:
            await q.answer("Ошибка, попробуйте ещё раз", show_alert=True)
        except Exception:
            pass

# ── НАПОМИНАНИЯ О ПРОДЛЕНИИ ──────────────────────────────────────────────────
async def _send_renewal_reminder(bot, user_id: int, sub: dict, hours: int) -> bool:
    name = sub.get("remna_username") or f"#{sub['id']}"
    label = _hours_label(hours)
    exp = _parse_expires(sub["expires_at"])
    exp_str = _fmt_short(exp)

    text = (
        f"⏰ *До конца подписки осталось {label}*\n\n"
        f"Подписка *{name}* истекает *{exp_str}*.\n"
        "Продлите сейчас, чтобы не потерять доступ 🛡"
    )
    kb = InlineKeyboardMarkup([[
        InlineKeyboardButton("🔄 Продлить подписку", callback_data="buy")
    ]])
    try:
        await bot.send_message(
            chat_id=user_id, text=text,
            parse_mode="Markdown", reply_markup=kb,
        )
        return True
    except Exception as e:
        log.warning("reminder send user=%s hours=%s: %s", user_id, hours, e)
        return False

async def _check_reminders(bot):
    now = _now()
    for sub in get_active_subscriptions():
        try:
            exp = _parse_expires(sub["expires_at"])
            seconds_left = (exp - now).total_seconds()
            if seconds_left <= 0:
                continue
            for hours in REMINDER_THRESHOLDS_H:
                if seconds_left <= _threshold_real_seconds(hours):
                    if not check_reminder_sent(sub["id"], hours, sub["expires_at"]):
                        sent = await _send_renewal_reminder(
                            bot, sub["user_id"], sub, hours
                        )
                        if sent:
                            mark_reminder_sent(sub["id"], hours, sub["expires_at"])
        except Exception as e:
            log.warning("check reminder sub=%s: %s", sub.get("id"), e)

async def _reminder_loop(bot):
    interval = _reminder_interval()
    log.info(
        "Reminder loop started: interval=%.0fs, TIME_MULTIPLIER=%.1f, "
        "thresholds=%s",
        interval, TIME_MULTIPLIER,
        [f"{h}h→{int(_threshold_real_seconds(h))}s" for h in REMINDER_THRESHOLDS_H],
    )
    while True:
        await asyncio.sleep(interval)
        try:
            await _check_reminders(bot)
        except Exception as e:
            log.exception("reminder loop error: %s", e)

# ── АДМИН-КОМАНДЫ ────────────────────────────────────────────────────────────
async def cmd_admin_prices(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not _is_admin(update.effective_user.id):
        return
    cur = _prices_overridden()
    new = "0" if cur else "1"
    set_setting("price_override", new)
    await update.message.reply_text(
        f"⚙️ Цены сейчас: *{'1 ₽ (тест)' if new == '1' else 'обычные'}*",
        parse_mode="Markdown",
    )

async def cmd_admin_expire(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    u = update.effective_user
    if not _is_admin(u.id):
        return
    target_id = u.id
    if ctx.args:
        try:
            target_id = int(ctx.args[0])
        except ValueError:
            await update.message.reply_text("❌ Укажи числовой user\_id")
            return

    active = get_latest_active_sub(target_id)
    if not active:
        await update.message.reply_text(
            f"❌ Нет активной подписки у user\_id=`{target_id}`",
            parse_mode="Markdown",
        )
        return

    past_exp = _now() + timedelta(minutes=1)
    extend_sub(active["id"], _fmt(past_exp))

    if active.get("remna_uuid"):
        await remna.update_user_expire(active["remna_uuid"], past_exp)

    await update.message.reply_text(
        f"✅ Подписка `#{active['id']}` пользователя `{target_id}` истекла.",
        parse_mode="Markdown",
    )


async def cmd_admin_reset(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    u = update.effective_user
    if not _is_admin(u.id):
        return
    # Удаляем все подписки в Remnawave
    subs = get_user_subs(u.id)
    for s in subs:
        if s.get("remna_uuid"):
            try:
                await remna.delete_user(s["remna_uuid"])
            except Exception as e:
                log.warning("delete_user remna: %s", e)
    delete_user_data(u.id)
    ctx.user_data.clear()
    await update.message.reply_text(
        "✅ Ваши данные удалены. Используйте /start, чтобы начать заново."
    )

async def cmd_admin_remind_test(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Немедленно отправляет все 5 напоминаний — проверка формата сообщений."""
    if not _is_admin(update.effective_user.id):
        return
    u = update.effective_user
    active = get_latest_active_sub(u.id)
    if not active:
        await update.message.reply_text("❌ Нет активной подписки.")
        return
    for hours in REMINDER_THRESHOLDS_H:
        await _send_renewal_reminder(ctx.bot, u.id, active, hours)
    thresholds_info = ", ".join(
        f"{h}ч→{int(_threshold_real_seconds(h))}с"
        for h in REMINDER_THRESHOLDS_H
    )
    await update.message.reply_text(
        f"✅ Отправлено {len(REMINDER_THRESHOLDS_H)} напоминаний.\n"
        f"TIME\_MULTIPLIER={TIME_MULTIPLIER:.0f}\n"
        f"Интервал проверки: {int(_reminder_interval())}с\n"
        f"Пороги: {thresholds_info}",
        parse_mode="Markdown",
    )

async def cmd_admin_set_expire(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Устанавливает истечение активной подписки через N минут (для тестирования напоминаний)."""
    if not _is_admin(update.effective_user.id):
        return
    u = update.effective_user
    minutes = 25
    if ctx.args:
        try:
            minutes = int(ctx.args[0])
        except ValueError:
            await update.message.reply_text("❌ Укажи количество минут")
            return

    active = get_latest_active_sub(u.id)
    if not active:
        await update.message.reply_text("❌ Нет активной подписки.")
        return

    new_exp = _now() + timedelta(minutes=minutes)
    extend_sub(active["id"], _fmt(new_exp))
    if active.get("remna_uuid"):
        await remna.update_user_expire(active["remna_uuid"], new_exp)

    thresholds_info = ", ".join(
        f"{h}ч→{int(_threshold_real_seconds(h))}с"
        for h in REMINDER_THRESHOLDS_H
    )
    await update.message.reply_text(
        f"✅ Подписка истекает через {minutes} мин. (`{_fmt(new_exp)} UTC`)\n"
        f"TIME\_MULTIPLIER={TIME_MULTIPLIER:.0f}\n"
        f"Пороги: {thresholds_info}\n"
        f"Интервал проверки: {int(_reminder_interval())}с",
        parse_mode="Markdown",
    )

# ── Webhook on_paid ──────────────────────────────────────────────────────────
async def post_init(app_tg: Application):
    async def on_paid(
        *,
        kind: str,
        user_id: int,
        days: int = 0,
        amount: float = 0.0,
        tariff: str = "",
        invoice_id: str = "",
    ):
        log.info(
            "on_paid: kind=%s user_id=%s tariff=%s days=%s amount=%s",
            kind, user_id, tariff, days, amount
        )

        # ── Пополнение баланса ───────────────────────────────────────────
        if kind == "balance_topup":
            add_balance(
                user_id, float(amount), "topup",
                "Пополнение через ЮKassa"
            )
            try:
                await app_tg.bot.send_message(
                    chat_id=user_id,
                    text=(
                        "✅ Баланс пополнен!\n\n"
                        f"Зачислено: {amount:.0f} ₽\n"
                        f"Текущий баланс: {get_balance(user_id):.0f} ₽"
                    ),
                    reply_markup=InlineKeyboardMarkup([[
                        InlineKeyboardButton(
                            "🏠 В меню", callback_data="menu"
                        )
                    ]]),
                )
            except Exception as e:
                log.error("notify topup user=%s: %s", user_id, e)
            return

        # ── Добавление устройств ─────────────────────────────────────────
        if kind == "devices":
            ok, new_limit = await add_devices(user_id)
            try:
                if ok:
                    await app_tg.bot.send_message(
                        chat_id=user_id,
                        text=(
                            f"✅ Устройства добавлены!\n\n"
                            f"Новый лимит: {new_limit} "
                            f"{_plural_devices(new_limit)}."
                        ),
                        reply_markup=InlineKeyboardMarkup([[
                            InlineKeyboardButton(
                                "📋 Мои подписки",
                                callback_data="subs"
                            )
                        ]]),
                    )
                else:
                    await app_tg.bot.send_message(
                        chat_id=user_id,
                        text=(
                            "⚠️ Оплата получена, но не удалось обновить "
                            f"лимит устройств.\n"
                            f"Напишите в поддержку: {SUPPORT_USERNAME}"
                        ),
                    )
            except Exception as e:
                log.error("notify devices user=%s: %s", user_id, e)
            return

        # ── Реферальный бонус (дни) (пока заглушен) ──────────────────────────────────────
        if kind == "referral_bonus":
            return
            db_user = get_user(user_id)
            ok, _, exp, _ = await issue_or_extend(
                user_id,
                (db_user or {}).get("username", ""),
                days,
                "referral",
            )
            if ok:
                try:
                    await app_tg.bot.send_message(
                        chat_id=user_id,
                        text=(
                            f"🎉 Реферальный бонус!\n"
                            f"Ваш приглашённый друг оплатил подписку — "
                            f"вам +{days} дней.\n"
                            f"Новая дата окончания: {_fmt(exp)} UTC"
                        ),
                    )
                except Exception as e:
                    log.warning(
                        "notify referral_bonus user=%s: %s", user_id, e
                    )
            return

        # ── Покупка подписки ─────────────────────────────────────────────
        if kind == "purchase":
            db_user = get_user(user_id)
            ok, sub_url, exp, _ = await issue_or_extend(
                user_id,
                (db_user or {}).get("username", ""),
                days,
                tariff,
            )
            if ok:
                # Реферальные 10% от суммы оплаты
                if amount > 0:
                    ref_id = (db_user or {}).get("referrer_id")
                    if ref_id:
                        percent = _get_ref_percent(ref_id)
                        bonus = round(amount * percent / 100, 2)
                        add_balance(
                            ref_id, bonus, "referral",
                            f"{percent}% от оплаты id{user_id}"
                        )
                        try:
                            await app_tg.bot.send_message(
                                chat_id=ref_id,
                                text=(
                                    "🎉 Реферальный бонус!\n\n"
                                    "Ваш приглашённый друг купил подписку.\n"
                                    f"На баланс зачислено: {bonus:.2f} ₽"
                                ),
                            )
                        except Exception:
                            pass

                if tariff == "trial":
                    tariff_label = "Пробный"
                elif tariff in TARIFFS:
                    months = TARIFFS[tariff]["days"] // 30
                    suffix = "а" if months in (2, 3, 4) else ""
                    tariff_label = f"{months} месяц{suffix}"
                else:
                    tariff_label = tariff or "—"
                try:
                    await app_tg.bot.send_message(
                        chat_id=user_id,
                        parse_mode="Markdown",
                        text=(
                            "✅ *Оплата прошла успешно!*\n\n"
                            f"Тариф: *{tariff_label}*\n"
                            f"Действует до: `{_fmt(exp)} UTC`\n\n"
                            f"🔗 Ссылка подписки:\n(нажмите чтобы скопировать)\n`{sub_url}`"
                        ),
                        reply_markup=post_payment_kb(),
                    )
                except Exception as e:
                    log.error(
                        "notify purchase user=%s: %s", user_id, e
                    )
            else:
                log.error(
                    "issue_or_extend вернул False user=%s", user_id
                )
                try:
                    await app_tg.bot.send_message(
                        chat_id=user_id,
                        text=(
                            "⚠️ Оплата получена, но не удалось выдать "
                            "подписку автоматически.\n"
                            f"Напишите в поддержку: {SUPPORT_USERNAME}"
                        ),
                    )
                except Exception:
                    pass
            return

        log.warning("on_paid: неизвестный kind=%s", kind)

    webhook_server.on_paid_callback = on_paid
    asyncio.create_task(_reminder_loop(app_tg.bot))

    runner = web.AppRunner(webhook_server.make_app())
    await runner.setup()
    site = web.TCPSite(runner, WEBHOOK_HOST, WEBHOOK_PORT)
    await site.start()
    log.info("Webhook сервер запущен: %s:%s", WEBHOOK_HOST, WEBHOOK_PORT)

# ── main ─────────────────────────────────────────────────────────────────────
def main():
    init_db()

    app = (
        Application.builder()
        .token(BOT_TOKEN)
        .post_init(post_init)
        .build()
    )

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("menu", cmd_start))
    app.add_handler(CommandHandler("admin_prices",      cmd_admin_prices))
    app.add_handler(CommandHandler("admin_reset",       cmd_admin_reset))
    app.add_handler(CommandHandler("admin_expire",      cmd_admin_expire))
    app.add_handler(CommandHandler("admin_remind_test", cmd_admin_remind_test))
    app.add_handler(CommandHandler("admin_set_expire",  cmd_admin_set_expire))

    app.add_handler(CallbackQueryHandler(on_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_text))

    log.info("Бот запущен")
    app.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True,
    )

if __name__ == "__main__":
    main()