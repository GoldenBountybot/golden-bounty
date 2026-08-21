// Shared PG SOFT Seamless Wallet helpers (Seamless Mode spec v2.4.x).
// Used by pgsoftVerifySession, pgsoftCashGet, pgsoftCashTransferInOut,
// pgsoftCashAdjustment and pgsoftLaunchGame so the auth / parsing / response
// format logic is never duplicated across the callback endpoints.

import { secrets } from 'base44:runtime';

// Platform currency. USDT has a base unit of 1 in PG SOFT's currency list, so
// real_transfer_amount must always equal transfer_amount (no 1:1000 handling).
export const PG_CURRENCY = 'USDT';

export function pgConfig() {
  const get = (k) => {
    try { return secrets.get(k) || ''; } catch { return ''; }
  };
  return {
    operatorToken: get('PGSOFT_OPERATOR_TOKEN'),
    secretKey: get('PGSOFT_SECRET_KEY'),
    salt: get('PGSOFT_HASH_SALT'),
    apiDomain: get('PGSOFT_API_DOMAIN'),
  };
}

function isPending(v) {
  return !v || String(v).trim().toUpperCase() === 'PENDING';
}

// PG SOFT sends application/x-www-form-urlencoded bodies plus a trace_id in
// the query string. Returns { params, rawBody }.
export async function readPgRequest(req) {
  const rawBody = await req.text();
  const params = {};
  const url = new URL(req.url);
  url.searchParams.forEach((v, k) => { params[k] = v; });
  new URLSearchParams(rawBody).forEach((v, k) => { params[k] = v; });
  return { params, rawBody };
}

// Global success / error response format (HTTP 200 in both cases per spec).
export function pgOk(data) {
  return Response.json({ data, error: null }, { status: 200 });
}

export function pgError(code, message) {
  return Response.json({ data: null, error: { code: String(code), message } }, { status: 200 });
}

export const PG_ERRORS = {
  invalidRequest: () => pgError(1034, 'Request is not valid'),
  internal: () => pgError(1200, 'Internal server error'),
  playerMissing: () => pgError(3004, 'Player does not exist'),
  walletMissing: () => pgError(3005, 'Player wallet does not exist'),
  betFailed: () => pgError(3033, 'Bet failed'),
  amountMismatch: () => pgError(3073, 'Invalid transfer amount'),
  invalidConfig: () => pgError(3107, 'Invalid configuration'),
  insufficient: () => pgError(3202, 'Insufficient player balance'),
};

// operator_token + secret_key validation, required on every callback.
export function credentialsValid(params) {
  const cfg = pgConfig();
  if (isPending(cfg.operatorToken) || isPending(cfg.secretKey)) return false;
  return params.operator_token === cfg.operatorToken && params.secret_key === cfg.secretKey;
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256Hex(key, text) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(text));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Optional hash authentication (spec 5.1.1.3). Disabled unless PGSOFT_HASH_SALT
// holds a real salt AND the request carries the Authorization header.
// Signature = hmac-sha256(salt, host + x-content-sha256 + x-date)
export async function hashAuthValid(req, rawBody) {
  const { salt } = pgConfig();
  if (isPending(salt)) return true;
  const auth = req.headers.get('authorization') || '';
  if (!auth) return true;
  const host = req.headers.get('host') || '';
  const xDate = req.headers.get('x-date') || '';
  const xSha = req.headers.get('x-content-sha256') || '';
  const bodyHash = await sha256Hex(rawBody);
  if (bodyHash !== xSha) return false;
  const expected = await hmacSha256Hex(salt, `${host}${xSha}${xDate}`);
  const provided = (auth.match(/Signature=([0-9a-fA-F]+)/) || [])[1] || '';
  return provided.toLowerCase() === expected.toLowerCase();
}

// Amounts are exposed to the game with 2 decimal places (extra digits truncated).
export function trunc2(n) {
  return Math.floor((Number(n) || 0) * 100) / 100;
}

export function numOf(v) {
  const n = Number(v);
  return isFinite(n) ? n : NaN;
}

// player_name is the Base44 user id — unique, stable, <= 50 chars.
export async function walletForPlayer(base44, playerName) {
  if (!playerName) return null;
  const wallets = await base44.asServiceRole.entities.Wallet.filter({ user_id: playerName }, 'created_date', 1);
  return wallets && wallets.length ? wallets[0] : null;
}

// Applies a signed balance delta atomically and returns the fresh balance.
export async function applyDelta(base44, playerName, delta) {
  await base44.asServiceRole.entities.Wallet.updateMany(
    { user_id: playerName },
    { $inc: { balance: delta } }
  );
  const wallet = await walletForPlayer(base44, playerName);
  return trunc2(wallet ? wallet.balance : 0);
}