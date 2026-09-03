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
    const when = new Date(tx.updated_at || tx.created_at || Date.now())
      .toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    const refId = String(tx.id || '').slice(0, 8).toUpperCase();
    const details =
      `Amount: <b>$${amount.toFixed(2)}</b>\n` +
      (method ? `Method: <b>${esc(method.toUpperCase())}</b>\n` : '') +
      (!isDeposit && tx.note ? `Network: <b>${esc(tx.note)}</b>\n` : '') +
      (refId ? `Reference: <code>${esc(refId)}</code>\n` : '') +
      `Time: ${when}`;
    const footer = `\n\n<i>Golden Bounty · Need help? Open Live Support in the app.</i>`;

    let text = '';
    if (status === 'pending') {
      text = `🕐 <b>${kindLabel} Request Received</b>\n\n` +
        `Your ${kindLabel.toLowerCase()} request has been submitted and is now under review.\n\n` +
        details + `\nStatus: <b>Pending</b>\n\n` +
        (isDeposit
          ? 'Funds will be credited to your balance as soon as the transaction is confirmed.'
          : 'Withdrawals are typically processed within 24 hours. You will be notified once the transfer is complete.') +
        footer;
    } else if (SUCCESS.includes(status)) {
      text = `✅ <b>${kindLabel} Completed</b>\n\n` +
        details + `\nStatus: <b>Completed</b>\n\n` +
        (isDeposit
          ? 'The amount has been credited to your Golden Bounty balance. Good luck at the tables!'
          : 'The funds have been sent to your wallet. Depending on network conditions, it may take a few minutes to appear.') +
        footer;
    } else if (status === 'rejected') {
      text = `❌ <b>${kindLabel} Declined</b>\n\n` +
        details + `\nStatus: <b>Declined</b>\n` +
        (tx.note ? `Reason: ${esc(tx.note)}\n` : '') +
        (isDeposit
          ? '\nNo funds were credited. If you have already sent the payment, please contact Live Support with your transaction hash.'
          : '\nThe requested amount has been returned to your balance. Please review the details and try again, or contact Live Support.') +
        footer;
    } else {
      return new Response('skip');
    }

    if (p?.telegram_id) await send(p.telegram_id, text);

    // USDT withdrawal request → notify every admin with the copyable address.
    if (!isDeposit && status === 'pending' && method.toLowerCase() === 'usdt') {
      const { data: admins } = await svc.from('profiles').select('telegram_id').eq('role', 'admin');
      const who = p?.telegram_username ? '@' + p.telegram_username : (p?.username || p?.full_name || p?.email || tx.user_id);
      const adminText =
        `🔔 <b>Withdrawal Request — Action Required</b>\n\n` +
        `<b>Player</b>\n` +
        `Name: ${esc(who)}\n` +
        `Username: <code>${esc(p?.username || '—')}</code>\n` +
        `UID: <code>${esc(p?.uid || '—')}</code>\n` +
        `User ID: <code>${esc(tx.user_id)}</code>\n\n` +
        `<b>Payout</b>\n` +
        `Amount: <b>$${amount.toFixed(2)} USDT</b>\n` +
        (tx.note ? `Network: <b>${esc(tx.note)}</b>\n` : '') +
        `Reference: <code>${esc(refId || '—')}</code>\n` +
        `Requested: ${when}\n\n` +
        `Wallet address (tap to copy):\n<code>${esc(tx.reference || '—')}</code>\n\n` +
        `Please verify the address and network before approving in Admin → Transactions.`;
      for (const a of admins || []) await send(a.telegram_id, adminText);
    }

    return new Response('ok');
  } catch (e) {
    return new Response('err: ' + String((e as Error)?.message || e), { status: 200 });
  }
});