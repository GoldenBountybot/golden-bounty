// Sends Telegram messages for every deposit / withdraw event.
// Called by a Postgres trigger on public.transactions (pg_net), authenticated
// with the x-tg-secret header. Players get their own pending / success notice;
// admins additionally get USDT withdrawal requests with the full copyable
// address plus the player's username and UID.
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

const SUCCESS = ['approved', 'completed'];

Deno.serve(async (req) => {
  try {
    if (SECRET && req.headers.get('x-tg-secret') !== SECRET) return new Response('forbidden', { status: 403 });
    const tx = (await req.json().catch(() => ({}))).record || {};
    const type = String(tx.type || '');
    if (type !== 'deposit' && type !== 'withdraw') return new Response('skip');
    const status = String(tx.status || '');
    const amount = Number(tx.amount || 0);
    const method = String(tx.method || '');
    const isDeposit = type === 'deposit';

    const { data: p } = await svc.from('profiles')
      .select('telegram_id, telegram_username, username, uid, full_name, email')
      .eq('id', tx.user_id).maybeSingle();

    const kindLabel = isDeposit ? 'Deposit' : 'Withdrawal';
    let text = '';
    if (status === 'pending') {
      text = `⏳ <b>${kindLabel} request received</b>\n\n` +
        `Amount: <b>$${amount.toFixed(2)}</b>\n` +
        (method ? `Method: ${esc(method.toUpperCase())}\n` : '') +
        `Status: <b>Pending</b>\n\nWe will notify you as soon as it is processed.`;
    } else if (SUCCESS.includes(status)) {
      text = `✅ <b>${kindLabel} successful</b>\n\n` +
        `Amount: <b>$${amount.toFixed(2)}</b>\n` +
        (method ? `Method: ${esc(method.toUpperCase())}\n` : '') +
        (isDeposit ? '\nYour balance has been updated. Good luck! 🎰' : '\nYour funds have been sent.');
    } else if (status === 'rejected') {
      text = `❌ <b>${kindLabel} rejected</b>\n\nAmount: <b>$${amount.toFixed(2)}</b>` +
        (tx.note ? `\nNote: ${esc(tx.note)}` : '') + '\n\nContact support if you need help.';
    } else {
      return new Response('skip');
    }

    if (p?.telegram_id) await send(p.telegram_id, text);

    // USDT withdrawal request → notify every admin with the copyable address.
    if (!isDeposit && status === 'pending' && method.toLowerCase() === 'usdt') {
      const { data: admins } = await svc.from('profiles').select('telegram_id').eq('role', 'admin');
      const who = p?.telegram_username ? '@' + p.telegram_username : (p?.username || p?.full_name || p?.email || tx.user_id);
      const adminText =
        `🔔 <b>New USDT Withdrawal Request</b>\n\n` +
        `User: <b>${esc(who)}</b>\n` +
        `Username: <code>${esc(p?.username || '—')}</code>\n` +
        `UID: <code>${esc(p?.uid || '—')}</code>\n` +
        `User ID: <code>${esc(tx.user_id)}</code>\n` +
        `Amount: <b>$${amount.toFixed(2)}</b>\n` +
        (tx.note ? `Network: ${esc(tx.note)}\n` : '') +
        `\nWallet address (tap to copy):\n<code>${esc(tx.reference || '—')}</code>\n\n` +
        `Review it in Admin → Transactions.`;
      for (const a of admins || []) await send(a.telegram_id, adminText);
    }

    return new Response('ok');
  } catch (e) {
    return new Response('err: ' + String((e as Error)?.message || e), { status: 200 });
  }
});