import { c as createServerRpc, p as pool, v as verifyToken } from "./auth-B-kOQ_qs.js";
import { z } from "zod";
import { a as getUserDevices, d as deleteDevice } from "./remnawave-BfJEzmRS.js";
import { c as createServerFn, a as getCookie } from "../server.js";
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
async function getAuthenticatedAccount() {
  const token = getCookie(COOKIE);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const result = await pool.query("SELECT id, email, name, telegram_user_id FROM web_accounts WHERE id = $1", [payload.accountId]);
  return result.rows[0] ?? null;
}
const getDashboardDataFn_createServerFn_handler = createServerRpc({
  id: "5d3a6d8575218593933fd24bcfb68bcd6c1e482b609add67819d0e855cc5018b",
  name: "getDashboardDataFn",
  filename: "src/api/dashboard.ts"
}, (opts) => getDashboardDataFn.__executeServer(opts));
const getDashboardDataFn = createServerFn({
  method: "GET"
}).handler(getDashboardDataFn_createServerFn_handler, async () => {
  const account = await getAuthenticatedAccount();
  if (!account) throw new Error("Не авторизован");
  let subscriptions = [];
  let balance = 0;
  if (account.telegram_user_id) {
    const [subsResult, balanceResult] = await Promise.all([pool.query(`SELECT id, user_id, username, remna_uuid, sub_url, created_at, expires_at, tariff, devices, remna_username
         FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC`, [account.telegram_user_id]), pool.query("SELECT balance FROM users WHERE user_id = $1", [account.telegram_user_id])]);
    subscriptions = subsResult.rows;
    balance = balanceResult.rows[0]?.balance ?? 0;
  }
  return {
    account,
    subscriptions,
    balance
  };
});
const linkTelegramFn_createServerFn_handler = createServerRpc({
  id: "a01ca2150fb3a7110a3ac105911889d49d88a8a516150563e70e496e3463f90e",
  name: "linkTelegramFn",
  filename: "src/api/dashboard.ts"
}, (opts) => linkTelegramFn.__executeServer(opts));
const linkTelegramFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  telegramId: z.string().regex(/^\d+$/, "Введите числовой ID")
})).handler(linkTelegramFn_createServerFn_handler, async ({
  data
}) => {
  const account = await getAuthenticatedAccount();
  if (!account) throw new Error("Не авторизован");
  const userCheck = await pool.query("SELECT user_id FROM users WHERE user_id = $1", [data.telegramId]);
  if (userCheck.rows.length === 0) {
    throw new Error("Пользователь с таким Telegram ID не найден в боте");
  }
  const existing = await pool.query("SELECT id FROM web_accounts WHERE telegram_user_id = $1 AND id != $2", [data.telegramId, account.id]);
  if (existing.rows.length > 0) {
    throw new Error("Этот Telegram аккаунт уже привязан к другому аккаунту");
  }
  await pool.query("UPDATE web_accounts SET telegram_user_id = $1 WHERE id = $2", [data.telegramId, account.id]);
  return {
    ok: true
  };
});
const getDevicesFn_createServerFn_handler = createServerRpc({
  id: "5533b32c62497a68b9e7a9956a9b748467e061155655107d1c37442a373ee747",
  name: "getDevicesFn",
  filename: "src/api/dashboard.ts"
}, (opts) => getDevicesFn.__executeServer(opts));
const getDevicesFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  remnaUuid: z.string().min(1)
})).handler(getDevicesFn_createServerFn_handler, async ({
  data
}) => {
  const account = await getAuthenticatedAccount();
  if (!account?.telegram_user_id) throw new Error("Не авторизован");
  const check = await pool.query("SELECT id FROM subscriptions WHERE remna_uuid = $1 AND user_id = $2", [data.remnaUuid, account.telegram_user_id]);
  if (check.rows.length === 0) throw new Error("Нет доступа");
  const devices = await getUserDevices(data.remnaUuid);
  return devices.map((d) => ({
    hwid: d.hwid ?? d.hwId ?? "",
    deviceModel: d.deviceModel ?? "Устройство"
  }));
});
const deleteDeviceFn_createServerFn_handler = createServerRpc({
  id: "a6b2b735ecfaa96e1a8706a78a2164a66e44f93d28f719781bbdda8ba3f902ae",
  name: "deleteDeviceFn",
  filename: "src/api/dashboard.ts"
}, (opts) => deleteDeviceFn.__executeServer(opts));
const deleteDeviceFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  remnaUuid: z.string().min(1),
  hwid: z.string().min(1)
})).handler(deleteDeviceFn_createServerFn_handler, async ({
  data
}) => {
  const account = await getAuthenticatedAccount();
  if (!account?.telegram_user_id) throw new Error("Не авторизован");
  const check = await pool.query("SELECT id FROM subscriptions WHERE remna_uuid = $1 AND user_id = $2", [data.remnaUuid, account.telegram_user_id]);
  if (check.rows.length === 0) throw new Error("Нет доступа");
  const ok = await deleteDevice(data.remnaUuid, data.hwid);
  if (!ok) throw new Error("Не удалось удалить устройство");
  return {
    ok: true
  };
});
export {
  deleteDeviceFn_createServerFn_handler,
  getDashboardDataFn_createServerFn_handler,
  getDevicesFn_createServerFn_handler,
  linkTelegramFn_createServerFn_handler
};
