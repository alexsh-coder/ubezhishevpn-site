import { jsx, jsxs } from "react/jsx-runtime";
import { createRootRoute, Link, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, redirect, createRouter, useRouter } from "@tanstack/react-router";
import { T as TSS_SERVER_FUNCTION, g as getServerFnById, c as createServerFn } from "../server.js";
import { z } from "zod";
const appCss = "/assets/styles-CbsMT2FH.css";
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const registerFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  name: z.string().min(1, "Введите имя"),
  email: z.string().email("Неверный email"),
  password: z.string().min(6, "Минимум 6 символов")
})).handler(createSsrRpc("ea22d673e568787a7f00470a2f366dff32a5e0d354247aa9e14685f5e577bebd"));
const loginFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  email: z.string().email("Неверный email"),
  password: z.string().min(1, "Введите пароль")
})).handler(createSsrRpc("e18bff70a16fc4542841e46b562fa67cd8c1ef8455738ee913280cc629bff424"));
const logoutFn = createServerFn({
  method: "POST"
}).handler(createSsrRpc("5923ee146a09dcd3d79b2b93d8c4cafcaf21d0d69a6a64ef3ce96510fd0d0c36"));
const getMeFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("e8e06ff860d1930ea22710367f0df4d6bce3aac088893acaa56d9cfbc2fcfc71"));
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
const Route$5 = createRootRoute({
  beforeLoad: async () => {
    try {
      const user = await getMeFn();
      return { user };
    } catch {
      return { user: null };
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "УбежищеVPN — Приватный интернет без ограничений" },
      { name: "description", content: "Быстрый VPN через Telegram. Без регистрации, без логов. Доступ к зарубежным сервисам за минуту." },
      { name: "author", content: "УбежищеVPN" },
      { property: "og:title", content: "УбежищеVPN — Приватный интернет без ограничений" },
      { property: "og:description", content: "Быстрый VPN через Telegram. Без регистрации, без логов." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "ru", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const $$splitComponentImporter$4 = () => import("./test-CFML2TPk.js");
const Route$4 = createFileRoute("/test")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./register-3iPgq0dv.js");
const Route$3 = createFileRoute("/register")({
  beforeLoad: ({
    context
  }) => {
    if (context.user) throw redirect({
      to: "/dashboard"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./login-DRunw7f6.js");
const Route$2 = createFileRoute("/login")({
  beforeLoad: ({
    context
  }) => {
    if (context.user) throw redirect({
      to: "/dashboard"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const getDashboardDataFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("5d3a6d8575218593933fd24bcfb68bcd6c1e482b609add67819d0e855cc5018b"));
const linkTelegramFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  telegramId: z.string().regex(/^\d+$/, "Введите числовой ID")
})).handler(createSsrRpc("a01ca2150fb3a7110a3ac105911889d49d88a8a516150563e70e496e3463f90e"));
const getDevicesFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  remnaUuid: z.string().min(1)
})).handler(createSsrRpc("5533b32c62497a68b9e7a9956a9b748467e061155655107d1c37442a373ee747"));
const deleteDeviceFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  remnaUuid: z.string().min(1),
  hwid: z.string().min(1)
})).handler(createSsrRpc("a6b2b735ecfaa96e1a8706a78a2164a66e44f93d28f719781bbdda8ba3f902ae"));
const $$splitComponentImporter$1 = () => import("./dashboard-BCaeKPKR.js");
const Route$1 = createFileRoute("/dashboard")({
  beforeLoad: ({
    context
  }) => {
    if (!context.user) throw redirect({
      to: "/login"
    });
  },
  loader: () => getDashboardDataFn(),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./index-CYtAzJRo.js");
const Route = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const TestRoute = Route$4.update({
  id: "/test",
  path: "/test",
  getParentRoute: () => Route$5
});
const RegisterRoute = Route$3.update({
  id: "/register",
  path: "/register",
  getParentRoute: () => Route$5
});
const LoginRoute = Route$2.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$5
});
const DashboardRoute = Route$1.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$5
});
const IndexRoute = Route.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$5
});
const rootRouteChildren = {
  IndexRoute,
  DashboardRoute,
  LoginRoute,
  RegisterRoute,
  TestRoute
};
const routeTree = Route$5._addFileChildren(rootRouteChildren)._addFileTypes();
function DefaultErrorComponent({ error, reset }) {
  const router2 = useRouter();
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10", children: /* @__PURE__ */ jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        className: "h-8 w-8 text-destructive",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: 2,
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Something went wrong" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "An unexpected error occurred. Please try again." }),
    false,
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const getRouter = () => {
  const router2 = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$1 as R,
  logoutFn as a,
  linkTelegramFn as b,
  createSsrRpc as c,
  deleteDeviceFn as d,
  router as e,
  getDevicesFn as g,
  loginFn as l,
  registerFn as r
};
