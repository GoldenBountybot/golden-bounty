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
    const code = String(body.promo_code || '').trim().toUpperCase();
    if (!code) return json({ error: 'Enter a promo code' }, 400);
    const me = await profile(user.id);
    if (me?.promo_claimed) return json({ error: 'You already redeemed a promo code' }, 400);
    if (!me?.promo_code && me?.uid) await svc.from('profiles').update({ promo_code: 'GB' + me.uid }).eq('id', user.id);

    let { data: matches } = await svc.from('profiles').select('*').eq('promo_code', code).limit(5);
    if (!matches?.length) {
      const uidPart = code.startsWith('GB') ? code.slice(2) : code;
      if (uidPart) ({ data: matches } = await svc.from('profiles').select('*').eq('uid', uidPart).limit(5));
    }
    const referrer = matches?.[0];
    if (!referrer) return json({ error: 'Invalid promo code' }, 400);
    if (!referrer.promo_code) await svc.from('profiles').update({ promo_code: 'GB' + (referrer.uid || '') }).eq('id', referrer.id);
    if (referrer.id === user.id) return json({ error: 'You cannot use your own promo code' }, 400);

    const { error } = await svc.rpc('redeem_promo_apply', {
      p_user: user.id, p_referrer: referrer.id, p_amount: 1, p_code: code,
      p_user_label: me?.email || me?.username || 'A new player' });
    if (error) return json({ error: error.message === 'banned' ? 'Account banned' : error.message }, error.message === 'banned' ? 403 : 500);
    return json({ ok: true, bonus: 1, referrer: referrer.email || '' });
  } catch (e) { return json({ error: String(e?.message || e) }, 500); }
});
