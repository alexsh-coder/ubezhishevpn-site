import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock } from "lucide-react";
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center vpn-page-bg px-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md p-8 rounded-2xl border bg-card shadow-card-glow", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-center", children: "Вход" }),
    /* @__PURE__ */ jsxs("form", { className: "mt-6 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm text-muted-foreground", children: "Email" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-surface", children: [
          /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("input", { type: "email", className: "bg-transparent outline-none w-full", value: email, onChange: (e) => setEmail(e.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-sm text-muted-foreground", children: "Пароль" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2 border rounded-lg px-3 py-2 bg-surface", children: [
          /* @__PURE__ */ jsx(Lock, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("input", { type: "password", className: "bg-transparent outline-none w-full", value: password, onChange: (e) => setPassword(e.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "w-full py-3 rounded-xl font-semibold text-white vpn-primary-button", children: "Войти" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-muted-foreground mt-6", children: [
      "Нет аккаунта?",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/register", className: "text-primary hover:underline", children: "Зарегистрироваться" })
    ] })
  ] }) });
}
export {
  LoginPage as component
};
