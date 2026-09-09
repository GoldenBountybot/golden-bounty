import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SVC_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const svc = createClient(SB_URL, SVC_KEY, { auth: { persistSession: false } });
async function authUser(req: Request) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!jwt) return null;
  const { data } = await createClient(SB_URL, ANON_KEY, { auth: { persistSession: false } }).auth.getUser(jwt);
  return data?.user ?? null;
}
async function profileOf(id: string) {
  const { data } = await svc.from('profiles').select('*').eq('id', id).maybeSingle();
  return data;
}

const MIN_WITHDRAWAL = 2, MAX_WITHDRAWAL = 10000, DAILY_LIMIT = 25000;
const MAX_PENDING = 3, COOLDOWN_H = 24, AUTO_BAN_REJECTED = 5;
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await authUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount || 0);
    const reference = String(body.reference || '').trim();
    const note = String(body.note || '');
    if (!amount || amount < MIN_WITHDRAWAL) return json({ error: `Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}` }, 400);
    if (amount > MAX_WITHDRAWAL) return json({ error: `Maximum withdrawal is $${MAX_WITHDRAWAL.toFixed(2)} per request` }, 400);
    if (!reference) return json({ error: 'Wallet address required' }, 400);

    const { data: w } = await svc.rpc('wallet_get', { p_user: user.id });
    if (w.banned) return json({ error: 'Account banned' }, 403);
    const prof = await profileOf(user.id);
    const createdAt = prof?.created_at || user.created_at;
    const ageH = (Date.now() - new Date(createdAt).getTime()) / 3600000;
    if (ageH < COOLDOWN_H) return json({ error: 'New account cooldown', detail: `Withdrawals are available ${COOLDOWN_H}h after registration. Your account is ${ageH.toFixed(1)}h old.` }, 403);

    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const { data: rejected } = await svc.from('transactions').select('id')
      .eq('user_id', user.id).eq('status', 'rejected').gt('created_at', dayAgo);
    if ((rejected || []).length >= AUTO_BAN_REJECTED) {
      await svc.from('wallets').update({ banned: true }).eq('user_id', user.id);
      return json({ error: 'Account auto-banned', detail: 'Suspicious activity detected. Too many rejected transactions. Your account has been flagged for review.' }, 403);
    }
    const { data: recentW } = await svc.from('transactions').select('amount,status')
      .eq('user_id', user.id).eq('type', 'withdraw').gt('created_at', dayAgo);
    const withdrawnToday = (recentW || []).filter((t: any) => t.status !== 'rejected')
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    if (withdrawnToday + amount > DAILY_LIMIT) return json({ error: 'Daily limit exceeded', detail: `You've requested $${withdrawnToday.toFixed(2)} in withdrawals today. Daily limit is $${DAILY_LIMIT.toFixed(2)}.` }, 400);

    const balance = Number(w.balance ?? 0), wager = Number(w.wager_remaining ?? 0);
    const available = Math.max(0, balance - wager);
    if (Math.round(amount * 100) > Math.round(balance * 100))
      return json({ error: 'Insufficient balance', detail: `Your balance is $${balance.toFixed(2)} but you requested $${amount.toFixed(2)}.` }, 400);
    if (Math.round(amount * 100) > Math.round(available * 100))
      return json({ error: 'Wagering requirement not met', detail: wager > 0 ? `Play through or stack $${wager.toFixed(2)} of your deposit before withdrawing.` : 'Only winnings above your locked deposit can be withdrawn.' }, 400);

    const { data: pending } = await svc.from('transactions').select('id')
      .eq('user_id', user.id).eq('type', 'withdraw').eq('status', 'pending');
    if ((pending || []).length >= MAX_PENDING)
      return json({ error: 'Too many pending withdrawals', detail: `You already have ${pending!.length} withdrawal request(s) awaiting approval. Please wait for them to be processed.` }, 400);

    const { data: tx, error } = await svc.from('transactions').insert({
      user_id: user.id, user_email: prof?.email || '', type: 'withdraw', amount,
      status: 'pending', method: 'usdt', reference, note }).select().single();
    if (error) return json({ error: error.message }, 500);

    const { data: admins } = await svc.from('profiles').select('id').eq('role', 'admin');
    if (admins?.length) {
      await svc.from('user_notifications').insert(admins.map((a: any) => ({
        user_id: a.id, type: 'withdraw_requested',
        title: `Withdraw Request · $${amount.toFixed(2)}`,
        body: `Player: ${prof?.email || prof?.telegram_username || user.id}\nAmount: $${amount.toFixed(2)}\nWallet: ${reference.slice(0, 10)}…`,
        amount, link: '/admin' })));
    }
    return json({ ok: true, transaction_id: tx.id, balance, available });
  } catch (e) { return json({ error: String(e?.message || e) }, 500); }
});
