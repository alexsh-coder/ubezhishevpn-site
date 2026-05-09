import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import pool from '@/lib/db'
import { hashPassword, verifyPassword, signToken, verifyToken } from '@/lib/auth'

const COOKIE = 'auth_token'
const COOKIE_OPTS = {
  httpOnly: true,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

export type WebAccount = {
  id: number
  email: string
  name: string | null
  // pg returns BIGINT as string
  telegram_user_id: string | null
}

export const registerFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      name: z.string().min(1, 'Введите имя'),
      email: z.string().email('Неверный email'),
      password: z.string().min(6, 'Минимум 6 символов'),
    })
  )
  .handler(async ({ data }) => {
    const { name, email, password } = data

    const existing = await pool.query('SELECT id FROM web_accounts WHERE email = $1', [
      email.toLowerCase(),
    ])
    if (existing.rows.length > 0) {
      throw new Error('Этот email уже зарегистрирован')
    }

    const passwordHash = await hashPassword(password)
    const result = await pool.query(
      'INSERT INTO web_accounts (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email.toLowerCase(), passwordHash, name]
    )

    const account = result.rows[0]
    const token = await signToken({ accountId: account.id, email: account.email })
    setCookie(COOKIE, token, COOKIE_OPTS)

    return { id: account.id, email: account.email, name: account.name } as WebAccount
  })

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      email: z.string().email('Неверный email'),
      password: z.string().min(1, 'Введите пароль'),
    })
  )
  .handler(async ({ data }) => {
    const { email, password } = data

    const result = await pool.query(
      'SELECT id, email, name, password_hash FROM web_accounts WHERE email = $1',
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) throw new Error('Неверный email или пароль')

    const account = result.rows[0]
    const valid = await verifyPassword(password, account.password_hash)
    if (!valid) throw new Error('Неверный email или пароль')

    const token = await signToken({ accountId: account.id, email: account.email })
    setCookie(COOKIE, token, COOKIE_OPTS)

    return { id: account.id, email: account.email, name: account.name } as WebAccount
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  deleteCookie(COOKIE, { path: '/' })
  return { ok: true }
})

export const getMeFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<WebAccount | null> => {
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
)
