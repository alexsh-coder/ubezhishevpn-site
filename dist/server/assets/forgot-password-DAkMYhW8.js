import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { Mail, ArrowLeft } from "lucide-react";
function ForgotPasswordPage() {
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center vpn-page-bg px-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md p-8 rounded-2xl border bg-card shadow-card-glow", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4", children: /* @__PURE__ */ jsx(Mail, { className: "w-6 h-6 text-primary" }) }),
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-center", children: "Восстановление пароля" }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-4 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx("p", { className: "text-foreground", children: "Мы не храним пароли в открытом виде, поэтому восстановление выполняется вручную — это занимает не больше нескольких часов." }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl border bg-surface p-4 space-y-3", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-foreground", children: "Что нужно сделать:" }),
        /* @__PURE__ */ jsxs("ol", { className: "list-decimal list-inside space-y-2 leading-relaxed", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            "Напишите письмо на",
            " ",
            /* @__PURE__ */ jsx("a", { href: "mailto:alexshedmont@gmail.com?subject=Восстановление пароля УбежищеVPN", className: "text-primary hover:underline font-medium", children: "alexshedmont@gmail.com" })
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Отправьте письмо ",
            /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: "с той почты" }),
            ", на которую вы регистрировались"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "В теме письма напишите:",
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: "«Восстановление пароля»" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { children: "Мы ответим и пришлём новый пароль на вашу почту." })
    ] }),
    /* @__PURE__ */ jsxs("a", { href: "mailto:alexshedmont@gmail.com?subject=Восстановление пароля УбежищеVPN", className: "mt-6 w-full py-3 rounded-xl font-semibold text-white vpn-primary-button transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2", children: [
      /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4" }),
      "Написать на почту"
    ] }),
    /* @__PURE__ */ jsxs(Link, { to: "/login", className: "mt-3 w-full py-3 rounded-xl font-medium text-muted-foreground border hover:bg-surface transition-colors flex items-center justify-center gap-2", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
      "Вернуться ко входу"
    ] })
  ] }) });
}
export {
  ForgotPasswordPage as component
};
