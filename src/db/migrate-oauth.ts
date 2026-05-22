import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.PG_HOST ?? 'localhost',
  port: Number(process.env.PG_PORT ?? 5432),
  user: process.env.PG_USER ?? 'vpn_user',
  password: process.env.PG_PASSWORD ?? 'gagatub1',
  database: process.env.PG_DBNAME ?? 'ubezishche_vpn',
})

await pool.query(`
  ALTER TABLE web_accounts ALTER COLUMN password_hash DROP NOT NULL
`)

console.log('✓ password_hash is now nullable (for Google OAuth users)')
await pool.end()
