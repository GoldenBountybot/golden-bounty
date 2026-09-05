// Shared config + helpers for the WG Seamless Wallet integration.
// Money is plain currency units with 2 decimals (line API1199 = USDT, 1:1 USD).
export { applyDelta, ensureWallet, num, svc } from './pgsoft.ts';
import { svc } from './pgsoft.ts';
import { aesEcbDecrypt, makeKey, parseParam } from './wgCrypto.ts';

export const AGENT = (Deno.env.get('WG_AGENT') || '').trim();            // e.g. API1199
export const MD5_KEY = (Deno.env.get('WG_MD5_KEY') || '').trim();
export const DES_KEY = (Deno.env.get('WG_DES_KEY') || '').trim();
export const SECRET_TOKEN = (Deno.env.get('WG_SECRET_TOKEN') || '').trim(); // 运营商身份识别
export const API_URL = (Deno.env.get('WG_API_URL') || '').trim().replace(/\/$/, '');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
export const preflight = () => new Response('ok', { headers: cors });

/** WG expects HTTP 200 + { code, msg, data }. */
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export const ok = (data: Record<string, unknown> = {}) => json({ code: 0, msg: '', data });
export const err = (code: number, msg = '', data: Record<string, unknown> = {}) => json({ code, msg, data });

// Documented operator-side codes.
export const CODES = {
  TOKEN_FAILED: 40,
  PLAYER_MISSING: 120001,
  WALLET_MISSING: 120002,
  BET_MISSING: 120003,
  BET_FAILED: 120004,
  INSUFFICIENT: 120005,
  PAYOUT_FAILED: 120006,
  ORDER_MISSING: 120007,
} as const;

export const money2 = (v: number) => Math.round(Number(v || 0) * 100) / 100;

/**
 * Validates the common query params and decrypts `param`.
 * Fails closed: without configured keys nothing is accepted.
 */
export async function readRequest(req: Request): Promise<
  { ok: true; p: Record<string, string> } | { ok: false; code: number; msg: string }
> {
  if (!AGENT || !MD5_KEY || !DES_KEY) return { ok: false, code: 4, msg: 'wg not configured' };
  const q = new URL(req.url).searchParams;
  const agent = String(q.get('agent') || '');
  const timestamp = String(q.get('timestamp') || '');
  const key = String(q.get('key') || '').toLowerCase();
  const param = String(q.get('param') || '');

  if (agent !== AGENT) return { ok: false, code: 11, msg: 'channel does not exist' };
  const ts = Number(timestamp);
  if (!ts || Math.abs(Date.now() - ts) > 5 * 60 * 1000) return { ok: false, code: 12, msg: 'timestamp expired' };
  if (key !== makeKey(agent, timestamp, MD5_KEY)) return { ok: false, code: 17, msg: 'channel verification error' };

  let plain: string;
  try {
    plain = await aesEcbDecrypt(param, DES_KEY);
  } catch {
    return { ok: false, code: 18, msg: 'AES decryption failed' };
  }
  const p = parseParam(plain);
  if (SECRET_TOKEN && p.secretToken !== SECRET_TOKEN) {
    return { ok: false, code: CODES.TOKEN_FAILED, msg: 'token verification failed' };
  }
  return { ok: true, p };
}

/** Our account value towards WG is the Supabase user id. */
export async function walletOf(account: string) {
  if (!account) return null;
  const { data } = await svc.from('wallets').select('*').eq('user_id', account).maybeSingle();
  return data;
}

export async function balanceOf(account: string): Promise<number> {
  const w = await walletOf(account);
  return money2(Number(w?.balance || 0));
}

export async function getSession(token: string) {
  if (!token) return null;
  const { data } = await svc.from('wg_sessions').select('*').eq('token', token).maybeSingle();
  return data;
}

export async function findTx(transferId: string) {
  if (!transferId) return null;
  const { data } = await svc.from('wg_transactions').select('*').eq('transfer_id', transferId).maybeSingle();
  return data;
}

export async function saveTx(row: Record<string, unknown>) {
  const { data } = await svc.from('wg_transactions').insert(row).select('*').maybeSingle();
  return data;
}

/** Bets count toward the deposit play-through requirement. */
export async function consumeWager(userId: string, amount: number) {
  if (!(amount > 0)) return;
  const { data } = await svc.from('wallets').select('wager_remaining').eq('user_id', userId).maybeSingle();
  await svc.from('wallets')
    .update({ wager_remaining: Math.max(0, Number(data?.wager_remaining || 0) - amount) })
    .eq('user_id', userId);
}

/** Round history entry, same shape as our own games. */
export async function logRound(userId: string, kindId: string, bet: number, win: number) {
  if (!(bet > 0 || win > 0)) return;
  await svc.from('player_activity').insert({
    user_id: userId,
    game_id: `wg:${kindId}`,
    bet,
    win,
    outcome: win > bet ? 'win' : win === bet ? 'push' : 'loss',
    multiplier: bet > 0 ? money2(win / bet) : 0,
  });
}