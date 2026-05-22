import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { User, Mail, Lock } from "lucide-react";
import { r as registerFn, g as getGoogleAuthUrlFn } from "./router-DDxkyDS4.js";
import "../server.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "zod";
function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const {
        url
      } = await getGoogleAuthUrlFn();
      window.location.href = url;
    } catch {
      setGoogleLoading(false);
    }
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerFn({
        data: {
          name,
          email,
          password
        }
      });
      await navigate({
        to: "/dashboard"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center vpn-page-bg px-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md p-8 rounded-2xl border bg-card shadow-card-glow", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-center", children: "Регистрация" }),
    /* @__PURE__ */ jsxs("form", { className: "mt-6 space-y-4", onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm text-muted-foreground", children: "Имя" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-surface", children: [
          /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-muted-foreground shrink-0" }),
          /* @__PURE__ */ jsx("input", { type: "text", className: "bg-transparent outline-none w-full", value: name, onChange: (e) => setName(e.target.value), required: true, autoComplete: "name" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm text-muted-foreground", children: "Email" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-surface", children: [
          /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4 text-muted-foreground shrink-0" }),
          /* @__PURE__ */ jsx("input", { type: "email", className: "bg-transparent outline-none w-full", value: email, onChange: (e) => setEmail(e.target.value), required: true, autoComplete: "email" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm text-muted-foreground", children: "Пароль" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-surface", children: [
          /* @__PURE__ */ jsx(Lock, { className: "w-4 h-4 text-muted-foreground shrink-0" }),
          /* @__PURE__ */ jsx("input", { type: "password", className: "bg-transparent outline-none w-full", value: password, onChange: (e) => setPassword(e.target.value), required: true, minLength: 6, autoComplete: "new-password" })
        ] })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2", children: error }),
      /* @__PURE__ */ jsx("button", { type: "submit", disabled: loading, className: "w-full py-3 rounded-xl font-semibold text-white vpn-primary-button transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 disabled:pointer-events-none", children: loading ? "Создаём аккаунт..." : "Создать аккаунт" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative my-6", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx("span", { className: "w-full border-t" }) }),
      /* @__PURE__ */ jsx("div", { className: "relative flex justify-center text-xs uppercase", children: /* @__PURE__ */ jsx("span", { className: "bg-card px-2 text-muted-foreground", children: "или" }) })
    ] }),
    /* @__PURE__ */ jsxs("button", { type: "button", onClick: handleGoogleLogin, disabled: googleLoading, className: "w-full flex items-center justify-center gap-3 py-3 rounded-xl border bg-surface font-medium transition-all duration-200 hover:bg-surface/80 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none", children: [
      /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5 shrink-0", viewBox: "0 0 24 24", children: [
        /* @__PURE__ */ jsx("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z", fill: "#4285F4" }),
        /* @__PURE__ */ jsx("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }),
        /* @__PURE__ */ jsx("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z", fill: "#FBBC05" }),
        /* @__PURE__ */ jsx("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" })
      ] }),
      googleLoading ? "Перенаправление..." : "Войти через Google"
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-muted-foreground mt-6", children: [
      "Уже есть аккаунт?",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-primary hover:underline", children: "Войти" })
    ] })
  ] }) });
}
export {
  RegisterPage as component
};
