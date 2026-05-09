import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, User, Send, Wallet, MessageCircle, ExternalLink, Check, Copy, CreditCard, ShieldCheck, Smartphone, ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import { c as createSsrRpc, R as Route, a as logoutFn, b as linkTelegramFn, d as deleteDeviceFn, g as getDevicesFn } from "./router-OtYyjvOl.js";
import { z } from "zod";
import { c as createServerFn } from "../server.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const getTariffsFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("01de0cac8f889cb4d5afad5c26402c1af217daf297b3c7e844cfae2f78cfabf3"));
const activateTrialFn = createServerFn({
  method: "POST"
}).handler(createSsrRpc("2d4912260aae0e2821f9a0473278079ece7a3b1f4bd3577caa311c66b869ea75"));
const buyWithBalanceFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  tariff: z.enum(["m1", "m3", "m12"])
})).handler(createSsrRpc("7d560aef9e5947215ae66ac310a915d04cb56938536dc3b73e7a8fa0eee4296b"));
const createCardPaymentFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  tariff: z.enum(["m1", "m3", "m12"])
})).handler(createSsrRpc("a674a4b7e6b570e9ead43c412717189958e8e03b41ab710763411b5e1960f270"));
const buyDevicesWithBalanceFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  subId: z.number().int().positive()
})).handler(createSsrRpc("dc53a6730c47ab72c4cc3a3683164d584a74cd2688784c5cf65e571c0c8fbf1a"));
const createDevicesCardPaymentFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  subId: z.number().int().positive()
})).handler(createSsrRpc("106d2db918fd7a0e558d1ee9877ca8987d3cd98bd97ed55dcb71e0108b079c4b"));
function formatDate(s) {
  return (/* @__PURE__ */ new Date(s.replace(" ", "T") + ":00Z")).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}
