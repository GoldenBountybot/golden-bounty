import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const SB_URL = Deno.env.get('SUPABASE_URL');
const SVC_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const svc = createClient(SB_URL, SVC_KEY, { auth: { persistSession: false } });
async function authUser(req) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!jwt) return null;
  const { data } = await createClient(SB_URL, ANON_KEY, { auth: { persistSession: false } }).auth.getUser(jwt);
  return data?.user ?? null;
}
const DAY = 86400000, LOCK_DAYS = 15, BASE_RATE = 0.0222;
const VIP = [[50000, 0.04], [10000, 0.0366], [1000, 0.0333], [500, 0.03], [100, 0.0255]];
const rateFor = (t) => { for (const [m, r] of VIP) if (t >= m) return r; return BASE_RATE; };
function computeProfit(staked, stakedAt, lastClaim, rate) {
  if (!staked || !stakedAt) return 0;
  const start = new Date(stakedAt).getTime();
  if (isNaN(start)) return 0;
  const lc = lastClaim ? new Date(lastClaim).getTime() : start;
  const cap = LOCK_DAYS * DAY;
  const elapsed = Math.min(Math.max(0, Date.now() - start), cap);
  const claimed = Math.min(Math.max(0, lc - start), cap);
  return Math.floor(staked * rate * (Math.max(0, elapsed - claimed) / DAY) * 100) / 100;
}
// Record every stack event in the transactions ledger so the user can view a
// full stack history (locks, profit claims, unlocks) with timestamps.
async function logStack(userId, email, amount, note) {
  try {
    await svc.from('transactions').insert({
      user_id: userId,
      user_email: email || '',
      type: 'bonus',
      amount,
      status: 'completed',
      method: 'stack',
      note
    });
  } catch (_e) { /* ledger only — the wallet change already succeeded */ }
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await authUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const { data: w0 } = await svc.rpc('wallet_get', { p_user: user.id });
    if (w0.banned) return json({ error: 'Account banned' }, 403);
    const { data: deps } = await svc.from('transactions').select('amount,status').eq('user_id', user.id).eq('type', 'deposit').in('status', ['approved', 'completed']);
    const totalDeposits = (deps || []).reduce((s, t) => s + Number(t.amount || 0), 0);
    const rate = rateFor(totalDeposits);
    let w = w0, credited = 0;
    if (action === 'stake') {
      const amount = Number(body.amount ?? 0);
      if (!isFinite(amount) || amount <= 0) return json({ error: 'invalid-amount' }, 400);
      const { data, error } = await svc.rpc('wallet_stake', { p_user: user.id, p_amount: amount });
      if (error) return json({ error: error.message.includes('insufficient') ? 'insufficient-balance' : error.message }, 400);
      w = data;
      await logStack(user.id, user.email, amount, 'stack_lock');
    } else if (action === 'claimProfit') {
      const profit = computeProfit(Number(w0.staked_amount ?? 0), w0.staked_at, w0.last_profit_claim, rate);
      if (profit <= 0) return json({ error: 'no-profit' }, 400);
      const { data, error } = await svc.rpc('wallet_claim_profit', { p_user: user.id, p_profit: profit });
      if (error) return json({ error: error.message }, 400);
      w = data;
      credited = profit;
      await logStack(user.id, user.email, profit, 'stack_claim');
    } else if (action === 'autoUnlock') {
      const staked = Number(w0.staked_amount ?? 0);
      if (!staked || !w0.staked_at) return json({ error: 'nothing-staked' }, 400);
      if ((Date.now() - new Date(w0.staked_at).getTime()) / DAY < LOCK_DAYS) return json({ error: 'still-locked' }, 400);
      const total = staked + computeProfit(staked, w0.staked_at, w0.last_profit_claim, rate);
      const { data, error } = await svc.rpc('wallet_unlock', { p_user: user.id, p_total: total });
      if (error) return json({ error: error.message }, 400);
      w = data;
      credited = total;
      await logStack(user.id, user.email, total, 'stack_unlock');
    } else return json({ error: 'invalid-action' }, 400);
    return json({
      balance: Number(w.balance ?? 0),
      wager_remaining: Number(w.wager_remaining ?? 0),
      staked_amount: Number(w.staked_amount ?? 0),
      staked_at: w.staked_at ?? null,
      last_profit_claim: w.last_profit_claim ?? null,
      credited,
      rate
    });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
