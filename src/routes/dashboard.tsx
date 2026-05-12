import { createFileRoute, redirect, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  LogOut, User, Send, Copy, Check, ExternalLink, Wallet,
  Smartphone, Trash2, ChevronDown, ChevronUp, CreditCard,
  ShieldCheck, MessageCircle, Plus, Bot,
} from "lucide-react";
import { logoutFn } from "@/api/auth";
import {
  getDashboardDataFn, getDevicesFn, deleteDeviceFn,
  type Subscription, type Device,
} from "@/api/dashboard";
import {
  getTariffsFn, activateTrialFn, buyWithBalanceFn,
  createCardPaymentFn, buyDevicesWithBalanceFn, createDevicesCardPaymentFn,
} from "@/api/payment";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: "/login" });
  },
  loader: () => getDashboardDataFn(),
  component: DashboardPage,
});

function formatDate(s: string) {
  return new Date(s.replace(" ", "T") + ":00Z").toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isExpired(s: string) {
  return new Date(s.replace(" ", "T") + ":00Z") < new Date();
}

function daysLeft(s: string): number {
  const ms = new Date(s.replace(" ", "T") + ":00Z").getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

// ── Devices section ────────────────────────────────────────────────────────

function DevicesSection({
  sub,
  onDevicesChanged,
}: {
  sub: Subscription;
  onDevicesChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addPayUrl, setAddPayUrl] = useState<string | null>(null);

  async function loadDevices() {
    setLoading(true);
    try {
      const list = await getDevicesFn({ data: { remnaUuid: sub.remna_uuid } });
      setDevices(list);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    if (!open) loadDevices();
    setOpen((v) => !v);
    setAddMode(false);
    setAddPayUrl(null);
  }

  async function handleDelete(hwid: string) {
    setDeleting(hwid);
    try {
      await deleteDeviceFn({ data: { remnaUuid: sub.remna_uuid, hwid } });
      setDevices((prev) => prev?.filter((d) => d.hwid !== hwid) ?? null);
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  }

  async function handleAddWithBalance() {
    setAddLoading(true);
    setAddError(null);
    try {
      await buyDevicesWithBalanceFn({ data: { subId: sub.id } });
      onDevicesChanged();
      setAddMode(false);
      setAddPayUrl(null);
      await loadDevices();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleAddWithCard() {
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await createDevicesCardPaymentFn({ data: { subId: sub.id } });
      setAddPayUrl(res.paymentUrl);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setAddLoading(false);
    }
  }

  const used = devices?.length ?? "...";

  return (
    <div className="border-t pt-3 mt-1">
      <button
        onClick={toggle}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Smartphone className="w-4 h-4" />
        <span>Устройства ({used}/{sub.devices})</span>
        {open ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {loading && <p className="text-xs text-muted-foreground">Загрузка...</p>}

          {!loading && devices && devices.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Нет подключённых устройств</p>
          )}

          {!loading && devices && devices.map((d, i) => (
            <div key={d.hwid} className="flex items-center justify-between text-sm bg-surface rounded-lg px-3 py-1.5">
              <span className="truncate">{i + 1}. {d.deviceModel || "Устройство"}</span>
              <button
                onClick={() => handleDelete(d.hwid)}
                disabled={deleting === d.hwid}
                className="ml-2 shrink-0 p-1 rounded hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                title="Удалить устройство"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {!addMode && !addPayUrl && (
            <button
              onClick={() => setAddMode(true)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
            >
              <Plus className="w-3 h-3" />
              +2 устройства · 50 ₽
            </button>
          )}

          {addMode && !addPayUrl && (
            <div className="space-y-2 mt-2">
              <p className="text-xs text-muted-foreground">Добавить +2 устройства · <strong>50 ₽</strong></p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleAddWithBalance}
                  disabled={addLoading}
                  className="text-xs px-3 py-1.5 rounded-lg border hover:bg-surface transition-colors disabled:opacity-50"
                >
                  💼 С баланса
                </button>
                <button
                  onClick={handleAddWithCard}
                  disabled={addLoading}
                  className="text-xs px-3 py-1.5 rounded-lg border hover:bg-surface transition-colors disabled:opacity-50"
                >
                  💳 Картой
                </button>
                <button
                  onClick={() => { setAddMode(false); setAddError(null); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Отмена
                </button>
              </div>
              {addError && <p className="text-xs text-destructive">{addError}</p>}
            </div>
          )}

          {addPayUrl && (
            <div className="space-y-2 mt-2">
              <p className="text-xs text-muted-foreground">Перейдите к оплате для добавления устройств</p>
              <a
                href={addPayUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg vpn-primary-button text-white font-medium"
              >
                <CreditCard className="w-3 h-3" />
                Перейти к оплате
              </a>
              <button
                onClick={() => setAddPayUrl(null)}
                className="ml-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Subscription card ──────────────────────────────────────────────────────

function SubCard({
  sub,
  onChanged,
}: {
  sub: Subscription;
  onChanged: () => void;
}) {
  const expired = isExpired(sub.expires_at);
  const [copied, setCopied] = useState(false);

  const name = sub.remna_username ?? `#${sub.id}`;

  async function copyUrl() {
    await navigator.clipboard.writeText(sub.sub_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-semibold font-mono">{name}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              expired
                ? "bg-destructive/15 text-destructive"
                : "bg-green-500/15 text-green-500"
            }`}
          >
            {expired ? "Истекла" : "Активна"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {sub.devices} уст.
        </span>
      </div>

      <div className="text-sm text-muted-foreground space-y-0.5">
        <p>До {formatDate(sub.expires_at)}</p>
        {!expired && (
          <p className="text-xs">Осталось {daysLeft(sub.expires_at)} дн.</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 text-xs font-mono text-muted-foreground bg-surface rounded-lg px-3 py-1.5 truncate">
          {sub.sub_url}
        </div>
        <button
          onClick={copyUrl}
          className="shrink-0 p-1.5 rounded-lg border hover:bg-surface transition-colors"
          title="Скопировать ссылку"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      <DevicesSection sub={sub} onDevicesChanged={onChanged} />
    </div>
  );
}

// ── Buy section ────────────────────────────────────────────────────────────

type Tariff = { key: string; days: number; priceRub: number; label: string };
type BuyStep =
  | "idle"
  | "tariff"
  | { step: "payment"; tariff: Tariff }
  | { step: "link"; paymentUrl: string; label: string }
  | { step: "done"; message: string };

function BuySection({
  balance,
  hasActiveSub,
  onPurchased,
}: {
  balance: number;
  hasActiveSub: boolean;
  onPurchased: () => void;
}) {
  const [state, setState] = useState<BuyStep>("idle");
  const [tariffs, setTariffs] = useState<Tariff[] | null>(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setError(null);
    setLoading(true);
    try {
      const data = await getTariffsFn();
      setTariffs(data.tariffs as Tariff[]);
      setTrialUsed(data.trialUsed);
      setState("tariff");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setState("idle");
    setError(null);
  }

  async function selectTariff(t: Tariff) {
    setError(null);
    if (t.key === "trial") {
      setLoading(true);
      try {
        await activateTrialFn();
        setState({ step: "done", message: "✅ Пробная подписка активирована!" });
        onPurchased();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
      } finally {
        setLoading(false);
      }
      return;
    }
    setState({ step: "payment", tariff: t });
  }

  async function payWithBalance(t: Tariff) {
    setLoading(true);
    setError(null);
    try {
      await buyWithBalanceFn({ data: { tariff: t.key as "m1" | "m3" | "m12" } });
      setState({ step: "done", message: "✅ Подписка активирована! Баланс списан." });
      onPurchased();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function payWithCard(t: Tariff) {
    setLoading(true);
    setError(null);
    try {
      const res = await createCardPaymentFn({ data: { tariff: t.key as "m1" | "m3" | "m12" } });
      setState({ step: "link", paymentUrl: res.paymentUrl, label: t.label });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  const btnLabel = hasActiveSub ? "🔄 Продлить подписку" : "💳 Купить подписку";

  if (state === "idle") {
    return (
      <div>
        <button
          onClick={open}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white vpn-primary-button transition-all hover:brightness-110 disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading ? "Загрузка..." : btnLabel}
        </button>
        {error && <p className="mt-2 text-sm text-destructive text-center">{error}</p>}
      </div>
    );
  }

  if (state === "tariff") {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Выберите тариф</h2>
          <button onClick={cancel} className="text-sm text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="space-y-2">
          {tariffs?.map((t) => {
            if (t.key === "trial" && trialUsed) return null;
            return (
              <button
                key={t.key}
                onClick={() => selectTariff(t)}
                disabled={loading}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors hover:bg-surface disabled:opacity-50 ${
                  t.key === "m3" ? "border-primary/50 bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.label}</span>
                  {t.key === "m3" && (
                    <span className="text-xs text-primary font-medium">Выгодно</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.days} дней</p>
              </button>
            );
          })}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (typeof state === "object" && state.step === "payment") {
    const t = state.tariff;
    const canUseBalance = balance >= t.priceRub;
    return (
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Оплата</h2>
            <p className="text-sm text-muted-foreground">{t.label}</p>
          </div>
          <button onClick={() => setState("tariff")} className="text-sm text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <p className="text-sm text-muted-foreground">
          Баланс: <strong>{balance.toFixed(2)} ₽</strong>
        </p>

        <div className="space-y-2">
          {canUseBalance && (
            <button
              onClick={() => payWithBalance(t)}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border font-medium text-sm hover:bg-surface transition-colors disabled:opacity-50"
            >
              💼 С баланса ({t.priceRub} ₽)
            </button>
          )}
          <button
            onClick={() => payWithCard(t)}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-white text-sm vpn-primary-button transition-all hover:brightness-110 disabled:opacity-60 disabled:pointer-events-none"
          >
            <span className="flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" />
              {loading ? "Создаём платёж..." : `Оплатить картой (${t.priceRub} ₽)`}
            </span>
          </button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (typeof state === "object" && state.step === "link") {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-semibold">Оплата через ЮKassa</h2>
            <p className="text-sm text-muted-foreground">{state.label}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          После оплаты подписка будет выдана автоматически. Вернитесь на эту страницу — данные обновятся.
        </p>
        <div className="flex gap-2 flex-wrap">
          <a
            href={state.paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm vpn-primary-button"
          >
            <CreditCard className="w-4 h-4" />
            Перейти к оплате
          </a>
          <button
            onClick={cancel}
            className="px-4 py-2.5 rounded-xl border text-sm hover:bg-surface transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  if (typeof state === "object" && state.step === "done") {
    return (
      <div className="rounded-xl border bg-green-500/10 p-4 text-center">
        <p className="font-medium text-green-600">{state.message}</p>
        <button
          onClick={cancel}
          className="mt-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Закрыть
        </button>
      </div>
    );
  }

  return null;
}

// ── Dashboard page ─────────────────────────────────────────────────────────

function DashboardPage() {
  const { account, subscriptions, balance } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();

  const SUPPORT_URL = "https://t.me/ubezhishevpn_support";

  async function handleLogout() {
    await logoutFn();
    await navigate({ to: "/" });
  }

  async function handlePurchased() {
    await router.invalidate();
  }

  const hasActiveSub = subscriptions.some((s) => !isExpired(s.expires_at));

  return (
    <div className="min-h-screen vpn-page-bg">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            Убежище<span className="text-primary">VPN</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>

        {/* Account card */}
        <div className="rounded-xl border bg-card p-5 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <User className="w-4 h-4" />
            <span>Аккаунт</span>
          </div>
          <p className="font-semibold text-lg">{account.name ?? account.email}</p>
          {account.name && <p className="text-sm text-muted-foreground">{account.email}</p>}
          {account.telegram_user_id ? (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Send className="w-3.5 h-3.5" />
              Telegram привязан (ID: {account.telegram_user_id})
            </p>
          ) : (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Bot className="w-3.5 h-3.5" />
              Для синхронизации с ботом перейдите в профиль в{" "}
              <a
                href="https://t.me/vpnasylum_bot"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                @vpnasylum_bot
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          )}
        </div>

        {/* Balance — only shown when Telegram is linked */}

        {/* Subscriptions */}
        {subscriptions.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold">Подписки</h2>
            {subscriptions.map((sub) => (
              <SubCard key={sub.id} sub={sub} onChanged={handlePurchased} />
            ))}
          </div>
        )}

        {/* Buy section */}
        <BuySection
          balance={Number(balance)}
          hasActiveSub={hasActiveSub}
          onPurchased={handlePurchased}
        />

        {/* No subs hint */}
        {subscriptions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Нет активных подписок. Купите выше или оформите через{" "}
            <a
              href="https://t.me/vpnasylum_bot"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              @vpnasylum_bot
            </a>
            .
          </p>
        )}

        {/* {account.telegram_user_id && (
          <div className="rounded-xl border bg-card p-5 flex items-center gap-3">
            <Wallet className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Вы заработали:</p>
              <p className="font-semibold text-lg">{Number(balance).toFixed(2)} ₽</p>
              <p className="text-xs text-muted-foreground">Рекомендуйте наш VPN по вашей реферальной ссылке и получайте процент! 
                Пока доступно только в боте <a
                href="https://t.me/vpnasylum_bot"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline">
                  
                @vpnasylum_bot
              </a>  
              </p>
            </div>
          </div>
        )} */}

        {/* Support */}
        <div className="rounded-xl border bg-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span>Вопросы? Мы поможем</span>
          </div>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Написать
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
