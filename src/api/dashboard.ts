import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import pool from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import type { WebAccount } from '@/api/auth'

const COOKIE = 'auth_token'

async function getAuthenticatedAccount(): Promise<WebAccount | null> {
  const token = getCookie(COOKIE)
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null

  const result = await pool.query(
    'SELECT id, email, name, telegram_user_id FROM web_accounts WHERE id = $1',
    [payload.accountId]
  )
  return (result.rows[0] ?? null) as WebAccount | null
}

export type Subscription = {
  id: number
  user_id: string
  username: string | null
  sub_url: string
  created_at: string
  expires_at: string
  tariff: string | null
  devices: number
}

export const getDashboardDataFn = createServerFn({ method: 'GET' }).handler(async () => {
  const account = await getAuthenticatedAccount()
  if (!account) throw new Error('Не авторизован')

  let subscriptions: Subscription[] = []
  let balance = 0

  if (account.telegram_user_id) {
    const [subsResult, balanceResult] = await Promise.all([
      pool.query(
        'SELECT id, user_id, username, sub_url, created_at, expires_at, tariff, devices FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC',
        [account.telegram_user_id]
      ),
      pool.query('SELECT balance FROM users WHERE user_id = $1', [account.telegram_user_id]),
    ])
    subscriptions = subsResult.rows as Subscription[]
    balance = balanceResult.rows[0]?.balance ?? 0
  }

  return { account, subscriptions, balance }
})

export const linkTelegramFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ telegramId: z.string().regex(/^\d+$/, 'Введите числовой ID') }))
  .handler(async ({ data }) => {
    const account = await getAuthenticatedAccount()
    if (!account) throw new Error('Не авторизован')

    const userCheck = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [
      data.telegramId,
    ])
    if (userCheck.rows.length === 0) {
      throw new Error('Пользователь с таким Telegram ID не найден в боте')
    }

    const existing = await pool.query(
      'SELECT id FROM web_accounts WHERE telegram_user_id = $1 AND id != $2',
      [data.telegramId, account.id]
    )
    if (existing.rows.length > 0) {
      throw new Error('Этот Telegram аккаунт уже привязан к другому аккаунту')
    }

    await pool.query('UPDATE web_accounts SET telegram_user_id = $1 WHERE id = $2', [
      data.telegramId,
      account.id,
    ])

    return { ok: true }
  })
