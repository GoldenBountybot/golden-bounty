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
    const gender = body.gender === 'female' ? 'female' : 'male';
    const p = await profile(user.id);
    if (p?.avatar_url) return json({ image_url: p.avatar_url, gender: p.gender || gender });
    const { data: available } = await svc.from('avatars').select('*').eq('gender', gender)
      .or('assigned_to.is.null,assigned_to.eq.').order('created_at', { ascending: true }).limit(10);
    let chosen: any = null;
    for (const a of (available || [])) {
      const { data: claimed } = await svc.from('avatars').update({ assigned_to: user.id })
        .eq('id', a.id).or('assigned_to.is.null,assigned_to.eq.').select('id, image_url');
      if (claimed?.length) { chosen = claimed[0]; break; }
    }
    if (!chosen) {
      const { data: any1 } = await svc.from('avatars').select('image_url').eq('gender', gender).order('created_at', { ascending: true }).limit(1);
      chosen = any1?.[0] || null;
    }
    if (!chosen) return json({ error: 'No avatar available' }, 404);
    await svc.from('profiles').update({ avatar_url: chosen.image_url, gender }).eq('id', user.id);
    return json({ image_url: chosen.image_url, gender });
  } catch (e) { return json({ error: String(e?.message || e) }, 500); }
});
