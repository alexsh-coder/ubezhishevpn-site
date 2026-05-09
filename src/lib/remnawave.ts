const BASE = (process.env.REMNA_URL ?? '').replace(/\/$/, '')
const TOKEN = process.env.REMNA_API_TOKEN ?? ''
const INBOUND = process.env.REMNA_INBOUND_UUID ?? ''

function h() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export type RemnaDevice = {
  hwid?: string
  hwId?: string
  deviceModel?: string
  [key: string]: unknown
}

function deviceHwid(d: RemnaDevice): string {
  return (d.hwid ?? d.hwId ?? '') as string
}

export async function getUserDevices(userUuid: string): Promise<RemnaDevice[]> {
  try {
    const res = await fetch(`${BASE}/api/hwid/devices/${userUuid}`, { headers: h() })
    if (!res.ok) return []
    const data = (await res.json()) as { response?: { devices?: RemnaDevice[] }; devices?: RemnaDevice[] }
    const r = (data.response ?? data) as { devices?: RemnaDevice[] }
    return r.devices ?? []
  } catch {
    return []
  }
}

export async function deleteDevice(userUuid: string, hwid: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/hwid/devices/delete`, {
      method: 'POST',
      headers: h(),
      body: JSON.stringify({ userUuid, hwid }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function getUser(userUuid: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${BASE}/api/users/${userUuid}`, { headers: h() })
    if (!res.ok) return null
    const data = (await res.json()) as { response?: Record<string, unknown> }
    return (data.response ?? data) as Record<string, unknown>
  } catch {
    return null
  }
}

export type CreatedUser = {
  uuid: string
  shortUuid?: string
  subscriptionUrl: string
  [key: string]: unknown
}

export async function createUser(opts: {
  username: string
  expireAt: Date
  trafficLimitBytes?: number
  description?: string
  deviceLimit?: number
  telegramId?: string | null
}): Promise<CreatedUser | null> {
  try {
    const payload: Record<string, unknown> = {
      username: opts.username,
      trafficLimitBytes: opts.trafficLimitBytes ?? 0,
      trafficLimitStrategy: 'NO_RESET',
      expireAt: opts.expireAt.toISOString().slice(0, 23) + '.000Z',
      status: 'ACTIVE',
      description: opts.description ?? '',
      telegramId: opts.telegramId ? Number(opts.telegramId) : null,
      hwidDeviceLimit: opts.deviceLimit ?? 4,
    }
    if (INBOUND) payload.activeInternalSquads = [INBOUND]
    const res = await fetch(`${BASE}/api/users`, {
      method: 'POST',
      headers: h(),
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { response?: CreatedUser }
    return (data.response ?? data) as CreatedUser
  } catch {
    return null
  }
}

export async function updateUserExpire(userUuid: string, expireAt: Date): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/users`, {
      method: 'PATCH',
      headers: h(),
      body: JSON.stringify({
        uuid: userUuid,
        expireAt: expireAt.toISOString().slice(0, 23) + '.000Z',
        status: 'ACTIVE',
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function setDeviceLimit(userUuid: string, limit: number): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/users`, {
      method: 'PATCH',
      headers: h(),
      body: JSON.stringify({ uuid: userUuid, hwidDeviceLimit: limit }),
    })
    return res.ok
  } catch {
    return false
  }
}

export { deviceHwid }
