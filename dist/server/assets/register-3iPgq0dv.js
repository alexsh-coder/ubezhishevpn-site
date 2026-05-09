import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { User, Mail, Lock } from "lucide-react";
import { r as registerFn } from "./router-OtYyjvOl.js";
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
  const navigate = useNavigate();
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
