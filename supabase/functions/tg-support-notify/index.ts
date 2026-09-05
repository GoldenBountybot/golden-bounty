// Notifies every admin on Telegram when a player asks to talk to a live agent
// from the 24/7 Live Support chat ("Connect with Agent").
// Called from the app with the player's Supabase JWT.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const TOKEN = Deno.env.get('TG_BOT_TOKEN') || Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function send(chatId: unknown, text: string) {
  if (!chatId) return;
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, parse_mode: 'HTML', disable_web_page_preview: true, text }),
  }).catch(() => {});
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: auth } = await svc.auth.getUser(jwt);
    const uid = auth?.user?.id;
    if (!uid) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });

    const { data: p } = await svc.from('profiles')
      .select('full_name, username, telegram_username, email, uid')
      .eq('id', uid).maybeSingle();

    const name = p?.full_name || p?.username || p?.telegram_username || (p?.email || '').split('@')[0] || uid;
    const text =
      `🔔 <b>Live Agent Requested</b>\n\n` +
      `A player is waiting in Live Support chat.\n\n` +
      `Name: <b>${esc(name)}</b>\n` +
      `Username: <code>${esc(p?.username || '—')}</code>\n` +
      `UID: <code>${esc(p?.uid || '—')}</code>\n` +
      `User ID: <code>${esc(uid)}</code>\n\n` +
      `Open Admin → Support to reply.`;

    const { data: admins } = await svc.from('profiles').select('telegram_id').eq('role', 'admin');
    for (const a of admins || []) await send(a.telegram_id, text);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});