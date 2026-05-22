import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.PG_HOST ?? 'localhost',
  port: Number(process.env.PG_PORT ?? 5432),
  user: process.env.PG_USER ?? 'vpn_user',
  password: process.env.PG_PASSWORD ?? 'gagatub1',
  database: process.env.PG_DBNAME ?? 'ubezishche_vpn',
})

await pool.query(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         SERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES web_accounts(id) ON DELETE CASCADE,
    token      TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`)

console.log('✓ password_reset_tokens table ready')
await pool.end()
