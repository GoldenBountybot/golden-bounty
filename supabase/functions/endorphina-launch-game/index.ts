// Endorphina game launch — creates our session token and builds the signed
// launch URL: {API_URL}/api/sessions/seamless/rest/v1?exit=&nodeId=&token=&sign=
// Frontend: base44.functions.invoke('endorphinaLaunchGame', { game_id, exit })
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { API_URL, CURRENCY, NODE_ID, ensureWallet, makeSign, preflight, svc } from '../_shared/endorphina.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

async function authUser(req: Request) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!jwt) return null;
  const anon = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'), { auth: { persistSession: false } });
  const { data } = await anon.auth.getUser(jwt);
  return data?.user ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const user = await authUser(req);
    if (!user) return json({ ok: false, reason: 'unauthorized' }, 401);
    if (!NODE_ID) return json({ ok: false, reason: 'endorphina-not-configured' });

    const body = await req.json().catch(() => ({}));
    const slug = String(body.game_id || '').trim();
    const exit = String(body.exit || 'https://golden-bounty.base44.app/');
    if (!slug) return json({ ok: false, reason: 'missing-game-id' });

    const wallet = await ensureWallet(user.id);
    if (!wallet || wallet.banned) return json({ ok: false, reason: 'account-blocked' });

    const token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await svc.from('endorphina_sessions').insert({
      user_id: user.id,
      token,
      game: slug,
      currency: CURRENCY,
      status: 'active',
      expires_at: expiresAt,
    });
    if (error) return json({ ok: false, reason: error.message });

    const params: Record<string, string> = { exit, nodeId: NODE_ID, token };
    const sign = await makeSign(params);
    const qs = new URLSearchParams({ ...params, sign }).toString();
    return json({ ok: true, url: `${API_URL}/api/sessions/seamless/rest/v1?${qs}`, token, expires_at: expiresAt });
  } catch (e) {
    return json({ ok: false, reason: 'server-error: ' + String(e?.message || e) });
  }
});