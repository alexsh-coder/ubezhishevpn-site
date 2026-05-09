# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VPN subscription sales website for **УбежищеVPN** (Asylum VPN). Shares a PostgreSQL database with a Telegram bot (`vpnasylum_bot`). Currently implements a landing page and auth UI; backend API integration is the main pending work.

## Commands

```bash
bun dev        # start dev server with hot reload
bun build      # build to dist/client and dist/server
bun preview    # preview the production build
```

Uses **Bun** as the package manager (see `bunfig.toml`). Do not use npm/yarn.

## Architecture

**Frontend:** TanStack React Start (React 19 with SSR), TanStack Router v1, Tailwind CSS v4, Radix UI via shadcn/ui, React Hook Form + Zod, React Query v5.

**Routing:** File-based via `src/routes/`. The router tree is auto-generated into `routeTree.gen.ts` by TanStack Router — never edit that file manually. Root layout is `src/routes/__root.tsx`.

**Styling:** Custom OKLCH color system defined in `src/styles.css`. All colors are CSS variables (`--background`, `--primary`, `--brand`, `--telegram`, etc.). Use the `cn()` utility from `src/lib/utils.ts` for conditional class merging.

**UI Components:** 30+ shadcn/ui components live in `src/components/ui/`. Add new shadcn components with `bunx shadcn@latest add <component>`.

**Scroll animations:** `src/hooks/useReveal.tsx` — IntersectionObserver hook returning `{ ref, visible }`. Used on landing page for staggered reveal animations.

## Database (Reference)

The bot code lives in `telegram_bot/`. Its `db.py` documents the shared PostgreSQL schema.

PostgreSQL schema (9 shared tables): `users`, `subscriptions`, `payments`, `promocodes`, `promo_uses`, `referral_bonuses`, `balance_tx`, `settings`, `reminder_sent`. Plus `web_accounts` (web-only).

The site must reuse this exact schema — no migrations that would break the bot.

Key fields: `subscriptions.remna_uuid` (Remnawave user UUID), `subscriptions.remna_username` (display name), `subscriptions.expires_at` stored as TEXT in `"YYYY-MM-DD HH:MM"` UTC format (bot convention — preserve this format).

## Authentication

Web auth is implemented in `src/api/auth.ts` using TanStack Start server functions. The `web_accounts` table (separate from the bot's tables) stores credentials. JWT is stored in an httpOnly cookie (`auth_token`, 30-day expiry).

- **Server functions:** `registerFn`, `loginFn`, `logoutFn`, `getMeFn` — import from `@tanstack/react-start/server` for `getCookie`/`setCookie`/`deleteCookie`
- **Utilities:** `src/lib/auth.ts` (bcryptjs + jose), `src/lib/db.ts` (pg Pool singleton)
- **Auth context:** Root route's `beforeLoad` calls `getMeFn()` and returns `{ user }` — available in all child routes via `context.user`
- **Migration:** `src/db/migrate.ts` — run once with `npx tsx src/db/migrate.ts` (table already created)
- **Env:** `.env.local` (gitignored) holds DB creds, `JWT_SECRET`, Remnawave creds, YooKassa creds, `APP_URL`, `SUPPORT_URL`

The `createServerFn` API uses `.inputValidator(zodSchema)` (not `.validator()`).

## Remnawave & Payments

- **`src/lib/remnawave.ts`** — fetch-based Remnawave VPN API client (get/create users, get/delete devices)
- **`src/lib/yookassa.ts`** — YooKassa payment creation
- **`src/lib/vpn.ts`** — `issueOrExtend(telegramId, days, tariff)` mirrors bot's subscription logic; `addDevicesForSub(subId, telegramId)`
- **`src/api/dashboard.ts`** — dashboard data + `getDevicesFn` + `deleteDeviceFn`
- **`src/api/payment.ts`** — `getTariffsFn`, `activateTrialFn`, `buyWithBalanceFn`, `createCardPaymentFn`, `buyDevicesWithBalanceFn`, `createDevicesCardPaymentFn`

**Card payment flow:** web app creates a record in `payments` table → creates YooKassa payment → redirects user → YooKassa sends webhook to the bot's Python webhook server → bot activates subscription → user returns to dashboard and refreshes. The YooKassa webhook URL must point to the bot's server (port 8081 or proxied). `APP_URL` env var sets the return URL after payment.

## What's Not Yet Built

- Telegram link verification (currently self-reported ID; proper flow: bot `/link <code>` command)

When adding server-side logic, use `createServerFn` from `@tanstack/react-start`.

## Deployment

Three deployment targets are pre-configured:
- **Cloudflare Workers** — `wrangler.jsonc` + `bun run deploy`
- **Netlify** — `netlify.toml` (SPA redirect rule)
- **Custom Node server** — `start-server.mjs` (serves `dist/`, listens on `PORT`)
