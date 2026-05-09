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

  const webUserId = String(account.id)
  const userIds = account.telegram_user_id
    ? [account.telegram_user_id, webUserId]
    : [webUserId]

  const [subsResult, balanceResult] = await Promise.all([
    pool.query(
      `SELECT id, user_id, username, remna_uuid, sub_url, created_at, expires_at, tariff, devices, remna_username
       FROM subscriptions WHERE user_id = ANY($1) ORDER BY created_at DESC`,
      [userIds]
    ),
    account.telegram_user_id
      ? pool.query('SELECT balance FROM users WHERE user_id = $1', [account.telegram_user_id])
      : Promise.resolve({ rows: [] }),
  ])

  const subscriptions = subsResult.rows as Subscription[]
  const balance = balanceResult.rows[0]?.balance ?? 0

  return { account, subscriptions, balance }
})

export const getDevicesFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ remnaUuid: z.string().min(1) }))
  .handler(async ({ data }) => {
    const account = await getAuthenticatedAccount()
    if (!account) throw new Error('Не авторизован')

    const webUserId = String(account.id)
    const userIds = account.telegram_user_id
      ? [account.telegram_user_id, webUserId]
      : [webUserId]

    const check = await pool.query(
      'SELECT id FROM subscriptions WHERE remna_uuid = $1 AND user_id = ANY($2)',
      [data.remnaUuid, userIds]
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
    if (!account) throw new Error('Не авторизован')

    const webUserId = String(account.id)
    const userIds = account.telegram_user_id
      ? [account.telegram_user_id, webUserId]
      : [webUserId]

    const check = await pool.query(
      'SELECT id FROM subscriptions WHERE remna_uuid = $1 AND user_id = ANY($2)',
      [data.remnaUuid, userIds]
    )
    if (check.rows.length === 0) throw new Error('Нет доступа')

    const ok = await remna.deleteDevice(data.remnaUuid, data.hwid)
    if (!ok) throw new Error('Не удалось удалить устройство')
    return { ok: true }
  })
