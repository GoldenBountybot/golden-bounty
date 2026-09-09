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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await authUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    const delta = Number(body.delta ?? 0);
    const wagerDelta = Number(body.wager_delta ?? 0);
    if (!isFinite(delta) || !isFinite(wagerDelta)) return json({ error: 'invalid-params' }, 400);
    const w = await wallet(user.id);
    if (w?.banned) return json({ error: 'Account banned' }, 403);
    if (delta > 0) return json({ error: 'positive-delta-not-allowed', balance: Number(w.balance ?? 0), wager_remaining: Number(w.wager_remaining ?? 0) }, 403);
    if (delta === 0 && wagerDelta === 0) return json({ balance: Number(w.balance ?? 0), wager_remaining: Number(w.wager_remaining ?? 0) });
    const { data, error } = await svc.rpc('wallet_debit', { p_user: user.id, p_amount: Math.abs(delta) });
    if (error) {
      const re = await wallet(user.id);
      return json({ error: 'insufficient-balance', balance: Number(re.balance ?? 0), wager_remaining: Number(re.wager_remaining ?? 0) }, 400);
    }
    const nw = Array.isArray(data) ? data[0] : data;
    return json({ balance: Number(nw.balance ?? 0), wager_remaining: Number(nw.wager_remaining ?? 0) });
  } catch (e) { return json({ error: String(e?.message || e) }, 500); }
});
