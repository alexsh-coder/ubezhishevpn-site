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

`db.py` is a **read-only reference** — it belongs to the Telegram bot project and is copied here for schema documentation. It is not executed by this site.

PostgreSQL schema (9 tables): `users`, `subscriptions`, `payments`, `promocodes`, `promo_uses`, `referral_bonuses`, `balance_tx`, `settings`, `reminder_sent`.

Connection env vars (for any future backend): `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DBNAME`.

The site must reuse this exact schema — no migrations that would break the bot.

## Authentication

Web auth is implemented in `src/api/auth.ts` using TanStack Start server functions. The `web_accounts` table (separate from the bot's tables) stores credentials. JWT is stored in an httpOnly cookie (`auth_token`, 30-day expiry).

- **Server functions:** `registerFn`, `loginFn`, `logoutFn`, `getMeFn` — import from `@tanstack/react-start/server` for `getCookie`/`setCookie`/`deleteCookie`
- **Utilities:** `src/lib/auth.ts` (bcryptjs + jose), `src/lib/db.ts` (pg Pool singleton)
- **Dashboard data:** `src/api/dashboard.ts` — `getDashboardDataFn` fetches subscriptions/balance via linked `telegram_user_id`; `linkTelegramFn` links a Telegram user ID to the web account
- **Auth context:** Root route's `beforeLoad` calls `getMeFn()` and returns `{ user }` — available in all child routes via `context.user`
- **Migration:** `src/db/migrate.ts` — run once with `npx tsx src/db/migrate.ts` (table already created)
- **Env:** `.env.local` (gitignored) holds DB credentials and `JWT_SECRET`

The `createServerFn` API uses `.inputValidator(zodSchema)` (not `.validator()`).

## What's Not Yet Built

- Payment flow integration (Yookassa)
- Telegram link verification (currently self-reported ID; proper flow requires bot `/link <code>` command)

When adding server-side logic, use `createServerFn` from `@tanstack/react-start`.

## Deployment

Three deployment targets are pre-configured:
- **Cloudflare Workers** — `wrangler.jsonc` + `bun run deploy`
- **Netlify** — `netlify.toml` (SPA redirect rule)
- **Custom Node server** — `start-server.mjs` (serves `dist/`, listens on `PORT`)
