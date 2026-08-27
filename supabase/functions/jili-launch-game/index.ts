// JILI game launch (§2.1.1 /singleWallet/LoginWithoutRedirect).
// Creates the player token we hold, then asks JILI for the game URL.
// Frontend: base44.functions.invoke('jiliLaunchGame', { game_id, language })
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { AGENT_ID, AGENT_KEY, API_URL, ensureWallet, preflight, relayFetch, signedForm, svc } from '../_shared/jili.ts';

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
    if (!AGENT_ID || !AGENT_KEY || !API_URL) return json({ ok: false, reason: 'jili-not-configured' });

    const body = await req.json().catch(() => ({}));
    const gameId = String(body.game_id || '').trim();
    const lang = String(body.language || 'en-US');
    if (!gameId) return json({ ok: false, reason: 'missing-game-id' });

    const wallet = await ensureWallet(user.id);
    if (!wallet || wallet.banned) return json({ ok: false, reason: 'account-blocked' });

    // Our own player token — JILI sends it back on /auth and every bet.
    const token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: sErr } = await svc.from('jili_sessions').insert({
      user_id: user.id,
      session_token: token,
      game_id: Number(gameId) || 0,
      status: 'active',
      expires_at: expiresAt,
    });
    if (sErr) return json({ ok: false, reason: sErr.message });

    // Signed parameter order per the request table: Token, GameId, Lang.
    const form = signedForm(
      [['Token', token], ['GameId', gameId], ['Lang', lang]],
      [['Platform', 'web']],
    );

    const res = await relayFetch(`${API_URL}/singleWallet/LoginWithoutRedirect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const text = await res.text();
    let parsed: Record<string, unknown> | null = null;
    try { parsed = JSON.parse(text); } catch { /* non-json error page */ }
    if (!parsed) return json({ ok: false, reason: `jili-${res.status}`, detail: text.slice(0, 500) });
    if (Number(parsed.ErrorCode) !== 0) {
      return json({ ok: false, reason: String(parsed.Message || 'jili-error'), code: Number(parsed.ErrorCode) });
    }

    return json({ ok: true, url: String(parsed.Data || ''), token, expires_at: expiresAt });
  } catch (e) {
    return json({ ok: false, reason: 'server-error: ' + String(e?.message || e) });
  }
});