// Free-spin reminder — runs every 15 minutes from pg_cron.
// After a player's last daily spin, once 24h pass, sends a Telegram message
// with a button that opens the app on the Free Spin page. If they still
// haven't spun 24h after that reminder, sends it again — and so on.
// Spinning resets the cycle: the next reminder comes 24h after the new spin.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const TOKEN = Deno.env.get('TG_BOT_TOKEN') || Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const APP_URL = Deno.env.get('TELEGRAM_WEBAPP_URL') || 'https://golden-bounty.com';
const BOT = Deno.env.get('TELEGRAM_BOT_USERNAME') || 'GoldenBountybot';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const svc = createClient(Deno.env.get('SUPABASE_URL')!, SERVICE_KEY, { auth: { persistSession: false } });

const DAY_MS = 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  // Only the scheduler (service role) may trigger the reminder blast. The
  // gateway already verified the JWT signature (verify_jwt = true); here we
  // just make sure it is the service role and not an ordinary user token.
  try {
    const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.role !== 'service_role') throw new Error('not service role');
  } catch {
    return new Response('forbidden', { status: 403 });
  }
  const now = Date.now();
  const cutoff = now - DAY_MS;

  const { data: rows, error } = await svc.from('profiles')
    .select('id, telegram_id, last_daily_spin_at, free_spin_reminded_at')
    .not('telegram_id', 'is', null)
    .gt('last_daily_spin_at', 0)
    .lte('last_daily_spin_at', cutoff)
    .or(`free_spin_reminded_at.is.null,free_spin_reminded_at.lte.${cutoff}`)
    .limit(500);
  if (error) return new Response('err: ' + error.message, { status: 200 });

  let sent = 0;
  for (const p of rows || []) {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: p.telegram_id,
        parse_mode: 'HTML',
        text: '🎡 <b>Your Free Spin is ready!</b>\n\nYour daily free spin is available again. Tap below to claim your prize now. 🎁',
        reply_markup: { inline_keyboard: [[{ text: '🎁 Claim Free Spin', url: `https://t.me/${BOT}?startapp=freespin` }]] },
      }),
    }).catch(() => null);
    // Mark as reminded (even if the user blocked the bot, so we don't retry every run).
    await svc.from('profiles').update({ free_spin_reminded_at: now }).eq('id', p.id);
    if (res?.ok) sent++;
  }
  return new Response(JSON.stringify({ candidates: rows?.length || 0, sent }), { headers: { 'Content-Type': 'application/json' } });
});