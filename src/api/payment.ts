import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import pool from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { issueOrExtend, addDevicesForSub } from '@/lib/vpn'
import { createPayment as ykCreatePayment } from '@/lib/yookassa'
import type { WebAccount } from '@/api/auth'

const COOKIE = 'auth_token'

const TARIFFS = {
  trial: { days: 3, priceRub: 0, label: 'Пробный · 3 дня · Бесплатно' },
  m1: { days: 30, priceRub: 99, label: '1 месяц · 99 ₽' },
  m3: { days: 90, priceRub: 269, label: '3 месяца · 269 ₽' },
  m12: { days: 365, priceRub: 899, label: '12 месяцев · 899 ₽' },
} as const

type TariffKey = keyof typeof TARIFFS

const DEVICES_STEP = 2
const DEVICES_PRICE_RUB = 50

async function getAccount(): Promise<WebAccount | null> {
  const token = getCookie(COOKIE)
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const r = await pool.query(
    'SELECT id, email, name, telegram_user_id FROM web_accounts WHERE id = $1',
    [payload.accountId]
  )
  return (r.rows[0] ?? null) as WebAccount | null
}

function effectiveUserId(account: WebAccount): string {
  return account.telegram_user_id ?? String(account.id)
}

function fmtNow(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

export const getTariffsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const account = await getAccount()
  if (!account) throw new Error('Не авторизован')

  let trialUsed = false
  let balance = 0

  if (account.telegram_user_id) {
    const userRow = await pool.query<{ trial_used: number; balance: number }>(
      'SELECT trial_used, balance FROM users WHERE user_id = $1',
      [account.telegram_user_id]
    )
    const user = userRow.rows[0]
    trialUsed = Boolean(user?.trial_used)
    balance = Number(user?.balance ?? 0)
  } else {
    const webUserId = String(account.id)
    const trialCheck = await pool.query(
      "SELECT id FROM subscriptions WHERE user_id = $1 AND tariff = 'trial'",
      [webUserId]
    )
    trialUsed = trialCheck.rows.length > 0
  }

  return {
    tariffs: (Object.entries(TARIFFS) as [TariffKey, (typeof TARIFFS)[TariffKey]][]).map(
      ([key, t]) => ({ key, ...t })
    ),
    trialUsed,
    balance,
    devicesPriceRub: DEVICES_PRICE_RUB,
    devicesStep: DEVICES_STEP,
  }
})

export const activateTrialFn = createServerFn({ method: 'POST' }).handler(async () => {
  const account = await getAccount()
  if (!account) throw new Error('Не авторизован')

  const userId = effectiveUserId(account)

  if (account.telegram_user_id) {
    const userRow = await pool.query<{ trial_used: number }>(
      'SELECT trial_used FROM users WHERE user_id = $1',
      [account.telegram_user_id]
    )
    if (userRow.rows[0]?.trial_used) throw new Error('Пробный период уже использован')
  } else {
    const trialCheck = await pool.query(
      "SELECT id FROM subscriptions WHERE user_id = $1 AND tariff = 'trial'",
      [userId]
    )
    if (trialCheck.rows.length > 0) throw new Error('Пробный период уже использован')
  }

  const result = await issueOrExtend(userId, TARIFFS.trial.days, 'trial', account.telegram_user_id ?? null)
  if (!result.ok) throw new Error('Не удалось создать подписку. Попробуйте позже.')

  if (account.telegram_user_id) {
    await pool.query('UPDATE users SET trial_used = 1 WHERE user_id = $1', [account.telegram_user_id])
  }

  return { subUrl: result.subUrl, expiresAt: result.expiresAt.toISOString() }
})

export const buyWithBalanceFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ tariff: z.enum(['m1', 'm3', 'm12']) }))
  .handler(async ({ data }) => {
    const account = await getAccount()
    if (!account?.telegram_user_id) throw new Error('Баланс доступен только для привязанных аккаунтов')

    const t = TARIFFS[data.tariff]

    const balRow = await pool.query<{ balance: number }>(
      'SELECT balance FROM users WHERE user_id = $1',
      [account.telegram_user_id]
    )
    const balance = Number(balRow.rows[0]?.balance ?? 0)
    if (balance < t.priceRub) throw new Error('Недостаточно средств на балансе')

    const deduct = await pool.query(
      'UPDATE users SET balance = balance - $1 WHERE user_id = $2 AND balance >= $1 RETURNING id',
      [t.priceRub, account.telegram_user_id]
    )
    if (deduct.rowCount === 0) throw new Error('Недостаточно средств на балансе')

    await pool.query(
      `INSERT INTO balance_tx (user_id, amount, kind, description, created_at)
       VALUES ($1, $2, 'spend', $3, $4)`,
      [account.telegram_user_id, -t.priceRub, `Покупка тарифа ${data.tariff} (веб)`, fmtNow()]
    )

    const result = await issueOrExtend(account.telegram_user_id, t.days, data.tariff, account.telegram_user_id)
    if (!result.ok) {
      await pool.query(
        'UPDATE users SET balance = balance + $1 WHERE user_id = $2',
        [t.priceRub, account.telegram_user_id]
      )
      await pool.query(
        `INSERT INTO balance_tx (user_id, amount, kind, description, created_at)
         VALUES ($1, $2, 'refund', $3, $4)`,
        [account.telegram_user_id, t.priceRub, 'Возврат: ошибка выдачи подписки', fmtNow()]
      )
      throw new Error('Не удалось создать подписку. Средства возвращены.')
    }

    return { subUrl: result.subUrl, expiresAt: result.expiresAt.toISOString() }
  })

