import { c as createServerRpc, p as pool, s as signToken } from "./auth-B-kOQ_qs.js";
import { z } from "zod";
import { c as createServerFn, s as setCookie$1, a as getCookie } from "../server.js";
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
const STATE_COOKIE = "oauth_state";
const COOKIE_OPTS = {
  httpOnly: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  sameSite: "lax",
  secure: true
};
function getRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/auth/google/callback";
}
const getGoogleAuthUrlFn_createServerFn_handler = createServerRpc({
  id: "16a8ddf6bd9d4b86f04024b511f2a74f467262c057a73ea6065c5d63b321a141",
  name: "getGoogleAuthUrlFn",
  filename: "src/api/oauth.ts"
}, (opts) => getGoogleAuthUrlFn.__executeServer(opts));
const getGoogleAuthUrlFn = createServerFn({
  method: "GET"
}).handler(getGoogleAuthUrlFn_createServerFn_handler, async () => {
  const state = crypto.randomUUID();
  setCookie$1(STATE_COOKIE, state, {
    httpOnly: true,
    path: "/",
    maxAge: 600,
    sameSite: "lax",
    secure: true
  });
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account"
  });
  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  };
});
const googleCallbackFn_createServerFn_handler = createServerRpc({
  id: "f08f427c149c5538b91ec1fd60a9cd8c07bcf0f0fd76511dd3e9e9194d576174",
  name: "googleCallbackFn",
  filename: "src/api/oauth.ts"
}, (opts) => googleCallbackFn.__executeServer(opts));
const googleCallbackFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  code: z.string(),
  state: z.string()
})).handler(googleCallbackFn_createServerFn_handler, async ({
  data
}) => {
  const {
    code,
    state
  } = data;
  const savedState = getCookie(STATE_COOKIE);
  if (!savedState || savedState !== state) {
    throw new Error("Недействительная сессия авторизации");
  }
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code"
    })
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok || !tokens.access_token) {
    throw new Error("Ошибка авторизации через Google");
  }
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`
    }
  });
  const googleUser = await userRes.json();
  if (!googleUser.email) {
    throw new Error("Не удалось получить email из Google");
  }
  const email = googleUser.email.toLowerCase();
  const existing = await pool.query("SELECT id, email, name FROM web_accounts WHERE email = $1", [email]);
  let account;
  if (existing.rows.length > 0) {
    account = existing.rows[0];
    if (!account.name && googleUser.name) {
      await pool.query("UPDATE web_accounts SET name = $1 WHERE id = $2", [googleUser.name, account.id]);
      account.name = googleUser.name;
    }
  } else {
    const result = await pool.query("INSERT INTO web_accounts (email, name) VALUES ($1, $2) RETURNING id, email, name", [email, googleUser.name ?? null]);
    account = result.rows[0];
  }
  const token = await signToken({
    accountId: account.id,
    email: account.email
  });
  setCookie$1(COOKIE, token, COOKIE_OPTS);
  return {
    ok: true
  };
});
export {
  getGoogleAuthUrlFn_createServerFn_handler,
  googleCallbackFn_createServerFn_handler
};
