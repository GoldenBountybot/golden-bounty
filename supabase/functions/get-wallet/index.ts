import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const SB_URL = Deno.env.get('SUPABASE_URL')!;
const svc = createClient(SB_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!jwt) return json({ error: 'Unauthorized' }, 401);
    const { data: u } = await createClient(SB_URL, ANON_KEY, { auth: { persistSession: false } }).auth.getUser(jwt);
    const user = u?.user;
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const { data: w, error } = await svc.rpc('wallet_get', { p_user: user.id });
    if (error) return json({ error: error.message }, 500);
    return json({
      balance: Number(w.balance ?? 0),
      wager_remaining: Number(w.wager_remaining ?? 0),
      staked_amount: Number(w.staked_amount ?? 0),
      staked_at: w.staked_at ?? null,
      last_profit_claim: w.last_profit_claim ?? null,
      cashback_claimed_loss: Number(w.cashback_claimed_loss ?? 0),
      banned: !!w.banned,
      rtp: w.rtp != null ? Number(w.rtp) : null,
    });
  } catch (e) { return json({ error: String(e?.message || e) }, 500); }
});