export const createCardPaymentFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ tariff: z.enum(['m1', 'm3', 'm12']) }))
  .handler(async ({ data }) => {
    const account = await getAccount()
    if (!account) throw new Error('Не авторизован')

    const userId = effectiveUserId(account)
    const t = TARIFFS[data.tariff]
    const invoiceId = `web_${userId}_${Date.now()}`
    const returnUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/dashboard`

    await pool.query(
      `INSERT INTO payments (invoice_id, user_id, amount, days, tariff, promo, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NULL, 'pending', $6)`,
      [invoiceId, userId, t.priceRub, t.days, data.tariff, fmtNow()]
    )

    const yk = await ykCreatePayment({
      amountRub: t.priceRub,
      description: `УбежищеVPN · ${t.label}`,
      invoiceId,
      returnUrl,
    })

    if (!yk?.paymentUrl) {
      await pool.query('DELETE FROM payments WHERE invoice_id = $1', [invoiceId])
      throw new Error('Не удалось создать платёж. Попробуйте позже.')
    }

    return { paymentUrl: yk.paymentUrl }
  })

export const buyDevicesWithBalanceFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ subId: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const account = await getAccount()
    if (!account?.telegram_user_id) throw new Error('Баланс доступен только для привязанных аккаунтов')

    const balRow = await pool.query<{ balance: number }>(
      'SELECT balance FROM users WHERE user_id = $1',
      [account.telegram_user_id]
    )
    const balance = Number(balRow.rows[0]?.balance ?? 0)
    if (balance < DEVICES_PRICE_RUB) throw new Error('Недостаточно средств на балансе')

    const deduct = await pool.query(
      'UPDATE users SET balance = balance - $1 WHERE user_id = $2 AND balance >= $1 RETURNING id',
      [DEVICES_PRICE_RUB, account.telegram_user_id]
    )
    if (deduct.rowCount === 0) throw new Error('Недостаточно средств на балансе')

    await pool.query(
      `INSERT INTO balance_tx (user_id, amount, kind, description, created_at)
       VALUES ($1, $2, 'spend', $3, $4)`,
      [account.telegram_user_id, -DEVICES_PRICE_RUB, 'Покупка +2 устройств (веб)', fmtNow()]
    )

    const result = await addDevicesForSub(data.subId, account.telegram_user_id)
    if (!result.ok) {
      await pool.query(
        'UPDATE users SET balance = balance + $1 WHERE user_id = $2',
        [DEVICES_PRICE_RUB, account.telegram_user_id]
      )
      await pool.query(
        `INSERT INTO balance_tx (user_id, amount, kind, description, created_at)
         VALUES ($1, $2, 'refund', $3, $4)`,
        [account.telegram_user_id, DEVICES_PRICE_RUB, 'Возврат: ошибка добавления устройств', fmtNow()]
      )
      throw new Error('Не удалось добавить устройства. Средства возвращены.')
    }

    return { newLimit: result.newLimit }
  })

export const createDevicesCardPaymentFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ subId: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const account = await getAccount()
    if (!account) throw new Error('Не авторизован')

    const userId = effectiveUserId(account)
    const userIds = account.telegram_user_id
      ? [account.telegram_user_id, String(account.id)]
      : [String(account.id)]

    const subCheck = await pool.query(
      'SELECT id FROM subscriptions WHERE id = $1 AND user_id = ANY($2)',
      [data.subId, userIds]
    )
    if (subCheck.rows.length === 0) throw new Error('Подписка не найдена')

    const invoiceId = `web_${userId}_dev_${Date.now()}`
    const returnUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/dashboard`

    await pool.query(
      `INSERT INTO payments (invoice_id, user_id, amount, days, tariff, promo, status, created_at)
       VALUES ($1, $2, $3, 0, 'devices', NULL, 'pending', $4)`,
      [invoiceId, userId, DEVICES_PRICE_RUB, fmtNow()]
    )

    const yk = await ykCreatePayment({
      amountRub: DEVICES_PRICE_RUB,
      description: `УбежищеVPN · +${DEVICES_STEP} устройства`,
      invoiceId,
      returnUrl,
    })

    if (!yk?.paymentUrl) {
      await pool.query('DELETE FROM payments WHERE invoice_id = $1', [invoiceId])
      throw new Error('Не удалось создать платёж. Попробуйте позже.')
    }

    return { paymentUrl: yk.paymentUrl }
  })
