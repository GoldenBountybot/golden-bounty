// Telegram notifications for agent <-> player transfers.
// Called by a Postgres trigger on public.agent_transfers (pg_net) with the
// x-tg-secret header. Both sides get an instant bot message containing the
// other party's name, username and ID plus the amount.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const TOKEN = Deno.env.get('TG_BOT_TOKEN') || Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const SECRET = Deno.env.get('TG_NOTIFY_SECRET') || '';
const svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function send(chatId: unknown, text: string) {
  if (!chatId) return;
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, parse_mode: 'HTML', disable_web_page_preview: true, text }),
  }).catch(() => {});
}

type P = {
  id: string; full_name?: string; username?: string; telegram_username?: string;
  email?: string; uid?: string; telegram_id?: string | number; role?: string;
};

const nameOf = (p?: P) => p?.full_name || p?.username || p?.telegram_username || (p?.email || '').split('@')[0] || '—';
const userOf = (p?: P) => (p?.username ? '@' + p.username : p?.telegram_username ? '@' + p.telegram_username : '—');

function block(title: string, p?: P) {
  return `${title}\n` +
    `Name: <b>${esc(nameOf(p))}</b>\n` +
    `Username: <code>${esc(userOf(p))}</code>\n` +
    `ID: <code>${esc(p?.uid || p?.id || '—')}</code>\n`;
}

Deno.serve(async (req) => {
  try {
    if (SECRET && req.headers.get('x-tg-secret') !== SECRET) return new Response('forbidden', { status: 403 });
    const t = (await req.json().catch(() => ({}))).record || {};
    const amount = Number(t.amount || 0);
    const kind = String(t.kind || '');
    if (!t.from_user || !t.to_user || !(amount > 0)) return new Response('skip');

    const { data: people } = await svc.from('profiles')
      .select('id, full_name, username, telegram_username, email, uid, telegram_id, role')
      .in('id', [t.from_user, t.to_user]);
    const from = (people || []).find((p: P) => p.id === t.from_user) as P | undefined;
    const to = (people || []).find((p: P) => p.id === t.to_user) as P | undefined;

    // kind 'withdraw' = player -> agent. Anything else = agent -> player deposit.
    const isWithdraw = kind === 'withdraw';
    const player = isWithdraw ? from : to;
    const agent = isWithdraw ? to : from;
    const amt = `<b>$${amount.toFixed(2)}</b>`;

    const playerText = isWithdraw
      ? `✅ <b>Withdrawal sent to agent</b>\n\nAmount: ${amt}\n\n` + block('👤 <b>Agent</b>', agent)
      : `💰 <b>Deposit received from agent</b>\n\nAmount: ${amt}\n\n` + block('👤 <b>Agent</b>', agent) +
        `\nYour balance has been updated. Good luck! 🎰`;

    const agentText = isWithdraw
      ? `🔔 <b>New withdrawal received from player</b>\n\nAmount: ${amt}\n\n` + block('👤 <b>Player</b>', player) +
        `\nOpen Agent Panel to process it.`
      : `📤 <b>You sent balance to a player</b>\n\nAmount: ${amt}\n\n` + block('👤 <b>Player</b>', player);

    await send(player?.telegram_id, playerText);
    await send(agent?.telegram_id, agentText);

    return new Response('ok');
  } catch (e) {
    return new Response('err: ' + String((e as Error)?.message || e), { status: 200 });
  }
});