import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import pool from '@/lib/db'
import { signToken } from '@/lib/auth'

const COOKIE = 'auth_token'
const STATE_COOKIE = 'oauth_state'
const COOKIE_OPTS = {
  httpOnly: true,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

function getRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/auth/google/callback'
}

export const getGoogleAuthUrlFn = createServerFn({ method: 'GET' }).handler(async () => {
  const state = crypto.randomUUID()
  setCookie(STATE_COOKIE, state, {
    httpOnly: true,
    path: '/',
    maxAge: 600,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  })

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  })

  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }
})

export const googleCallbackFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ code: z.string(), state: z.string() }))
  .handler(async ({ data }) => {
    const { code, state } = data

    const savedState = getCookie(STATE_COOKIE)
    if (!savedState || savedState !== state) {
      throw new Error('Недействительная сессия авторизации')
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: getRedirectUri(),
        grant_type: 'authorization_code',
      }),
    })

    const tokens = (await tokenRes.json()) as { access_token?: string; error?: string }
    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error('Ошибка авторизации через Google')
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const googleUser = (await userRes.json()) as { email?: string; name?: string }

    if (!googleUser.email) {
      throw new Error('Не удалось получить email из Google')
    }

    const email = googleUser.email.toLowerCase()
    const existing = await pool.query(
      'SELECT id, email, name FROM web_accounts WHERE email = $1',
      [email]
    )

    let account
    if (existing.rows.length > 0) {
      account = existing.rows[0]
      if (!account.name && googleUser.name) {
        await pool.query('UPDATE web_accounts SET name = $1 WHERE id = $2', [
          googleUser.name,
          account.id,
        ])
        account.name = googleUser.name
      }
    } else {
      const result = await pool.query(
        'INSERT INTO web_accounts (email, name) VALUES ($1, $2) RETURNING id, email, name',
        [email, googleUser.name ?? null]
      )
      account = result.rows[0]
    }

    const token = await signToken({ accountId: account.id, email: account.email })
    setCookie(COOKIE, token, COOKIE_OPTS)

    return { ok: true }
  })
