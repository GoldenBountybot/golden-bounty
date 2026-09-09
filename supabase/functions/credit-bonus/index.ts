import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const SB_URL = Deno.env.get('SUPABASE_URL');
const svc = createClient(SB_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: {
    persistSession: false
  }
});
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (b, s = 200)=>new Response(JSON.stringify(b), {
    status: s,
    headers: {
      ...cors,
      'Content-Type': 'application/json'
    }
  });
async function authUser(req) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!jwt) return null;
  const { data } = await createClient(SB_URL, ANON_KEY, {
    auth: {
      persistSession: false
    }
  }).auth.getUser(jwt);
  return data?.user ?? null;
}
async function profile(id) {
  const { data } = await svc.from('profiles').select('*').eq('id', id).maybeSingle();
  return data;
}
async function wallet(id) {
  const { data } = await svc.rpc('wallet_get', {
    p_user: id
  });
  return Array.isArray(data) ? data[0] : data;
}
const MAX_BONUS = 2000, DAILY_BONUS_CAP = 10000, MIN_INTERVAL_MS = 2000;
const ALLOWED = [
  'cashback',
  'free_spin',
  'signup',
  'daily',
  'weekly',
  'monthly',
  'deposit_bonus'
];
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: cors
  });
  try {
    const user = await authUser(req);
    if (!user) return json({
      error: 'Unauthorized'
    }, 401);
    const body = await req.json().catch(()=>({}));
    const amount = Number(body.amount ?? 0);
    const type = String(body.type || '');
    const note = String(body.note || '');
    const claimedLoss = Number(body.claimed_loss ?? 0);
    if (!ALLOWED.includes(type)) return json({
      error: 'invalid-type'
    }, 400);
    if (!isFinite(amount) || amount <= 0 || amount > MAX_BONUS) return json({
      error: 'invalid-amount',
      max: MAX_BONUS
    }, 400);
    const { data: bonusTxns } = await svc.from('transactions').select('*').eq('user_id', user.id).eq('type', 'bonus').order('created_at', {
      ascending: false
    }).limit(500);
    const bt = bonusTxns || [];
    const nowMs = Date.now();
    if (bt.length && bt[0].created_at && nowMs - new Date(bt[0].created_at).getTime() < MIN_INTERVAL_MS) return json({
      error: 'rate-limited'
    }, 429);
    const dayAgo = nowMs - 86400000;
    const dailySum = bt.filter((t)=>new Date(t.created_at).getTime() >= dayAgo).reduce((s, t)=>s + (Number(t.amount) || 0), 0);
    if (dailySum + amount > DAILY_BONUS_CAP) return json({
      error: 'daily-cap-exceeded',
      cap: DAILY_BONUS_CAP,
      used: dailySum
    }, 429);
    const w = await wallet(user.id);
    if (w?.banned) return json({
      error: 'Account banned'
    }, 403);
    const hasClaimed = (method, since)=>bt.some((t)=>t.method === method && new Date(t.created_at).getTime() >= since);
    const { data: settings } = await svc.from('bonus_settings').select('*');
    const cfg = (settings || []).find((s)=>s.name === type);
    let expectedAmount = 0;
    if (cfg) {
      if (cfg.active === false) return json({
        error: 'bonus-inactive'
      }, 400);
      if (type !== 'deposit_bonus') expectedAmount = Number(cfg.amount ?? 0);
    }
    if (type !== 'cashback' && type !== 'deposit_bonus' && expectedAmount > 0 && Math.abs(amount - expectedAmount) > 1) {
      return json({
        error: 'amount-mismatch',
        detail: `Configured ${type} bonus is $${expectedAmount.toFixed(2)} but you requested $${amount.toFixed(2)}.`
      }, 400);
    }
    let cashbackLoss = null;
    if (type === 'cashback') {
      if (!isFinite(claimedLoss) || claimedLoss <= 0) return json({
        error: 'invalid-claimed-loss'
      }, 400);
      if (Math.abs(amount - claimedLoss * 0.01) > 1) return json({
        error: 'amount-mismatch'
      }, 400);
      const { data: allTxns } = await svc.from('transactions').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      }).limit(1000);
      const at = allTxns || [];
      const done = (t)=>t.status === 'completed' || t.status === 'approved';
      const deposits = at.filter((t)=>t.type === 'deposit' && done(t)).reduce((s, t)=>s + (Number(t.amount) || 0), 0);
      const withdrawals = at.filter((t)=>t.type === 'withdraw' && done(t)).reduce((s, t)=>s + (Number(t.amount) || 0), 0);
      const totalLoss = Math.max(0, deposits - withdrawals - Number(w?.balance ?? 0));
      const already = Number(w?.cashback_claimed_loss ?? 0) || 0;
      const unclaimed = Math.max(0, totalLoss - already);
      if (claimedLoss > unclaimed + 1) return json({
        error: 'loss-exceeds-actual',
        unclaimed
      }, 400);
      cashbackLoss = claimedLoss;
    } else if (type === 'free_spin') {
      if (hasClaimed('free_spin', nowMs - 86400000)) return json({
        error: 'already-claimed'
      }, 429);
    } else if (type === 'signup') {
      if (hasClaimed('signup', 0)) return json({
        error: 'already-claimed'
      }, 429);
    } else if (type === 'daily') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      if (hasClaimed('daily', d.getTime())) return json({
        error: 'already-claimed-today'
      }, 429);
    } else if (type === 'weekly') {
      if (hasClaimed('weekly', nowMs - 7 * 86400000)) return json({
        error: 'already-claimed-this-week'
      }, 429);
    } else if (type === 'monthly') {
      const m = new Date();
      m.setDate(1);
      m.setHours(0, 0, 0, 0);
      if (hasClaimed('monthly', m.getTime())) return json({
        error: 'already-claimed-this-month'
      }, 429);
    } else if (type === 'deposit_bonus') {
      if (hasClaimed('deposit_bonus', nowMs - 3600000)) return json({
        error: 'already-claimed'
      }, 429);
      const { data: allTxns } = await svc.from('transactions').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      }).limit(200);
      const dep = (allTxns || []).find((t)=>t.type === 'deposit' && (t.status === 'completed' || t.status === 'approved'));
      if (!dep) return json({
        error: 'no-qualifying-deposit',
        detail: 'You need an approved deposit before claiming a deposit bonus.'
      }, 400);
      const depCfg = (settings || []).find((s)=>s.name === 'deposit');
      const pct = depCfg ? Number(depCfg.deposit_percent ?? 50) : 50;
      const expected = Math.round(Number(dep.amount) * (pct / 100) * 100) / 100;
      if (Math.abs(amount - expected) > 1) return json({
        error: 'amount-mismatch',
        detail: `Expected deposit bonus is $${expected.toFixed(2)} but you requested $${amount.toFixed(2)}.`
      }, 400);
    }
    const p = await profile(user.id);
    const { data: nw, error } = await svc.rpc('credit_bonus_apply', {
      p_user: user.id,
      p_email: p?.email || '',
      p_amount: amount,
      p_method: type,
      p_note: note,
      p_cashback_loss: cashbackLoss
    });
    if (error) return json({
      error: error.message
    }, 500);
    const res = Array.isArray(nw) ? nw[0] : nw;
    return json({
      balance: Number(res.balance ?? 0),
      wager_remaining: Number(res.wager_remaining ?? 0)
    });
  } catch (e) {
    return json({
      error: String(e?.message || e)
    }, 500);
  }
});
