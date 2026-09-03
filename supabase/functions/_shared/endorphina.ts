// Shared helpers for the Endorphina Seamless Wallet integration (API v1.8.1).
// Money on the wire is in THOUSANDTHS of a currency unit (1.26 USD -> 1260).
export { applyDelta, ensureWallet, num, svc } from './pgsoft.ts';
import { svc } from './pgsoft.ts';

export const NODE_ID = (Deno.env.get('ENDORPHINA_NODE_ID') || '').trim();
export const SALT = (Deno.env.get('ENDORPHINA_SALT') || '').trim();
// Staging: https://test.endorphina.network  (production key is issued later)
export const API_URL = (Deno.env.get('ENDORPHINA_API_URL') || 'https://test.endorphina.network')
  .trim().replace(/\/$/, '');
export const CURRENCY = Deno.env.get('ENDORPHINA_CURRENCY') || 'USD';
export const RATIO = 1000; // currency ratio 1:1000

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
export const preflight = () => new Response('ok', { headers: cors });

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Documented error codes / HTTP statuses.
export const errors = {
  ACCESS_DENIED: 401,
  INSUFFICIENT_FUNDS: 402,
  TOKEN_EXPIRED: 403,
  LIMIT_REACHED: 403,
  TOKEN_NOT_FOUND: 404,
  NO_RETRY: 429,
  INTERNAL_ERROR: 500,
} as const;

export const fail = (code: keyof typeof errors, message = code) =>
  json({ code, message }, errors[code]);

export async function sha1hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// sign = SHA1HEX( values of all params except `sign`, sorted by param NAME, concatenated + salt )
export async function makeSign(params: Record<string, string>): Promise<string> {
  const concat = Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== null)
    .sort()
    .map((k) => String(params[k]))
    .join('');
  return sha1hex(concat + SALT);
}

export async function validSign(params: Record<string, string>): Promise<boolean> {
  if (!SALT) return true; // not configured yet — don't block integration testing
  const given = String(params.sign || '').toLowerCase();
  return !!given && given === (await makeSign(params));
}

// Reads query params + form/json body into one flat string map.
export async function readParams(req: Request): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const [k, v] of new URL(req.url).searchParams) out[k] = v;
  const raw = req.method === 'GET' ? '' : await req.text();
  if (raw) {
    const ct = (req.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('json') || raw.trim().startsWith('{')) {
      try {
        const j = JSON.parse(raw);
        for (const k of Object.keys(j || {})) out[k] = String(j[k]);
      } catch { /* ignore */ }
    } else {
      for (const [k, v] of new URLSearchParams(raw)) out[k] = v;
    }
  }
  return out;
}

export const toUnits = (thousandths: unknown) => Number(thousandths || 0) / RATIO;
export const toThousandths = (units: number) => Math.round(Number(units || 0) * RATIO);

export async function getSession(token: string) {
  if (!token) return null;
  const { data } = await svc.from('endorphina_sessions').select('*').eq('token', token).maybeSingle();
  return data;
}

export async function walletBalance(userId: string): Promise<number> {
  const { data } = await svc.from('wallets').select('balance').eq('user_id', userId).maybeSingle();
  return Number(data?.balance || 0);
}

// Idempotency: returns the stored response for a transaction we already handled.
export async function findTx(providerId: string, kind: string) {
  if (!providerId) return null;
  const { data } = await svc
    .from('endorphina_transactions')
    .select('*')
    .eq('provider_id', providerId)
    .eq('kind', kind)
    .maybeSingle();
  return data;
}

export async function saveTx(row: Record<string, unknown>) {
  const { data } = await svc.from('endorphina_transactions').insert(row).select('*').maybeSingle();
  return data;
}