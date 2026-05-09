import { createFileRoute, redirect, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, User, Send, Copy, Check, ExternalLink, Wallet } from "lucide-react";
import { logoutFn } from "@/api/auth";
import { getDashboardDataFn, linkTelegramFn, type Subscription } from "@/api/dashboard";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: "/login" });
  },
  loader: () => getDashboardDataFn(),
  component: DashboardPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isExpired(iso: string) {
  return new Date(iso) < new Date();
}

function SubCard({ sub }: { sub: Subscription }) {
  const expired = isExpired(sub.expires_at);
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    await navigator.clipboard.writeText(sub.sub_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{sub.tariff ?? "Подписка"}</span>
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
        <span className="text-xs text-muted-foreground">{sub.devices} уст.</span>
      </div>

      <div className="text-sm text-muted-foreground">До {formatDate(sub.expires_at)}</div>

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
    </div>
  );
}

function LinkTelegramCard({ onLinked }: { onLinked: () => Promise<void> }) {
  const [telegramId, setTelegramId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await linkTelegramFn({ data: { telegramId } });
      await onLinked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка привязки");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Send className="w-5 h-5 text-[var(--telegram,#2AABEE)]" />
        <h2 className="font-semibold">Привязать Telegram аккаунт</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Привяжите ваш Telegram, чтобы видеть подписки из бота{" "}
        <a
          href="https://t.me/vpnasylum_bot"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-0.5"
        >
          @vpnasylum_bot
          <ExternalLink className="w-3 h-3" />
        </a>
        .
      </p>

      <div className="text-sm text-muted-foreground bg-surface rounded-lg p-3 space-y-1">
        <p className="font-medium text-foreground">Как узнать свой Telegram ID:</p>
        <p>
          1. Откройте Telegram и напишите боту{" "}
          <span className="font-mono">@userinfobot</span>
        </p>
        <p>2. Отправьте любое сообщение</p>
        <p>3. Скопируйте число из поля «Id»</p>
      </div>

      <form onSubmit={handleLink} className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="\d+"
          placeholder="123456789"
          value={telegramId}
          onChange={(e) => setTelegramId(e.target.value.replace(/\D/g, ""))}
          className="flex-1 border rounded-lg px-3 py-2 bg-surface text-sm outline-none focus:ring-2 focus:ring-primary/50"
          required
        />
        <button
          type="submit"
          disabled={loading || !telegramId}
          className="px-4 py-2 rounded-xl font-semibold text-white vpn-primary-button text-sm transition-all hover:brightness-110 disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading ? "..." : "Привязать"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}

function DashboardPage() {
  const { account, subscriptions, balance } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();

  async function handleLogout() {
    await logoutFn();
    await navigate({ to: "/" });
  }

  async function handleLinked() {
    await router.invalidate();
  }

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
          {account.telegram_user_id && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Send className="w-3.5 h-3.5" />
              Telegram привязан (ID: {account.telegram_user_id})
            </p>
          )}
        </div>

        {/* Balance (only when Telegram linked) */}
        {account.telegram_user_id && (
          <div className="rounded-xl border bg-card p-5 flex items-center gap-3">
            <Wallet className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Баланс</p>
              <p className="font-semibold text-lg">{Number(balance).toFixed(2)} ₽</p>
            </div>
          </div>
        )}

        {/* Subscriptions or link telegram */}
        {!account.telegram_user_id ? (
          <LinkTelegramCard onLinked={handleLinked} />
        ) : subscriptions.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            <p>
              Подписок нет. Оформите подписку через{" "}
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
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-semibold">Подписки</h2>
            {subscriptions.map((sub) => (
              <SubCard key={sub.id} sub={sub} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
