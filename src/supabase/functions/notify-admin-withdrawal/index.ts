// Notifies every admin when a player submits a withdrawal. On Supabase there is
// no email provider wired up, so the notice is delivered as an in-app admin
// notification (user_notifications row per admin) — no external service needed.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SB_URL = Deno.env.get('SUPABASE_URL');
const svc = createClient(SB_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

async function authUser(req) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!jwt) return null;
  const { data } = await createClient(SB_URL, ANON_KEY, { auth: { persistSession: false } }).auth.getUser(jwt);
  return data?.user ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await authUser(req);
    if (!user) return json({ ok: false, reason: 'unauthorized' }, 401);

    // Banned players can't submit withdrawals.
    const { data: wallet } = await svc.from('wallets').select('banned').eq('user_id', user.id).maybeSingle();
    if (wallet?.banned) return json({ ok: false, reason: 'banned' }, 403);

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount || 0);
    const network = String(body.network || '');
    const walletAddr = String(body.wallet || '');
    if (!amount || amount < 1) return json({ ok: false, reason: 'invalid-amount' }, 400);

    const { data: me } = await svc.from('profiles').select('email').eq('id', user.id).maybeSingle();
    const { data: admins } = await svc.from('profiles').select('id').eq('role', 'admin');
    if (!admins?.length) return json({ ok: false, reason: 'no-admins', notified: 0 });

    const who = me?.email || user.id;
    const preview = walletAddr ? walletAddr.slice(0, 10) + '…' : '—';
    const rows = admins.map((a) => ({
      user_id: a.id,
      type: 'withdraw_requested',
      title: `Withdrawal request · $${amount.toFixed(2)}`,
      body: `${who} requested $${amount.toFixed(2)} via USDT${network ? ' · ' + network : ''} to ${preview}. Review it in Admin → Transactions.`,
      amount,
      link: '/admin',
    }));

    const { error } = await svc.from('user_notifications').insert(rows);
    if (error) return json({ ok: false, reason: error.message });

    return json({ ok: true, notified: rows.length });
  } catch (e) {
    return json({ ok: false, reason: 'server-error: ' + String(e?.message || e) });
  }
});