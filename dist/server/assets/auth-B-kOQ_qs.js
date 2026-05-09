import { T as TSS_SERVER_FUNCTION } from "../server.js";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const pool = globalThis.__pgPool ?? (globalThis.__pgPool = new Pool({
  host: process.env.PG_HOST ?? "localhost",
  port: Number(process.env.PG_PORT ?? 5432),
  user: process.env.PG_USER ?? "vpn_user",
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DBNAME ?? "ubezishche_vpn"
}));
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-dev-secret-change-in-prod"
);
function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function signToken(payload) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(secret);
}
async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
export {
  verifyPassword as a,
  createServerRpc as c,
  hashPassword as h,
  pool as p,
  signToken as s,
  verifyToken as v
};
