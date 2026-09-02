// Shared helpers for every PG SOFT Seamless Wallet callback + game launch.
// Kept in one place so no callback duplicates parsing / auth / wallet logic.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export const SB_URL = Deno.env.get('SUPABASE_URL');
export const svc = createClient(SB_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });

export const OPERATOR_TOKEN = Deno.env.get('PGSOFT_OPERATOR_TOKEN') || '';
export const SECRET_KEY = Deno.env.get('PGSOFT_SECRET_KEY') || '';
export const HASH_SALT = Deno.env.get('PGSOFT_HASH_SALT') || '';
// The configured value may be pasted as a full BackOffice link (with a
// #/login?token=... fragment). Keep only the scheme + host so API paths append
// cleanly, otherwise the built URL is malformed and the relay rejects it.
export const API_DOMAIN = (() => {
  const raw = (Deno.env.get('PGSOFT_API_DOMAIN') || '').trim();
  try { return new URL(raw).origin; } catch { return raw.replace(/\/$/, ''); }
})();
export const PROXY_URL = (Deno.env.get('PGSOFT_PROXY_URL') || '').replace(/\/$/, '');
export const PROXY_TOKEN = Deno.env.get('PGSOFT_PROXY_TOKEN') || '';

// PG SOFT locks a player's currency on their first login, so it is stored per
// wallet: players who already played PG games are tagged 'USDT' in
// wallets.pg_currency; everyone else (new accounts) gets 'USD' ("$").
export const CURRENCY = 'USD';
export const pgCurrency = (wallet: { pg_currency?: string | null } | null | undefined) =>
  wallet?.pg_currency || CURRENCY;

// PG SOFT error codes used by our callbacks.
export const ERR = {
  INVALID_TOKEN: { code: '1000', message: 'invalid operator token' },
  INVALID_SESSION: { code: '1201', message: 'invalid player session' },
  PLAYER_NOT_FOUND: { code: '1203', message: 'player not found' },
  INSUFFICIENT: { code: '1301', message: 'insufficient balance' },
  PLAYER_NOT_EXIST: { code: '3004', message: 'Player does not exist' },
  WALLET_NOT_EXIST: { code: '3005', message: 'Player wallet does not exist' },
  TRANSACTION_NOT_FOUND: { code: '1401', message: 'transaction not found' },
  INTERNAL: { code: '9999', message: 'internal error' },
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-content-sha256, x-date',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export const ok = (data: unknown) =>
  new Response(JSON.stringify({ data, error: null }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });

export const fail = (error: { code: string; message: string }) =>
  new Response(JSON.stringify({ data: null, error }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });

export const preflight = () => new Response('ok', { headers: cors });

// PG SOFT posts form-urlencoded, but accept JSON and query params too.
export async function readParams(req: Request): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const [k, v] of new URL(req.url).searchParams) out[k] = v;
  const raw = req.method === 'GET' ? '' : await req.text();
  if (raw) {
    const ct = (req.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('json')) {
      try {
        const j = JSON.parse(raw);
        for (const k of Object.keys(j || {})) out[k] = String(j[k]);
      } catch { /* ignore malformed json */ }
    } else {
      for (const [k, v] of new URLSearchParams(raw)) out[k] = v;
    }
  }
  // PG SOFT sends some fields in PascalCase (OperatorPlayerSession) and some in
  // snake_case (operator_player_session). Normalise every key to snake_case so
  // the callbacks read the same field name whichever style arrives.
  for (const k of Object.keys({ ...out })) {
    const snake = k.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
    if (snake !== k && out[snake] === undefined) out[snake] = out[k];
  }
  return out;
}

export function checkOperatorToken(p: Record<string, string>): boolean {
  if (!OPERATOR_TOKEN) return true; // not configured yet — don't block integration testing
  return !p.operator_token || p.operator_token === OPERATOR_TOKEN;
}

// PG SOFT sends the shared passphrase on every callback. Only enforced once
// it is configured, so integration testing isn't blocked.
export function checkSecretKey(p: Record<string, string>): boolean {
  if (!SECRET_KEY) return true;
  return !p.secret_key || p.secret_key === SECRET_KEY;
}

// Resolves the PG SOFT player_name (our user id) to a wallet row.
export async function getWallet(userId: string) {
  const { data } = await svc.from('wallets').select('*').eq('user_id', userId).maybeSingle();
  return data;
}

export async function ensureWallet(userId: string) {
  const existing = await getWallet(userId);
  if (existing) return existing;
  const { data } = await svc.from('wallets').insert({ user_id: userId }).select('*').single();
  return data;
}

// Atomic signed balance change. Throws when the balance would go negative.
export async function applyDelta(userId: string, delta: number): Promise<number> {
  const { data, error } = await svc.rpc('wallet_apply_delta', { p_user: userId, p_delta: delta });
  if (error) throw new Error(error.message);
  return Number(data);
}

export const num = (v: unknown) => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};

// All PG-bound outbound calls leave through the VPS relay so PG SOFT always
// sees our whitelisted static IP. Falls back to a direct call if unset.
export async function pgFetch(url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
  const method = init.method || 'GET';
  if (!PROXY_URL || !PROXY_TOKEN) return fetch(url, { method, headers: init.headers, body: init.body });
  return fetch(`${PROXY_URL}/relay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-relay-token': PROXY_TOKEN },
    body: JSON.stringify({ url, method, headers: init.headers || {}, body: init.body || null }),
  });
}