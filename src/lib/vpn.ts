import pool from './db'
import * as remna from './remnawave'

const DEVICES_DEFAULT = 4

export function makeRemnaUsername(length = 12): string {
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => alpha[Math.floor(Math.random() * alpha.length)]).join('')
}

function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

function parseDbDate(s: string): Date {
  return new Date(s.replace(' ', 'T') + ':00Z')
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setUTCDate(r.getUTCDate() + days)
  return r
}

type SubRow = {
  id: number
  expires_at: string
  remna_uuid: string | null
  sub_url: string
  devices: number | null
  [key: string]: unknown
}

export type IssueResult = {
  ok: boolean
  subUrl: string
  expiresAt: Date
  subId: number | null
}

export async function issueOrExtend(
  telegramId: string,
  days: number,
  tariff: string
): Promise<IssueResult> {
  const now = new Date()
  const subsRes = await pool.query<SubRow>(
    'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY id DESC LIMIT 20',
    [telegramId]
  )
  const activeSub = subsRes.rows.find((r) => {
    try { return parseDbDate(r.expires_at) > now } catch { return false }
  })

  const newExp = addDays(now, days)

  if (activeSub?.remna_uuid) {
    const existing = await remna.getUser(activeSub.remna_uuid)
    if (existing) {
      const curExp = parseDbDate(activeSub.expires_at)
      const extended = addDays(curExp, days)
      const ok = await remna.updateUserExpire(activeSub.remna_uuid, extended)
      if (ok) {
        await pool.query('UPDATE subscriptions SET expires_at = $1 WHERE id = $2', [
          fmtDate(extended),
          activeSub.id,
        ])
        return { ok: true, subUrl: activeSub.sub_url, expiresAt: extended, subId: activeSub.id }
      }
    }
  }

  const remnaUsername = makeRemnaUsername()
  const devices = activeSub?.devices ?? DEVICES_DEFAULT
  const userRes = await pool.query<{ username: string }>('SELECT username FROM users WHERE user_id = $1', [telegramId])
  const tgUsername = userRes.rows[0]?.username ?? ''

  const created = await remna.createUser({
    username: remnaUsername,
    expireAt: newExp,
    description: `Web tg=${telegramId} tariff=${tariff}`,
    deviceLimit: devices,
    telegramId,
  })
  if (!created) return { ok: false, subUrl: '', expiresAt: newExp, subId: null }

  const subUrl = created.subscriptionUrl
  if (!subUrl) return { ok: false, subUrl: '', expiresAt: newExp, subId: null }

  const ins = await pool.query<{ id: number }>(
    `INSERT INTO subscriptions (user_id, username, remna_uuid, sub_id, sub_url, created_at, expires_at, tariff, devices, remna_username)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      telegramId,
      tgUsername,
      created.uuid,
      created.shortUuid ?? created.uuid.substring(0, 8),
      subUrl,
      fmtDate(now),
      fmtDate(newExp),
      tariff,
      devices,
      remnaUsername,
    ]
  )

  return { ok: true, subUrl, expiresAt: newExp, subId: ins.rows[0]?.id ?? null }
}

export async function addDevicesForSub(
  subId: number,
  telegramId: string
): Promise<{ ok: boolean; newLimit: number }> {
  const subRes = await pool.query<SubRow>(
    'SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2',
    [subId, telegramId]
  )
  const sub = subRes.rows[0]
  if (!sub?.remna_uuid) return { ok: false, newLimit: 0 }

  const cur = sub.devices ?? DEVICES_DEFAULT
  const newLimit = cur + 2

  const ok = await remna.setDeviceLimit(sub.remna_uuid, newLimit)
  if (!ok) return { ok: false, newLimit: cur }

  await pool.query('UPDATE subscriptions SET devices = $1 WHERE id = $2', [newLimit, subId])
  return { ok: true, newLimit }
}
