import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-dev-secret-change-in-prod'
)

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: { accountId: number; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret)
}

export async function verifyToken(
  token: string
): Promise<{ accountId: number; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { accountId: number; email: string }
  } catch {
    return null
  }
}
