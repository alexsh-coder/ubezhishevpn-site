import { c as createServerRpc, p as pool, h as hashPassword, s as signToken, a as verifyPassword, v as verifyToken } from "./auth-B-kOQ_qs.js";
import { z } from "zod";
import { c as createServerFn, s as setCookie$1, d as deleteCookie$1, a as getCookie } from "../server.js";
import "pg";
import "bcryptjs";
import "jose";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const COOKIE = "auth_token";
const COOKIE_OPTS = {
  httpOnly: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  sameSite: "lax",
  secure: true
};
const registerFn_createServerFn_handler = createServerRpc({
  id: "ea22d673e568787a7f00470a2f366dff32a5e0d354247aa9e14685f5e577bebd",
  name: "registerFn",
  filename: "src/api/auth.ts"
}, (opts) => registerFn.__executeServer(opts));
const registerFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  name: z.string().min(1, "Введите имя"),
  email: z.string().email("Неверный email"),
  password: z.string().min(6, "Минимум 6 символов")
})).handler(registerFn_createServerFn_handler, async ({
  data
}) => {
  const {
    name,
    email,
    password
  } = data;
  const existing = await pool.query("SELECT id FROM web_accounts WHERE email = $1", [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    throw new Error("Этот email уже зарегистрирован");
  }
  const passwordHash = await hashPassword(password);
  const result = await pool.query("INSERT INTO web_accounts (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name", [email.toLowerCase(), passwordHash, name]);
  const account = result.rows[0];
  const token = await signToken({
    accountId: account.id,
    email: account.email
  });
  setCookie$1(COOKIE, token, COOKIE_OPTS);
  return {
    id: account.id,
    email: account.email,
    name: account.name
  };
});
const loginFn_createServerFn_handler = createServerRpc({
  id: "e18bff70a16fc4542841e46b562fa67cd8c1ef8455738ee913280cc629bff424",
  name: "loginFn",
  filename: "src/api/auth.ts"
}, (opts) => loginFn.__executeServer(opts));
const loginFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  email: z.string().email("Неверный email"),
  password: z.string().min(1, "Введите пароль")
})).handler(loginFn_createServerFn_handler, async ({
  data
}) => {
  const {
    email,
    password
  } = data;
  const result = await pool.query("SELECT id, email, name, password_hash FROM web_accounts WHERE email = $1", [email.toLowerCase()]);
  if (result.rows.length === 0) throw new Error("Неверный email или пароль");
  const account = result.rows[0];
  const valid = await verifyPassword(password, account.password_hash);
  if (!valid) throw new Error("Неверный email или пароль");
  const token = await signToken({
    accountId: account.id,
    email: account.email
  });
  setCookie$1(COOKIE, token, COOKIE_OPTS);
  return {
    id: account.id,
    email: account.email,
    name: account.name
  };
});
const logoutFn_createServerFn_handler = createServerRpc({
  id: "5923ee146a09dcd3d79b2b93d8c4cafcaf21d0d69a6a64ef3ce96510fd0d0c36",
  name: "logoutFn",
  filename: "src/api/auth.ts"
}, (opts) => logoutFn.__executeServer(opts));
const logoutFn = createServerFn({
  method: "POST"
}).handler(logoutFn_createServerFn_handler, async () => {
  deleteCookie$1(COOKIE, {
    path: "/"
  });
  return {
    ok: true
  };
});
const getMeFn_createServerFn_handler = createServerRpc({
  id: "e8e06ff860d1930ea22710367f0df4d6bce3aac088893acaa56d9cfbc2fcfc71",
  name: "getMeFn",
  filename: "src/api/auth.ts"
}, (opts) => getMeFn.__executeServer(opts));
const getMeFn = createServerFn({
  method: "GET"
}).handler(getMeFn_createServerFn_handler, async () => {
  const token = getCookie(COOKIE);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const result = await pool.query("SELECT id, email, name, telegram_user_id FROM web_accounts WHERE id = $1", [payload.accountId]);
  return result.rows[0] ?? null;
});
export {
  getMeFn_createServerFn_handler,
  loginFn_createServerFn_handler,
  logoutFn_createServerFn_handler,
  registerFn_createServerFn_handler
};
