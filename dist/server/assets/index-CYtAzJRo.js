import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useRef, useState, useEffect } from "react";
import { Shield, Send, Lock, Zap, Globe, Bot, Smartphone, Settings, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.2
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}
const TG_URL = "https://t.me/vpnasylum_bot";
const CountryFlag = ({
  code,
  label
}) => /* @__PURE__ */ jsx("span", { className: `country-flag country-flag-${code}`, role: "img", "aria-label": `Флаг: ${label}` });
const servers = [{
  code: "fi",
  name: "Финляндия",
  desc: "Подходит для стабильного соединения и низкого пинга."
}, {
  code: "de",
  name: "Германия",
  desc: "Оптимальный баланс скорости и надёжности."
}, {
  code: "nl",
  name: "Нидерланды",
  desc: "Максимальная свобода доступа и обход ограничений."
}];
function Reveal({
  children,
  delay = 0,
  className = ""
}) {
  const {
    ref,
    visible
  } = useReveal();
  return /* @__PURE__ */ jsx("div", { ref, className: `reveal ${visible ? "visible" : ""} ${className}`, style: {
    transitionDelay: `${delay}ms`
  }, children });
}
function Index() {
  return /* @__PURE__ */ jsxs("div", { className: "vpn-page-bg min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxs("header", { className: "relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pointer-events-none", style: {
        background: "var(--gradient-hero)"
      } }),
      /* @__PURE__ */ jsxs("nav", { className: "relative max-w-6xl mx-auto px-6 py-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Shield, { className: "w-6 h-6 text-primary" }),
          /* @__PURE__ */ jsxs("span", { className: "font-bold text-lg", children: [
            "Убежище",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: "VPN" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-8 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-muted-foreground transition-colors hover:text-primary", children: "Вход" }),
          /* @__PURE__ */ jsx("span", { className: "w-1 h-1 rounded-full bg-primary" }),
          /* @__PURE__ */ jsx(Link, { to: "/register", className: "text-muted-foreground transition-colors hover:text-primary", children: "Регистрация" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "relative max-w-6xl mx-auto px-6 pt-10 pb-20 grid md:grid-cols-2 gap-10 items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-5xl md:text-6xl font-bold tracking-tight", children: [
            "Убежище",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: "VPN" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 text-xl md:text-2xl font-semibold", children: "Приватный интернет без ограничений" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-4 text-muted-foreground leading-relaxed max-w-md", children: [
            "Быстрое подключение через Telegram.",
            /* @__PURE__ */ jsx("br", {}),
            "Без регистрации и лишних действий."
          ] }),
          /* @__PURE__ */ jsxs("a", { href: TG_URL, className: "mt-8 inline-flex flex-col items-center px-8 py-4 rounded-xl text-primary-foreground font-semibold transition-transform hover:scale-[1.02]", style: {
            background: "var(--gradient-cta)",
            boxShadow: "var(--shadow-glow)"
          }, children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" }),
              " Запустить в Telegram"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-normal opacity-80 mt-1", children: "Подключение занимает меньше минуты" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Lock, { className: "w-4 h-4 text-primary" }),
              " Защищенность"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Zap, { className: "w-4 h-4 text-primary" }),
              " Стабильное соединение"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Globe, { className: "w-4 h-4 text-primary" }),
              " Доступ к зарубежным сервисам"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative mx-auto hidden h-[380px] w-full max-w-lg items-center justify-center sm:flex", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-8 rounded-full bg-brand/20 blur-3xl" }),
          /* @__PURE__ */ jsx("div", { className: "orbital-spin absolute h-72 w-72 rounded-full border border-brand-soft/30" }),
          /* @__PURE__ */ jsx("div", { className: "absolute h-48 w-[430px] rounded-[50%] border border-accent/45 rotate-[-14deg]" }),
          /* @__PURE__ */ jsx("div", { className: "absolute h-44 w-[390px] rounded-[50%] border border-brand/45 rotate-[14deg]" }),
          /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-8 h-52 w-72 opacity-35 [background-image:radial-gradient(circle,currentColor_1px,transparent_1px)] [background-size:10px_10px] text-brand-bright" }),
          /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 200 240", className: "shield-float relative z-10 h-72 w-72 drop-shadow-2xl", "aria-label": "Защитный щит VPN", children: [
            /* @__PURE__ */ jsxs("defs", { children: [
              /* @__PURE__ */ jsxs("linearGradient", { id: "shieldGrad", x1: "0", y1: "0", x2: "1", y2: "1", children: [
                /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "oklch(0.46 0.22 292)" }),
                /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "oklch(0.16 0.08 281)" })
              ] }),
              /* @__PURE__ */ jsxs("linearGradient", { id: "shieldBorder", x1: "0", y1: "0", x2: "1", y2: "1", children: [
                /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "oklch(0.82 0.13 292)" }),
                /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "oklch(0.58 0.25 292)" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("path", { d: "M100 10L20 45v65c0 55 35 95 80 110 45-15 80-55 80-110V45L100 10z", fill: "url(#shieldGrad)", stroke: "url(#shieldBorder)", strokeWidth: "3" }),
            /* @__PURE__ */ jsx("path", { d: "M100 24v180", stroke: "oklch(0.75 0.16 292 / 0.22)", strokeWidth: "2" }),
            /* @__PURE__ */ jsx("circle", { cx: "100", cy: "116", r: "28", fill: "oklch(0.19 0.08 281)", stroke: "oklch(0.58 0.25 292)", strokeWidth: "2" }),
            /* @__PURE__ */ jsx("path", { d: "M88 112a12 12 0 1124 0v12H88v-12z", fill: "none", stroke: "oklch(0.82 0.13 292)", strokeWidth: "3" }),
            /* @__PURE__ */ jsx("rect", { x: "83", y: "121", width: "34", height: "25", rx: "5", fill: "oklch(0.13 0.05 281)", stroke: "oklch(0.82 0.13 292)", strokeWidth: "2" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-5 h-7 w-48 rounded-full bg-brand/45 blur-xl" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-6xl px-5 sm:px-7", children: /* @__PURE__ */ jsxs("div", { className: "vpn-panel rounded-2xl border p-6 sm:p-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-center text-2xl font-black", children: "Серверы" }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-5 md:grid-cols-3", children: servers.map((s, i) => /* @__PURE__ */ jsx(Reveal, { delay: i * 100, children: /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-border bg-surface-soft/70 p-5 transition hover:-translate-y-1 hover:border-brand-soft/70", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsx(CountryFlag, { code: s.code, label: s.name }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-black", children: s.name }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted-foreground", children: s.desc })
        ] })
      ] }) }) }, s.name)) })
    ] }) }),
    /* @__PURE__ */ jsxs(Section, { title: "Как это работает", bare: true, children: [
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-3 gap-8 relative", children: [{
        icon: Send,
        num: 1,
        text: "Открываете Telegram"
      }, {
        icon: Bot,
        num: 2,
        text: "Запускаете бота"
      }, {
        icon: Lock,
        num: 3,
        text: "Получаете доступ к VPN"
      }].map(({
        icon: Icon,
        num,
        text
      }, i) => /* @__PURE__ */ jsx(Reveal, { delay: i * 150, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full flex items-center justify-center border border-border", style: {
          background: "var(--surface-elevated)",
          boxShadow: "var(--shadow-glow)"
        }, children: /* @__PURE__ */ jsx(Icon, { className: "w-8 h-8 text-primary" }) }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 text-2xl font-bold text-primary", children: num }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-muted-foreground", children: text })
      ] }) }, num)) }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground mt-10", children: "Без сложной настройки и технических знаний." })
    ] }),
    /* @__PURE__ */ jsx(Section, { title: "Тарифы", children: /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-3 gap-5", children: [{
      name: "Пробный",
      desc1: "3 дня доступа",
      desc2: "с ограничением по трафику",
      price: "0 ₽"
    }, {
      name: "1 месяц",
      desc1: "30 дней",
      desc2: "доступ ко всем серверам",
      price: "99 ₽",
      popular: true
    }, {
      name: "3 месяца",
      desc1: "90 дней",
      desc2: "доступ ко всем серверам",
      price: "269 ₽"
    }].map((p, i) => /* @__PURE__ */ jsx(Reveal, { delay: i * 120, children: /* @__PURE__ */ jsx(PriceCard, { ...p }) }, p.name)) }) }),
    /* @__PURE__ */ jsx(Section, { title: "Преимущества", bare: true, children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-6 gap-4", children: [{
      icon: Lock,
      text: "Надежная защита"
    }, {
      icon: Zap,
      text: "Высокая скорость"
    }, {
      icon: Globe,
      text: "Европейские серверы"
    }, {
      icon: Smartphone,
      text: "Работа на всех устройствах"
    }, {
      icon: Shield,
      text: "Обход блокировок"
    }, {
      icon: Settings,
      text: "Простая настройка"
    }].map(({
      icon: Icon,
      text
    }, i) => /* @__PURE__ */ jsx(Reveal, { delay: i * 80, children: /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-xl bg-card border border-border flex flex-col items-center text-center gap-3 transition-transform hover:-translate-y-1", children: [
      /* @__PURE__ */ jsx(Icon, { className: "w-7 h-7 text-primary" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-medium leading-snug", children: text })
    ] }) }, text)) }) }),
    /* @__PURE__ */ jsx(Section, { bare: true, children: /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-8 items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center md:text-left", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold", children: "Нам доверяют" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-3 text-muted-foreground leading-relaxed", children: [
          "Сервисом уже пользуются сотни клиентов.",
          /* @__PURE__ */ jsx("br", {}),
          "Стабильная работа и регулярные обновления."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsx(Star, { className: "w-6 h-6 fill-yellow-400 text-yellow-400" }, i)) }),
          /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold ml-2", children: "4.9 / 5" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "по отзывам пользователей" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { className: "max-w-6xl mx-auto px-6 pb-16", children: /* @__PURE__ */ jsxs(Reveal, { children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6", style: {
        background: "var(--gradient-cta)",
        boxShadow: "var(--shadow-elevated)"
      }, children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-2xl md:text-3xl font-bold text-primary-foreground text-center md:text-left", children: [
          "Готовы получить доступ",
          /* @__PURE__ */ jsx("br", {}),
          "к свободному интернету?"
        ] }),
        /* @__PURE__ */ jsxs("a", { href: TG_URL, className: "inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#229ED9] text-white font-semibold hover:brightness-110 transition", children: [
          /* @__PURE__ */ jsx(Send, { className: "w-5 h-5" }),
          " Открыть Telegram-бота"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "mt-8 text-center text-sm text-muted-foreground", children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " УбежищеVPN"
      ] })
    ] }) })
  ] });
}
function Section({
  title,
  children,
  bare
}) {
  return /* @__PURE__ */ jsx("section", { className: "max-w-6xl mx-auto px-6 py-14", children: bare ? /* @__PURE__ */ jsxs(Fragment, { children: [
    title && /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-center mb-10", children: title }),
    children
  ] }) : /* @__PURE__ */ jsxs("div", { className: "rounded-3xl p-8 md:p-10 border border-border", style: {
    background: "var(--surface)",
    boxShadow: "var(--shadow-card)"
  }, children: [
    title && /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-center mb-10", children: title }),
    children
  ] }) });
}
function PriceCard({
  name,
  desc1,
  desc2,
  price,
  popular
}) {
  return /* @__PURE__ */ jsxs("div", { className: "relative rounded-2xl border p-6 flex flex-col items-center text-center", style: {
    background: popular ? "var(--surface-elevated)" : "var(--surface)",
    borderColor: popular ? "oklch(0.62 0.22 280 / 0.6)" : void 0,
    boxShadow: popular ? "var(--shadow-elevated)" : "var(--shadow-card)"
  }, children: [
    popular && /* @__PURE__ */ jsx("div", { className: "absolute -top-3 px-4 py-1 rounded-full text-xs font-semibold text-primary-foreground tracking-wider", style: {
      background: "var(--gradient-primary)"
    }, children: "ПОПУЛЯРНЫЙ" }),
    /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg mt-2", children: name }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: desc1 }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: desc2 }),
    /* @__PURE__ */ jsx("div", { className: "my-5 text-3xl font-bold", children: price }),
    /* @__PURE__ */ jsx("a", { href: TG_URL, className: "w-full px-4 py-3 rounded-xl text-sm font-semibold transition hover:-translate-y-0.5 ", style: popular ? {
      background: "var(--gradient-cta)",
      color: "var(--primary-foreground)"
    } : {
      background: "var(--surface-elevated)",
      color: "var(--foreground)",
      border: "1px solid var(--border)"
    }, children: "Подключить через Telegram" })
  ] });
}
export {
  Index as component
};
