import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.PG_HOST ?? 'localhost',
  port: Number(process.env.PG_PORT ?? 5432),
  user: process.env.PG_USER ?? 'vpn_user',
  password: process.env.PG_PASSWORD ?? 'gagatub1',
  database: process.env.PG_DBNAME ?? 'ubezishche_vpn',
})

await pool.query(`
  CREATE TABLE IF NOT EXISTS web_accounts (
    id               SERIAL PRIMARY KEY,
    email            TEXT UNIQUE NOT NULL,
    password_hash    TEXT NOT NULL,
    name             TEXT,
    telegram_user_id BIGINT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`)

console.log('✓ web_accounts table ready')
await pool.end()
