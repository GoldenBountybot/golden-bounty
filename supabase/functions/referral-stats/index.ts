import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const SB_URL = Deno.env.get('SUPABASE_URL')!;
const svc = createClient(SB_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
async function authUser(req: Request) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!jwt) return null;
  const { data } = await createClient(SB_URL, ANON_KEY, { auth: { persistSession: false } }).auth.getUser(jwt);
  return data?.user ?? null;
}
async function profile(id: string) {
  const { data } = await svc.from('profiles').select('*').eq('id', id).maybeSingle();
  return data;
}
async function wallet(id: string) {
  const { data } = await svc.rpc('wallet_get', { p_user: id });
  return Array.isArray(data) ? data[0] : data;
}

const COMMISSION_RATE = 0.05;
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await authUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const { data: refs } = await svc.from('profiles').select('id, username, full_name, uid, email, created_at')
      .eq('referred_by', user.id).order('created_at', { ascending: false }).limit(5000);
    const referrals = refs || [];
    const ids = referrals.map((r: any) => r.id);
    const depMap: Record<string, number> = {};
    if (ids.length) {
      const { data: deps } = await svc.from('transactions').select('user_id, amount, status')
        .in('user_id', ids).eq('type', 'deposit').limit(10000);
      for (const t of (deps || [])) {
        if (t.status === 'approved' || t.status === 'completed') depMap[t.user_id] = (depMap[t.user_id] || 0) + (Number(t.amount) || 0);
      }
    }
    const referralStats = referrals.map((r: any) => {
      const total = depMap[r.id] || 0;
      return { id: r.id, username: r.username || r.full_name || 'Player', uid: r.uid || '', email: r.email || '',
        joinedAt: r.created_at, totalDeposits: Math.round(total * 100) / 100,
        commission: Math.round(total * COMMISSION_RATE * 100) / 100 };
    });

    const { data: all } = await svc.from('profiles').select('referred_by').not('referred_by', 'is', null).limit(20000);
    const countMap = new Map<string, number>();
    for (const u of (all || [])) countMap.set(u.referred_by, (countMap.get(u.referred_by) || 0) + 1);
    const ranking = [...countMap.entries()].map(([referrerId, count]) => ({ referrerId, count })).sort((a, b) => b.count - a.count);
    const top = ranking.slice(0, 50);
    const enrichIds = [...new Set([...top.map((x) => x.referrerId), user.id])];
    const { data: users } = await svc.from('profiles').select('id, username, full_name, uid, referral_earnings').in('id', enrichIds);
    const emap = new Map((users || []).map((u: any) => [u.id, {
      id: u.id, username: u.username || u.full_name || 'Player', uid: u.uid || '',
      count: countMap.get(u.id) || 0, earnings: Math.round((Number(u.referral_earnings) || 0) * 100) / 100 }]));
    const topRanking = top.map((x) => emap.get(x.referrerId)).filter(Boolean);
    const myRankIndex = ranking.findIndex((x) => x.referrerId === user.id);
    return json({
      referrals: referralStats, totalReferrals: referralStats.length,
      totalCommission: Math.round(referralStats.reduce((s, r) => s + r.commission, 0) * 100) / 100,
      ranking: topRanking, myRank: myRankIndex >= 0 ? myRankIndex + 1 : null,
      myCount: countMap.get(user.id) || 0, totalReferrers: ranking.length });
  } catch (e) { return json({ error: String(e?.message || e) }, 500); }
});
