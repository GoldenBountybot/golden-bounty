// WG game launch (URL Login, s=1). Creates our sessionId, asks WG for the
// signed game url and returns it to the client.
// Frontend: supabase.functions.invoke('wg-launch-game', { body: { kind_id, lang } })
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { AGENT, API_URL, DES_KEY, MD5_KEY, ensureWallet, preflight, svc } from '../_shared/wg.ts';
import { pgFetch } from '../_shared/pgsoft.ts';
import { aesEcbEncrypt, makeKey } from '../_shared/wgCrypto.ts';

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

const clientIp = (req: Request) =>
  (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
  req.headers.get('cf-connecting-ip') || '1.1.1.1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const user = await authUser(req);
    if (!user) return json({ ok: false, reason: 'unauthorized' }, 401);
    if (!AGENT || !MD5_KEY || !DES_KEY || !API_URL) return json({ ok: false, reason: 'wg-not-configured' });

    const body = await req.json().catch(() => ({}));
    const kindId = String(body.kind_id || '').trim();
    const lang = String(body.lang || 'en').trim();
    if (!kindId) return json({ ok: false, reason: 'missing-kind-id' });

    const wallet = await ensureWallet(user.id);
    if (!wallet || wallet.banned) return json({ ok: false, reason: 'account-blocked' });

    const token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await svc.from('wg_sessions').insert({
      user_id: user.id, token, kind_id: kindId, status: 'active', expires_at: expiresAt,
    });
    if (error) return json({ ok: false, reason: error.message });

    // Single site -> one fixed lineCode for every player (per WG's guidance).
    const param = [
      's=1',
      `account=${user.id}`,
      `ip=${clientIp(req)}`,
      `kindId=${kindId}`,
      `lang=${lang}`,
      'lineCode=goldenbounty',
      `sessionId=${token}`,
      // NOTE: no secretToken here — the API799 line rejects the launch call with
      // 21 无法识别的参数 : secretToken.
    ].join('&');

    const timestamp = String(Date.now());
    const qs = new URLSearchParams({
      agent: AGENT,
      timestamp,
      param: await aesEcbEncrypt(param, DES_KEY),
      key: makeKey(AGENT, timestamp, MD5_KEY),
    }).toString();

    // API_URL may already end with /api — never build ".../api/api".
    const endpoint = /\/api$/.test(API_URL) ? API_URL : `${API_URL}/api`;
    // Leaves through the static-IP relay so WG always sees our whitelisted IP.
    const res = await pgFetch(`${endpoint}?${qs}`, { method: 'GET' });
    const out = await res.json().catch(() => null);
    if (!out || out.code !== 0 || !out?.data?.url) {
      return json({ ok: false, reason: `wg-error: ${out?.code ?? res.status} ${out?.msg ?? ''}` });
    }
    return json({ ok: true, url: out.data.url, token, expires_at: expiresAt });
  } catch (e) {
    return json({ ok: false, reason: 'server-error: ' + String(e?.message || e) });
  }
});