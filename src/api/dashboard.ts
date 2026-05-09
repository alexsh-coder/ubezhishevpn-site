import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import pool from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import * as remna from '@/lib/remnawave'
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
  remna_uuid: string
  sub_url: string
  created_at: string
  expires_at: string
  tariff: string | null
  devices: number
  remna_username: string | null
}

export type Device = {
  hwid: string
  deviceModel: string
}

export const getDashboardDataFn = createServerFn({ method: 'GET' }).handler(async () => {
  const account = await getAuthenticatedAccount()
  if (!account) throw new Error('Не авторизован')

  let subscriptions: Subscription[] = []
  let balance = 0

  if (account.telegram_user_id) {
    const [subsResult, balanceResult] = await Promise.all([
      pool.query(
        `SELECT id, user_id, username, remna_uuid, sub_url, created_at, expires_at, tariff, devices, remna_username
         FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC`,
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

export const getDevicesFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ remnaUuid: z.string().min(1) }))
  .handler(async ({ data }) => {
    const account = await getAuthenticatedAccount()
    if (!account?.telegram_user_id) throw new Error('Не авторизован')

    const check = await pool.query(
      'SELECT id FROM subscriptions WHERE remna_uuid = $1 AND user_id = $2',
      [data.remnaUuid, account.telegram_user_id]
    )
    if (check.rows.length === 0) throw new Error('Нет доступа')

    const devices = await remna.getUserDevices(data.remnaUuid)
    return devices.map((d) => ({
      hwid: (d.hwid ?? d.hwId ?? '') as string,
      deviceModel: (d.deviceModel ?? 'Устройство') as string,
    })) as Device[]
  })

export const deleteDeviceFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ remnaUuid: z.string().min(1), hwid: z.string().min(1) }))
  .handler(async ({ data }) => {
    const account = await getAuthenticatedAccount()
    if (!account?.telegram_user_id) throw new Error('Не авторизован')

    const check = await pool.query(
      'SELECT id FROM subscriptions WHERE remna_uuid = $1 AND user_id = $2',
      [data.remnaUuid, account.telegram_user_id]
    )
    if (check.rows.length === 0) throw new Error('Нет доступа')

    const ok = await remna.deleteDevice(data.remnaUuid, data.hwid)
    if (!ok) throw new Error('Не удалось удалить устройство')
    return { ok: true }
  })
