import { Pool } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined
}

const pool =
  globalThis.__pgPool ??
  (globalThis.__pgPool = new Pool({
    host: process.env.PG_HOST ?? 'localhost',
    port: Number(process.env.PG_PORT ?? 5432),
    user: process.env.PG_USER ?? 'vpn_user',
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DBNAME ?? 'ubezishche_vpn',
  }))

export default pool
