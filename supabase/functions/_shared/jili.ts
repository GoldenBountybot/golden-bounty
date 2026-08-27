// Shared helpers for the JILI Seamless Wallet integration (API Manual v1.0.49).
// Key generation follows §1.1.2, the operator callbacks follow §4.
// Wallet/relay primitives are reused from the PG SOFT shared module so the
// balance logic exists in exactly one place.
import md5 from 'https://esm.sh/js-md5@0.8.3';
export { applyDelta, ensureWallet, num, pgFetch as relayFetch, svc } from './pgsoft.ts';

export const AGENT_ID = Deno.env.get('JILI_AGENT_ID') || '';
export const JILI_ENV = (Deno.env.get('JILI_ENV') || 'uat').toLowerCase();
export const AGENT_KEY =
  (JILI_ENV === 'prod' ? Deno.env.get('JILI_PROD_AGENT_KEY') : Deno.env.get('JILI_UAT_AGENT_KEY')) || '';
// The credential file lists several hostnames; JILI_*_API_URL holds the one we use.
export const API_URL = ((JILI_ENV === 'prod' ? Deno.env.get('JILI_PROD_API_URL') : Deno.env.get('JILI_UAT_API_URL')) || '')
  .trim().replace(/\/$/, '');
// Each JILI account is bound to one currency (Appendix B). USDT is not a JILI
// currency code, so the wallet is reported in the configured fiat code.
export const CURRENCY = Deno.env.get('JILI_CURRENCY') || 'USD';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export const preflight = () => new Response('ok', { headers: cors });

// §4.1.3 — every operator response carries errorCode + message at the root.
export const reply = (body: Record<string, unknown>, errorCode = 0, message = 'success') =>
  new Response(JSON.stringify({ errorCode, message, ...body }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

export const replyError = (errorCode: number, message: string) => reply({}, errorCode, message);

// Operator-side error codes used by /bet, /cancelBet and /sessionBet.
export const JILI_ERR = {
  ALREADY_ACCEPTED: 1,
  NOT_ENOUGH_BALANCE: 2,
  INVALID_PARAMETER: 3,
  TOKEN_EXPIRED: 4,
  OTHER: 5,
  CANCEL_REFUSED: 6,
};

// JILI posts JSON to the operator APIs; accept form bodies too, just in case.
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const raw = req.method === 'GET' ? '' : await req.text();
  if (!raw) return {};
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('json') || raw.trim().startsWith('{')) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  const out: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(raw)) out[k] = v;
  return out;
}

// §1.1.2 date part: UTC-4, formatted yyMMd where the day drops its leading zero.
function keyDate(): string {
  const d = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const yy = String(d.getUTCFullYear()).slice(-2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate());
  return `${yy}${mm}${dd}`;
}

const rand6 = () => Math.random().toString(36).slice(2, 8).padEnd(6, '0');

// Key = {6 random} + MD5(paramString + KeyG) + {6 random}
// KeyG = MD5(yyMMd + AgentId + AgentKey)
export function makeKey(paramString: string): string {
  const keyG = md5(keyDate() + AGENT_ID + AGENT_KEY);
  return rand6() + md5(paramString + keyG) + rand6();
}

// Builds the signed x-www-form-urlencoded body for a provider API call.
// `signed` must list the parameters in the documented order; AgentId is always
// appended last before hashing. `unsigned` parameters are sent but not hashed.
export function signedForm(
  signed: Array<[string, string]>,
  unsigned: Array<[string, string]> = [],
): URLSearchParams {
  const paramString = [...signed.map(([k, v]) => `${k}=${v}`), `AgentId=${AGENT_ID}`].join('&');
  const form = new URLSearchParams();
  for (const [k, v] of signed) form.set(k, v);
  for (const [k, v] of unsigned) form.set(k, v);
  form.set('AgentId', AGENT_ID);
  form.set('Key', makeKey(paramString));
  return form;
}