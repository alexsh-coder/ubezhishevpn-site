import { p as pool, c as createServerRpc, v as verifyToken } from "./auth-B-kOQ_qs.js";
import { z } from "zod";
import { g as getUser, u as updateUserExpire, c as createUser, s as setDeviceLimit } from "./remnawave-BfJEzmRS.js";
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
const DEVICES_DEFAULT = 4;
function makeRemnaUsername(length = 12) {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => alpha[Math.floor(Math.random() * alpha.length)]).join("");
}
function fmtDate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}
function parseDbDate(s) {
  return /* @__PURE__ */ new Date(s.replace(" ", "T") + ":00Z");
}
function addDays(d, days) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}
async function issueOrExtend(userId, days, tariff, telegramId = null) {
  const now = /* @__PURE__ */ new Date();
  const subsRes = await pool.query(
    "SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY id DESC LIMIT 20",
    [userId]
  );
  const activeSub = subsRes.rows.find((r) => {
    try {
      return parseDbDate(r.expires_at) > now;
    } catch {
      return false;
    }
  });
  const newExp = addDays(now, days);
  if (activeSub?.remna_uuid) {
    const existing = await getUser(activeSub.remna_uuid);
    if (existing) {
      const curExp = parseDbDate(activeSub.expires_at);
      const extended = addDays(curExp, days);
      const ok = await updateUserExpire(activeSub.remna_uuid, extended);
      if (ok) {
        await pool.query("UPDATE subscriptions SET expires_at = $1 WHERE id = $2", [
          fmtDate(extended),
          activeSub.id
        ]);
        return { ok: true, subUrl: activeSub.sub_url, expiresAt: extended, subId: activeSub.id };
      }
    }
  }
  const remnaUsername = makeRemnaUsername();
  const devices = activeSub?.devices ?? DEVICES_DEFAULT;
  let tgUsername = "";
  if (telegramId) {
    const userRes = await pool.query("SELECT username FROM users WHERE user_id = $1", [telegramId]);
    tgUsername = userRes.rows[0]?.username ?? "";
  }
  const created = await createUser({
    username: remnaUsername,
    expireAt: newExp,
    description: `Web user=${userId} tariff=${tariff}`,
    deviceLimit: devices,
    telegramId
  });
  if (!created) return { ok: false, subUrl: "", expiresAt: newExp, subId: null };
  const subUrl = created.subscriptionUrl;
  if (!subUrl) return { ok: false, subUrl: "", expiresAt: newExp, subId: null };
  const ins = await pool.query(
    `INSERT INTO subscriptions (user_id, username, remna_uuid, sub_id, sub_url, created_at, expires_at, tariff, devices, remna_username)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      userId,
      tgUsername,
      created.uuid,
      created.shortUuid ?? created.uuid.substring(0, 8),
      subUrl,
      fmtDate(now),
      fmtDate(newExp),
      tariff,
      devices,
      remnaUsername
    ]
  );
  return { ok: true, subUrl, expiresAt: newExp, subId: ins.rows[0]?.id ?? null };
}
async function addDevicesForSub(subId, telegramId) {
  const subRes = await pool.query(
    "SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2",
    [subId, telegramId]
  );
  const sub = subRes.rows[0];
  if (!sub?.remna_uuid) return { ok: false, newLimit: 0 };
  const cur = sub.devices ?? DEVICES_DEFAULT;
  const newLimit = cur + 2;
  const ok = await setDeviceLimit(sub.remna_uuid, newLimit);
  if (!ok) return { ok: false, newLimit: cur };
  await pool.query("UPDATE subscriptions SET devices = $1 WHERE id = $2", [newLimit, subId]);
  return { ok: true, newLimit };
}
const SHOP_ID = process.env.YOOKASSA_SHOP_ID ?? "";
const SECRET = process.env.YOOKASSA_SECRET_KEY ?? "";
function auth() {
  return "Basic " + Buffer.from(`${SHOP_ID}:${SECRET}`).toString("base64");
}
async function createPayment(opts) {
  if (!SHOP_ID || !SECRET) return null;
  try {
    const res = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        Authorization: auth(),
        "Content-Type": "application/json",
        "Idempotence-Key": crypto.randomUUID()
      },
      body: JSON.stringify({
        amount: { value: opts.amountRub.toFixed(2), currency: "RUB" },
        confirmation: { type: "redirect", return_url: opts.returnUrl },
        capture: true,
        description: opts.description,
        metadata: { invoice_id: opts.invoiceId }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      paymentUrl: data.confirmation?.confirmation_url ?? "",
      yookassaId: data.id ?? ""
    };
  } catch {
    return null;
  }
}
const COOKIE = "auth_token";
const TARIFFS = {
  // trial: { days: 3, priceRub: 0, label: 'Пробный · 3 дня · Бесплатно' },
  m1: {
    days: 30,
    priceRub: 99,
    label: "1 месяц · 99 ₽"
  },
  m3: {
    days: 90,
    priceRub: 269,
    label: "3 месяца · 269 ₽"
  },
  m12: {
    days: 365,
    priceRub: 899,
    label: "12 месяцев · 899 ₽"
  }
};
const DEVICES_STEP = 2;
const DEVICES_PRICE_RUB = 50;
async function getAccount() {
  const token = getCookie(COOKIE);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const r = await pool.query("SELECT id, email, name, telegram_user_id FROM web_accounts WHERE id = $1", [payload.accountId]);
  return r.rows[0] ?? null;
}
function effectiveUserId(account) {
  return account.telegram_user_id ?? String(account.id);
}
function fmtNow() {
  const d = /* @__PURE__ */ new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}
const getTariffsFn_createServerFn_handler = createServerRpc({
  id: "01de0cac8f889cb4d5afad5c26402c1af217daf297b3c7e844cfae2f78cfabf3",
  name: "getTariffsFn",
  filename: "src/api/payment.ts"
}, (opts) => getTariffsFn.__executeServer(opts));
const getTariffsFn = createServerFn({
  method: "GET"
}).handler(getTariffsFn_createServerFn_handler, async () => {
  const account = await getAccount();
  if (!account) throw new Error("Не авторизован");
  let trialUsed = false;
  let balance = 0;
  if (account.telegram_user_id) {
    const userRow = await pool.query("SELECT trial_used, balance FROM users WHERE user_id = $1", [account.telegram_user_id]);
    const user = userRow.rows[0];
    trialUsed = Boolean(user?.trial_used);
    balance = Number(user?.balance ?? 0);
  } else {
    const webUserId = String(account.id);
    const trialCheck = await pool.query("SELECT id FROM subscriptions WHERE user_id = $1 AND tariff = 'trial'", [webUserId]);
    trialUsed = trialCheck.rows.length > 0;
  }
  return {
    tariffs: Object.entries(TARIFFS).map(([key, t]) => ({
      key,
      ...t
    })),
    trialUsed,
    balance,
    devicesPriceRub: DEVICES_PRICE_RUB,
    devicesStep: DEVICES_STEP
  };
});
const activateTrialFn_createServerFn_handler = createServerRpc({
  id: "2d4912260aae0e2821f9a0473278079ece7a3b1f4bd3577caa311c66b869ea75",
  name: "activateTrialFn",
  filename: "src/api/payment.ts"
}, (opts) => activateTrialFn.__executeServer(opts));
const activateTrialFn = createServerFn({
  method: "POST"
}).handler(activateTrialFn_createServerFn_handler, async () => {
  const account = await getAccount();
  if (!account) throw new Error("Не авторизован");
  const userId = effectiveUserId(account);
  if (account.telegram_user_id) {
    const userRow = await pool.query("SELECT trial_used FROM users WHERE user_id = $1", [account.telegram_user_id]);
    if (userRow.rows[0]?.trial_used) throw new Error("Пробный период уже использован");
  } else {
    const trialCheck = await pool.query("SELECT id FROM subscriptions WHERE user_id = $1 AND tariff = 'trial'", [userId]);
    if (trialCheck.rows.length > 0) throw new Error("Пробный период уже использован");
  }
  const result = await issueOrExtend(userId, TARIFFS.trial.days, "trial", account.telegram_user_id ?? null);
  if (!result.ok) throw new Error("Не удалось создать подписку. Попробуйте позже.");
  if (account.telegram_user_id) {
    await pool.query("UPDATE users SET trial_used = 1 WHERE user_id = $1", [account.telegram_user_id]);
  }
  return {
    subUrl: result.subUrl,
    expiresAt: result.expiresAt.toISOString()
  };
});
const buyWithBalanceFn_createServerFn_handler = createServerRpc({
  id: "7d560aef9e5947215ae66ac310a915d04cb56938536dc3b73e7a8fa0eee4296b",
  name: "buyWithBalanceFn",
  filename: "src/api/payment.ts"
}, (opts) => buyWithBalanceFn.__executeServer(opts));
const buyWithBalanceFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  tariff: z.enum(["m1", "m3", "m12"])
})).handler(buyWithBalanceFn_createServerFn_handler, async ({
  data
}) => {
  const account = await getAccount();
  if (!account?.telegram_user_id) throw new Error("Баланс доступен только для привязанных аккаунтов");
  const t = TARIFFS[data.tariff];
  const balRow = await pool.query("SELECT balance FROM users WHERE user_id = $1", [account.telegram_user_id]);
  const balance = Number(balRow.rows[0]?.balance ?? 0);
  if (balance < t.priceRub) throw new Error("Недостаточно средств на балансе");
  const deduct = await pool.query("UPDATE users SET balance = balance - $1 WHERE user_id = $2 AND balance >= $1 RETURNING id", [t.priceRub, account.telegram_user_id]);
  if (deduct.rowCount === 0) throw new Error("Недостаточно средств на балансе");
  await pool.query(`INSERT INTO balance_tx (user_id, amount, kind, description, created_at)
       VALUES ($1, $2, 'spend', $3, $4)`, [account.telegram_user_id, -t.priceRub, `Покупка тарифа ${data.tariff} (веб)`, fmtNow()]);
  const result = await issueOrExtend(account.telegram_user_id, t.days, data.tariff, account.telegram_user_id);
  if (!result.ok) {
    await pool.query("UPDATE users SET balance = balance + $1 WHERE user_id = $2", [t.priceRub, account.telegram_user_id]);
    await pool.query(`INSERT INTO balance_tx (user_id, amount, kind, description, created_at)
         VALUES ($1, $2, 'refund', $3, $4)`, [account.telegram_user_id, t.priceRub, "Возврат: ошибка выдачи подписки", fmtNow()]);
    throw new Error("Не удалось создать подписку. Средства возвращены.");
  }
  return {
    subUrl: result.subUrl,
    expiresAt: result.expiresAt.toISOString()
  };
});
const createCardPaymentFn_createServerFn_handler = createServerRpc({
  id: "a674a4b7e6b570e9ead43c412717189958e8e03b41ab710763411b5e1960f270",
  name: "createCardPaymentFn",
  filename: "src/api/payment.ts"
}, (opts) => createCardPaymentFn.__executeServer(opts));
const createCardPaymentFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  tariff: z.enum(["m1", "m3", "m12"])
})).handler(createCardPaymentFn_createServerFn_handler, async ({
  data
}) => {
  const account = await getAccount();
  if (!account) throw new Error("Не авторизован");
  const userId = effectiveUserId(account);
  const t = TARIFFS[data.tariff];
  const invoiceId = `web_${userId}_${Date.now()}`;
  const returnUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard`;
  await pool.query(`INSERT INTO payments (invoice_id, user_id, amount, days, tariff, promo, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NULL, 'pending', $6)`, [invoiceId, userId, t.priceRub, t.days, data.tariff, fmtNow()]);
  const yk = await createPayment({
    amountRub: t.priceRub,
    description: `УбежищеVPN · ${t.label}`,
    invoiceId,
    returnUrl
  });
  if (!yk?.paymentUrl) {
    await pool.query("DELETE FROM payments WHERE invoice_id = $1", [invoiceId]);
    throw new Error("Не удалось создать платёж. Попробуйте позже.");
  }
  return {
    paymentUrl: yk.paymentUrl
  };
});
const buyDevicesWithBalanceFn_createServerFn_handler = createServerRpc({
  id: "dc53a6730c47ab72c4cc3a3683164d584a74cd2688784c5cf65e571c0c8fbf1a",
  name: "buyDevicesWithBalanceFn",
  filename: "src/api/payment.ts"
}, (opts) => buyDevicesWithBalanceFn.__executeServer(opts));
const buyDevicesWithBalanceFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  subId: z.coerce.number().int().positive()
})).handler(buyDevicesWithBalanceFn_createServerFn_handler, async ({
  data
}) => {
  const account = await getAccount();
  if (!account?.telegram_user_id) throw new Error("Баланс доступен только для привязанных аккаунтов");
  const balRow = await pool.query("SELECT balance FROM users WHERE user_id = $1", [account.telegram_user_id]);
  const balance = Number(balRow.rows[0]?.balance ?? 0);
  if (balance < DEVICES_PRICE_RUB) throw new Error("Недостаточно средств на балансе");
  const deduct = await pool.query("UPDATE users SET balance = balance - $1 WHERE user_id = $2 AND balance >= $1 RETURNING id", [DEVICES_PRICE_RUB, account.telegram_user_id]);
  if (deduct.rowCount === 0) throw new Error("Недостаточно средств на балансе");
  await pool.query(`INSERT INTO balance_tx (user_id, amount, kind, description, created_at)
       VALUES ($1, $2, 'spend', $3, $4)`, [account.telegram_user_id, -DEVICES_PRICE_RUB, "Покупка +2 устройств (веб)", fmtNow()]);
  const result = await addDevicesForSub(data.subId, account.telegram_user_id);
  if (!result.ok) {
    await pool.query("UPDATE users SET balance = balance + $1 WHERE user_id = $2", [DEVICES_PRICE_RUB, account.telegram_user_id]);
    await pool.query(`INSERT INTO balance_tx (user_id, amount, kind, description, created_at)
         VALUES ($1, $2, 'refund', $3, $4)`, [account.telegram_user_id, DEVICES_PRICE_RUB, "Возврат: ошибка добавления устройств", fmtNow()]);
    throw new Error("Не удалось добавить устройства. Средства возвращены.");
  }
  return {
    newLimit: result.newLimit
  };
});
const createDevicesCardPaymentFn_createServerFn_handler = createServerRpc({
  id: "106d2db918fd7a0e558d1ee9877ca8987d3cd98bd97ed55dcb71e0108b079c4b",
  name: "createDevicesCardPaymentFn",
  filename: "src/api/payment.ts"
}, (opts) => createDevicesCardPaymentFn.__executeServer(opts));
const createDevicesCardPaymentFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  subId: z.coerce.number().int().positive()
})).handler(createDevicesCardPaymentFn_createServerFn_handler, async ({
  data
}) => {
  const account = await getAccount();
  if (!account) throw new Error("Не авторизован");
  const userId = effectiveUserId(account);
  const userIds = account.telegram_user_id ? [account.telegram_user_id, String(account.id)] : [String(account.id)];
  const subCheck = await pool.query("SELECT id FROM subscriptions WHERE id = $1 AND user_id = ANY($2)", [data.subId, userIds]);
  if (subCheck.rows.length === 0) throw new Error("Подписка не найдена");
  const invoiceId = `web_${userId}_dev_${Date.now()}`;
  const returnUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard`;
  await pool.query(`INSERT INTO payments (invoice_id, user_id, amount, days, tariff, promo, status, created_at)
       VALUES ($1, $2, $3, 0, 'devices', NULL, 'pending', $4)`, [invoiceId, userId, DEVICES_PRICE_RUB, fmtNow()]);
  const yk = await createPayment({
    amountRub: DEVICES_PRICE_RUB,
    description: `УбежищеVPN · +${DEVICES_STEP} устройства`,
    invoiceId,
    returnUrl
  });
  if (!yk?.paymentUrl) {
    await pool.query("DELETE FROM payments WHERE invoice_id = $1", [invoiceId]);
    throw new Error("Не удалось создать платёж. Попробуйте позже.");
  }
  return {
    paymentUrl: yk.paymentUrl
  };
});
export {
  activateTrialFn_createServerFn_handler,
  buyDevicesWithBalanceFn_createServerFn_handler,
  buyWithBalanceFn_createServerFn_handler,
  createCardPaymentFn_createServerFn_handler,
  createDevicesCardPaymentFn_createServerFn_handler,
  getTariffsFn_createServerFn_handler
};