function isExpired(s) {
  return /* @__PURE__ */ new Date(s.replace(" ", "T") + ":00Z") < /* @__PURE__ */ new Date();
}
function daysLeft(s) {
  const ms = (/* @__PURE__ */ new Date(s.replace(" ", "T") + ":00Z")).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 864e5));
}
function DevicesSection({
  sub,
  onDevicesChanged
}) {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [addMode, setAddMode] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addPayUrl, setAddPayUrl] = useState(null);
  async function loadDevices() {
    setLoading(true);
    try {
      const list = await getDevicesFn({
        data: {
          remnaUuid: sub.remna_uuid
        }
      });
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
  async function handleDelete(hwid) {
    setDeleting(hwid);
    try {
      await deleteDeviceFn({
        data: {
          remnaUuid: sub.remna_uuid,
          hwid
        }
      });
      setDevices((prev) => prev?.filter((d) => d.hwid !== hwid) ?? null);
    } catch {
    } finally {
      setDeleting(null);
    }
  }
  async function handleAddWithBalance() {
    setAddLoading(true);
    setAddError(null);
    try {
      await buyDevicesWithBalanceFn({
        data: {
          subId: sub.id
        }
      });
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
      const res = await createDevicesCardPaymentFn({
        data: {
          subId: sub.id
        }
      });
      setAddPayUrl(res.paymentUrl);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setAddLoading(false);
    }
  }
  const used = devices?.length ?? "...";
  return /* @__PURE__ */ jsxs("div", { className: "border-t pt-3 mt-1", children: [
    /* @__PURE__ */ jsxs("button", { onClick: toggle, className: "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full", children: [
      /* @__PURE__ */ jsx(Smartphone, { className: "w-4 h-4" }),
      /* @__PURE__ */ jsxs("span", { children: [
        "Устройства (",
        used,
        "/",
        sub.devices,
        ")"
      ] }),
      open ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-3 h-3 ml-auto" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-3 h-3 ml-auto" })
    ] }),
    open && /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-2", children: [
      loading && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Загрузка..." }),
      !loading && devices && devices.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground italic", children: "Нет подключённых устройств" }),
      !loading && devices && devices.map((d, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm bg-surface rounded-lg px-3 py-1.5", children: [
        /* @__PURE__ */ jsxs("span", { className: "truncate", children: [
          i + 1,
          ". ",
          d.deviceModel || "Устройство"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(d.hwid), disabled: deleting === d.hwid, className: "ml-2 shrink-0 p-1 rounded hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50", title: "Удалить устройство", children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }) })
      ] }, d.hwid)),
      !addMode && !addPayUrl && /* @__PURE__ */ jsxs("button", { onClick: () => setAddMode(true), className: "flex items-center gap-1.5 text-xs text-primary hover:underline mt-1", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" }),
        "+2 устройства · 50 ₽"
      ] }),
      addMode && !addPayUrl && /* @__PURE__ */ jsxs("div", { className: "space-y-2 mt-2", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Добавить +2 устройства · ",
          /* @__PURE__ */ jsx("strong", { children: "50 ₽" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsx("button", { onClick: handleAddWithBalance, disabled: addLoading, className: "text-xs px-3 py-1.5 rounded-lg border hover:bg-surface transition-colors disabled:opacity-50", children: "💼 С баланса" }),
          /* @__PURE__ */ jsx("button", { onClick: handleAddWithCard, disabled: addLoading, className: "text-xs px-3 py-1.5 rounded-lg border hover:bg-surface transition-colors disabled:opacity-50", children: "💳 Картой" }),
          /* @__PURE__ */ jsx("button", { onClick: () => {
            setAddMode(false);
            setAddError(null);
          }, className: "text-xs text-muted-foreground hover:text-foreground", children: "Отмена" })
        ] }),
        addError && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: addError })
      ] }),
      addPayUrl && /* @__PURE__ */ jsxs("div", { className: "space-y-2 mt-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Перейдите к оплате для добавления устройств" }),
        /* @__PURE__ */ jsxs("a", { href: addPayUrl, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg vpn-primary-button text-white font-medium", children: [
          /* @__PURE__ */ jsx(CreditCard, { className: "w-3 h-3" }),
          "Перейти к оплате"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setAddPayUrl(null), className: "ml-2 text-xs text-muted-foreground hover:text-foreground", children: "Отмена" })
      ] })
    ] })
  ] });
}
function SubCard({
  sub,
  onChanged
}) {
  const expired = isExpired(sub.expires_at);
  const [copied, setCopied] = useState(false);
  const name = sub.remna_username ?? `#${sub.id}`;
  async function copyUrl() {
    await navigator.clipboard.writeText(sub.sub_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  }
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-card p-5 space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold font-mono", children: name }),
        /* @__PURE__ */ jsx("span", { className: `text-xs px-2 py-0.5 rounded-full font-medium ${expired ? "bg-destructive/15 text-destructive" : "bg-green-500/15 text-green-500"}`, children: expired ? "Истекла" : "Активна" })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
        sub.devices,
        " уст."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground space-y-0.5", children: [
      /* @__PURE__ */ jsxs("p", { children: [
        "До ",
        formatDate(sub.expires_at)
      ] }),
      !expired && /* @__PURE__ */ jsxs("p", { className: "text-xs", children: [
        "Осталось ",
        daysLeft(sub.expires_at),
        " дн."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0 text-xs font-mono text-muted-foreground bg-surface rounded-lg px-3 py-1.5 truncate", children: sub.sub_url }),
      /* @__PURE__ */ jsx("button", { onClick: copyUrl, className: "shrink-0 p-1.5 rounded-lg border hover:bg-surface transition-colors", title: "Скопировать ссылку", children: copied ? /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 text-green-500" }) : /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4 text-muted-foreground" }) })
    ] }),
    /* @__PURE__ */ jsx(DevicesSection, { sub, onDevicesChanged: onChanged })
  ] });
}
function BuySection({
  balance,
  hasActiveSub,
  onPurchased
}) {
  const [state, setState] = useState("idle");
  const [tariffs, setTariffs] = useState(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  async function open() {
    setError(null);
    setLoading(true);
    try {
      const data = await getTariffsFn();
      setTariffs(data.tariffs);
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
  async function selectTariff(t) {
    setError(null);
    if (t.key === "trial") {
      setLoading(true);
      try {
        await activateTrialFn();
        setState({
          step: "done",
          message: "✅ Пробная подписка активирована!"
        });
        onPurchased();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
      } finally {
        setLoading(false);
      }
      return;
    }
    setState({
      step: "payment",
      tariff: t
    });
  }
  async function payWithBalance(t) {
    setLoading(true);
    setError(null);
    try {
      await buyWithBalanceFn({
        data: {
          tariff: t.key
        }
      });
      setState({
        step: "done",
        message: "✅ Подписка активирована! Баланс списан."
      });
      onPurchased();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }
  async function payWithCard(t) {
    setLoading(true);
    setError(null);
    try {
      const res = await createCardPaymentFn({
        data: {
          tariff: t.key
        }
      });
      setState({
        step: "link",
        paymentUrl: res.paymentUrl,
        label: t.label
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }
  const btnLabel = hasActiveSub ? "🔄 Продлить подписку" : "💳 Купить подписку";
  if (state === "idle") {
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("button", { onClick: open, disabled: loading, className: "w-full py-3 rounded-xl font-semibold text-white vpn-primary-button transition-all hover:brightness-110 disabled:opacity-60 disabled:pointer-events-none", children: loading ? "Загрузка..." : btnLabel }),
      error && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-destructive text-center", children: error })
    ] });
  }
  if (state === "tariff") {
    return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-card p-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Выберите тариф" }),
        /* @__PURE__ */ jsx("button", { onClick: cancel, className: "text-sm text-muted-foreground hover:text-foreground", children: "✕" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: tariffs?.map((t) => {
        if (t.key === "trial" && trialUsed) return null;
        return /* @__PURE__ */ jsxs("button", { onClick: () => selectTariff(t), disabled: loading, className: `w-full text-left px-4 py-3 rounded-xl border transition-colors hover:bg-surface disabled:opacity-50 ${t.key === "m3" ? "border-primary/50 bg-primary/5" : ""}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: t.label }),
            t.key === "m3" && /* @__PURE__ */ jsx("span", { className: "text-xs text-primary font-medium", children: "Выгодно" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
            t.days,
            " дней"
          ] })
        ] }, t.key);
      }) }),
      error && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: error })
    ] });
  }
  if (typeof state === "object" && state.step === "payment") {
    const t = state.tariff;
    const canUseBalance = balance >= t.priceRub;
    return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-card p-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Оплата" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t.label })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setState("tariff"), className: "text-sm text-muted-foreground hover:text-foreground", children: "✕" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "Баланс: ",
        /* @__PURE__ */ jsxs("strong", { children: [
          balance.toFixed(2),
          " ₽"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        canUseBalance && /* @__PURE__ */ jsxs("button", { onClick: () => payWithBalance(t), disabled: loading, className: "w-full py-2.5 px-4 rounded-xl border font-medium text-sm hover:bg-surface transition-colors disabled:opacity-50", children: [
          "💼 С баланса (",
          t.priceRub,
          " ₽)"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => payWithCard(t), disabled: loading, className: "w-full py-2.5 px-4 rounded-xl font-semibold text-white text-sm vpn-primary-button transition-all hover:brightness-110 disabled:opacity-60 disabled:pointer-events-none", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx(CreditCard, { className: "w-4 h-4" }),
          loading ? "Создаём платёж..." : `Оплатить картой (${t.priceRub} ₽)`
        ] }) })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: error })
    ] });
  }
  if (typeof state === "object" && state.step === "link") {
    return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-card p-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { className: "w-5 h-5 text-primary" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Оплата через ЮKassa" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: state.label })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "После оплаты подписка будет выдана автоматически. Вернитесь на эту страницу — данные обновятся." }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs("a", { href: state.paymentUrl, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm vpn-primary-button", children: [
          /* @__PURE__ */ jsx(CreditCard, { className: "w-4 h-4" }),
          "Перейти к оплате"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: cancel, className: "px-4 py-2.5 rounded-xl border text-sm hover:bg-surface transition-colors", children: "Отмена" })
      ] })
    ] });
  }
  if (typeof state === "object" && state.step === "done") {
    return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-green-500/10 p-4 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium text-green-600", children: state.message }),
      /* @__PURE__ */ jsx("button", { onClick: cancel, className: "mt-2 text-sm text-muted-foreground hover:text-foreground", children: "Закрыть" })
    ] });
  }
  return null;
}
function LinkTelegramCard({
  onLinked
}) {
  const [telegramId, setTelegramId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  async function handleLink(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await linkTelegramFn({
        data: {
          telegramId
        }
      });
      await onLinked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка привязки");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-card p-5 space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Send, { className: "w-5 h-5 text-[var(--telegram,#2AABEE)]" }),
      /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Привязать Telegram аккаунт" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
      "Привяжите ваш Telegram, чтобы видеть подписки из бота",
      " ",
      /* @__PURE__ */ jsxs("a", { href: "https://t.me/vpnasylum_bot", target: "_blank", rel: "noreferrer", className: "text-primary hover:underline inline-flex items-center gap-0.5", children: [
        "@vpnasylum_bot",
        /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" })
      ] }),
      "."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground bg-surface rounded-lg p-3 space-y-1", children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground", children: "Как узнать свой Telegram ID:" }),
      /* @__PURE__ */ jsxs("p", { children: [
        "1. Откройте Telegram и напишите боту ",
        /* @__PURE__ */ jsx("span", { className: "font-mono", children: "@userinfobot" })
      ] }),
      /* @__PURE__ */ jsx("p", { children: "2. Отправьте любое сообщение" }),
      /* @__PURE__ */ jsx("p", { children: "3. Скопируйте число из поля «Id»" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleLink, className: "flex gap-2", children: [
      /* @__PURE__ */ jsx("input", { type: "text", inputMode: "numeric", pattern: "\\d+", placeholder: "123456789", value: telegramId, onChange: (e) => setTelegramId(e.target.value.replace(/\D/g, "")), className: "flex-1 border rounded-lg px-3 py-2 bg-surface text-sm outline-none focus:ring-2 focus:ring-primary/50", required: true }),
      /* @__PURE__ */ jsx("button", { type: "submit", disabled: loading || !telegramId, className: "px-4 py-2 rounded-xl font-semibold text-white vpn-primary-button text-sm transition-all hover:brightness-110 disabled:opacity-60 disabled:pointer-events-none", children: loading ? "..." : "Привязать" })
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2", children: error })
  ] });
}
function DashboardPage() {
  const {
    account,
    subscriptions,
    balance
  } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const SUPPORT_URL = "https://t.me/ubezhishevpn_support";
  async function handleLogout() {
    await logoutFn();
    await navigate({
      to: "/"
    });
  }
  async function handleLinked() {
    await router.invalidate();
  }
  async function handlePurchased() {
    await router.invalidate();
  }
  const hasActiveSub = subscriptions.some((s) => !isExpired(s.expires_at));
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen vpn-page-bg", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto px-4 py-8 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "text-xl font-bold tracking-tight", children: [
        "Убежище",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "VPN" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: handleLogout, className: "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors", children: [
        /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
        "Выйти"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-card p-5 space-y-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-muted-foreground text-sm mb-2", children: [
        /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }),
        /* @__PURE__ */ jsx("span", { children: "Аккаунт" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "font-semibold text-lg", children: account.name ?? account.email }),
      account.name && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: account.email }),
      account.telegram_user_id && /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-1.5 mt-1", children: [
        /* @__PURE__ */ jsx(Send, { className: "w-3.5 h-3.5" }),
        "Telegram привязан (ID: ",
        account.telegram_user_id,
        ")"
      ] })
    ] }),
    account.telegram_user_id && /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-card p-5 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Wallet, { className: "w-5 h-5 text-primary" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Баланс" }),
        /* @__PURE__ */ jsxs("p", { className: "font-semibold text-lg", children: [
          Number(balance).toFixed(2),
          " ₽"
        ] })
      ] })
    ] }),
    !account.telegram_user_id ? /* @__PURE__ */ jsx(LinkTelegramCard, { onLinked: handleLinked }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      subscriptions.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "Подписки" }),
        subscriptions.map((sub) => /* @__PURE__ */ jsx(SubCard, { sub, onChanged: handlePurchased }, sub.id))
      ] }),
      /* @__PURE__ */ jsx(BuySection, { balance: Number(balance), hasActiveSub, onPurchased: handlePurchased }),
      subscriptions.length === 0 && /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground text-center", children: [
        "Нет подписок. Используйте кнопку выше или оформите в",
        " ",
        /* @__PURE__ */ jsx("a", { href: "https://t.me/vpnasylum_bot", target: "_blank", rel: "noreferrer", className: "text-primary hover:underline", children: "@vpnasylum_bot" }),
        "."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-card p-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx(MessageCircle, { className: "w-4 h-4 text-primary" }),
          /* @__PURE__ */ jsx("span", { children: "Вопросы? Мы поможем" })
        ] }),
        /* @__PURE__ */ jsxs("a", { href: SUPPORT_URL, target: "_blank", rel: "noreferrer", className: "flex items-center gap-1.5 text-sm font-medium text-primary hover:underline", children: [
          "Написать",
          /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  DashboardPage as component
};
