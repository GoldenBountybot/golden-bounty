// Shared wallet API — lets another app of yours (e.g. the Telegram Buy/Sell app,
// which runs on its own Supabase project) use THIS app's wallet as the single
// source of truth. One balance everywhere: spend there → drops here, win here →
// rises there.
//
// Auth: server-to-server only. The caller must send the shared secret header
//   x-wallet-key: <SHARED_WALLET_KEY>
// Never put this key in the other app's frontend — call this from its backend
// (Supabase Edge Function) only.
//
// Users are matched by Telegram user id (global across bots), so both apps
// resolve to the same player even though each has its own bot and its own auth.
//
// POST body:
//   { action: 'balance', telegram_id }
//   { action: 'debit',  telegram_id, amount, reference, note? }   // spend
//   { action: 'credit', telegram_id, amount, reference, note? }   // add
// `reference` must be a unique id from the calling app (order id, trade id…).
// Repeating the same reference never moves money twice.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const svc = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);
const SHARED_KEY = Deno.env.get('SHARED_WALLET_KEY') || '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-wallet-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const MAX_AMOUNT = 100000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    if (!SHARED_KEY || req.headers.get('x-wallet-key') !== SHARED_KEY) {
      return json({ ok: false, reason: 'unauthorized' }, 401);
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const action = String(body.action || '');
    const tgId = Number(body.telegram_id || 0);
    if (!tgId) return json({ ok: false, reason: 'missing-telegram-id' }, 400);

    const { data: prof } = await svc
      .from('profiles').select('id, email').eq('telegram_id', tgId).maybeSingle();
    if (!prof) return json({ ok: false, reason: 'player-not-found' }, 404);

    const { data: wallet } = await svc
      .from('wallets').select('balance, banned').eq('user_id', prof.id).maybeSingle();
    if (!wallet) return json({ ok: false, reason: 'wallet-not-found' }, 404);

    if (action === 'balance') {
      return json({ ok: true, balance: Number(wallet.balance), banned: !!wallet.banned });
    }

    if (action !== 'debit' && action !== 'credit') {
      return json({ ok: false, reason: 'invalid-action' }, 400);
    }
    if (wallet.banned) return json({ ok: false, reason: 'account-banned' }, 403);

    const amount = Number(body.amount || 0);
    const reference = String(body.reference || '');
    if (!isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
      return json({ ok: false, reason: 'invalid-amount' }, 400);
    }
    if (!reference) return json({ ok: false, reason: 'missing-reference' }, 400);

    // Idempotency: the same reference is only ever applied once.
    const { data: seen } = await svc
      .from('transactions').select('id').eq('reference', reference).limit(1);
    if (seen?.length) {
      return json({ ok: true, duplicate: true, balance: Number(wallet.balance) });
    }

    const delta = action === 'debit' ? -amount : amount;
    const { data: newBalance, error } = await svc.rpc('wallet_apply_delta', {
      p_user: prof.id,
      p_delta: delta,
    });
    if (error) {
      const insufficient = String(error.message || '').includes('insufficient');
      return json({ ok: false, reason: insufficient ? 'insufficient-balance' : error.message }, insufficient ? 400 : 500);
    }

    await svc.from('transactions').insert({
      user_id: prof.id,
      user_email: prof.email || '',
      type: 'adjustment',
      amount,
      status: 'completed',
      method: action === 'debit' ? 'external-app-debit' : 'external-app-credit',
      reference,
      note: String(body.note || 'Shared wallet · external app'),
    });

    return json({ ok: true, balance: Number(newBalance) });
  } catch (e) {
    return json({ ok: false, reason: 'server-error: ' + String((e as Error)?.message || e) }, 500);
  }
});