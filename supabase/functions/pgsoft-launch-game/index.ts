// Game launch: creates the operator_player_session token, then asks PG SOFT
// for the launch HTML (through the VPS relay so PG sees our static IP).
// Frontend: base44.functions.invoke('pgsoftLaunchGame', { game_id, language })
import { API_DOMAIN, OPERATOR_TOKEN, SECRET_KEY, ensureWallet, pgFetch, preflight, svc, SB_URL } from '../_shared/pgsoft.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const LAUNCH_PATH = Deno.env.get('PGSOFT_LAUNCH_PATH') || '/external-game-launcher/api/v1/GetLaunchURLHTML';

async function authUser(req: Request) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!jwt) return null;
  const anon = createClient(SB_URL, Deno.env.get('SUPABASE_ANON_KEY'), { auth: { persistSession: false } });
  const { data } = await anon.auth.getUser(jwt);
  return data?.user ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const user = await authUser(req);
    if (!user) return json({ ok: false, reason: 'unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const gameId = String(body.game_id || '').trim();
    const language = String(body.language || 'en');
    if (!gameId) return json({ ok: false, reason: 'missing-game-id' });
    if (!API_DOMAIN || !OPERATOR_TOKEN || !SECRET_KEY) return json({ ok: false, reason: 'pgsoft-not-configured' });

    const wallet = await ensureWallet(user.id);
    if (!wallet || wallet.banned) return json({ ok: false, reason: 'account-blocked' });

    // Fresh 24h session token, validated later by the VerifySession callback.
    const sessionToken = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: sErr } = await svc.from('pgsoft_sessions').insert({
      user_id: user.id,
      session_token: sessionToken,
      game_id: gameId,
      status: 'active',
      expires_at: expiresAt,
    });
    if (sErr) return json({ ok: false, reason: sErr.message });

    // PG SOFT rejects the request when client_ip is empty, so fall back to our
    // whitelisted relay IP when the browser IP header isn't present.
    const clientIp =
      (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
      (req.headers.get('cf-connecting-ip') || '').trim() ||
      '172.245.40.68';
    const form = new URLSearchParams({
      operator_token: OPERATOR_TOKEN,
      secret_key: SECRET_KEY,
      path: `/${gameId}/index.html`,
      extra_args: `btt=1&ops=${sessionToken}&l=${language}`,
      url_type: 'game-entry',
      client_ip: clientIp,
    });

    const res = await pgFetch(`${API_DOMAIN}${LAUNCH_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const text = await res.text();
    if (!res.ok) return json({ ok: false, reason: `pgsoft-${res.status}`, detail: text.slice(0, 500) });

    // PG SOFT answers with { data: "<html…>", error: null } or raw HTML.
    let html = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error) return json({ ok: false, reason: parsed.error.message || 'pgsoft-error', code: parsed.error.code });
      if (typeof parsed?.data === 'string') html = parsed.data;
      else if (typeof parsed?.data?.html === 'string') html = parsed.data.html;
    } catch { /* raw HTML response */ }

    return json({ ok: true, html, session_token: sessionToken, expires_at: expiresAt });
  } catch (e) {
    return json({ ok: false, reason: 'server-error: ' + String(e?.message || e) });
  }
});