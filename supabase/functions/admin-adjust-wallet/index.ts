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
async function requireAdmin(req: Request) {
  const user = await authUser(req);
  if (!user) return { err: json({ error: 'Unauthorized' }, 401) };
  const { data: p } = await svc.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (p?.role !== 'admin') return { err: json({ error: 'Forbidden' }, 403) };
  return { user };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { err } = await requireAdmin(req);
    if (err) return err;
    const body = await req.json().catch(() => ({}));
    const targetUserId = String(body.user_id || '');
    const delta = Number(body.delta ?? 0);
    const wagerDelta = Number(body.wager_delta ?? 0);
    if (!targetUserId || !isFinite(delta)) return json({ error: 'invalid-params' }, 400);
    let rtpVal: number | null = null, rtpSet = false;
    if (body.rtp !== undefined) {
      rtpSet = true;
      const v = Number(body.rtp);
      rtpVal = isFinite(v) && v >= 0 && v <= 100 ? v : null;
    }
    const { data: w, error } = await svc.rpc('admin_adjust_wallet', {
      p_user: targetUserId, p_delta: delta, p_wager_delta: wagerDelta,
      p_set_balance: !!body.set_balance,
      p_banned: body.banned === undefined ? null : !!body.banned,
      p_rtp: rtpVal, p_rtp_set: rtpSet });
    if (error) return json({ error: error.message }, 500);
    return json({ balance: Math.max(0, Number(w.balance ?? 0)), wager_remaining: Math.max(0, Number(w.wager_remaining ?? 0)), banned: !!w.banned, rtp: w.rtp });
  } catch (e) { return json({ error: String(e?.message || e) }, 500); }
});
