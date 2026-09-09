cost enc = new TextEncoder();
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

async function hmac(keyData, msg, raw = false) {
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return raw ? new Uint8Array(sig) : hex(sig);
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const botToken = Deno.env.get('TG_BOT_TOKEN');
    const url = Deno.env.get('SUPABASE_URL');
    const svc = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!botToken || !url || !svc) return json({ error: 'config_missing' }, 500);

    const { initData } = await req.json();
    if (!initData) return json({ error: 'initData_required' }, 400);

    // --- Verify initData signature (Telegram Mini App spec) ---
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    const checkString = [...params.entries()].map(([k, v]) => k + '=' + v).sort().join('\n');
    const secretKey = await hmac(enc.encode('WebAppData'), botToken, true);
    const expected = await hmac(secretKey, checkString);
    if (!hash || expected !== hash) return json({ error: 'invalid_signature' }, 401);

    const authDate = Number(params.get('auth_date') || 0);
    if (!authDate || Date.now() / 1000 - authDate > 86400) return json({ error: 'expired' }, 401);

    const tg = JSON.parse(params.get('user') || '{}');
    if (!tg.id) return json({ error: 'no_user' }, 400);

    const email = 'tg' + tg.id + '@telegram.local';
    const password = await hmac(enc.encode(botToken), 'pw:' + tg.id);
    const adminHeaders = { apikey: svc, Authorization: 'Bearer ' + svc, 'Content-Type': 'application/json' };

    // Create the auth account on first login (duplicate errors are expected later).
    const created = await fetch(url + '/auth/v1/admin/users', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        email, password, email_confirm: true,
        user_metadata: { telegram_id: tg.id, telegram_username: tg.username || '' },
      }),
    });
    const isNew = created.ok;

    // Issue a real session for the account.
    const signIn = await fetch(url + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: svc, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const session = await signIn.json();
    if (!signIn.ok || !session.access_token) return json({ error: session.error_description || session.msg || 'signin_failed' }, 401);

    const userId = session.user.id;

    // Sync the Telegram identity onto the profile + ensure a wallet exists.
    const rpc = await fetch(url + '/rest/v1/rpc/telegram_upsert_profile', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        p_user: userId, p_tg: tg.id, p_username: tg.username || '',
        p_first: tg.first_name || '', p_last: tg.last_name || '',
        p_photo: tg.photo_url || '', p_lang: tg.language_code || '',
        p_premium: !!tg.is_premium,
      }),
    });
    if (!rpc.ok) return json({ error: 'profile_sync_failed: ' + (await rpc.text()) }, 500);

    return json({
      session,
      is_new_user: isNew,
      user: {
        id: userId,
        telegram_id: tg.id,
        username: tg.username || '',
        first_name: tg.first_name || '',
        photo_url: tg.photo_url || '',
      },
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
