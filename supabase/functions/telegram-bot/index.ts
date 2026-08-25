// Golden Bounty Telegram bot webhook.
// Handles /start (with ref_<telegramId> referral payload) and the Refer button,
// which builds each player's personal referral link from their Telegram id.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const TOKEN = Deno.env.get('TG_BOT_TOKEN') || Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const BOT = Deno.env.get('TELEGRAM_BOT_USERNAME') || 'GoldenBountybot';
const APP_URL = Deno.env.get('TELEGRAM_WEBAPP_URL') || 'https://golden-bounty.base44.app';
const svc = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

const api = (method: string, body: unknown) =>
  fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const refLink = (tgId: number) => `https://t.me/${BOT}?start=ref_${tgId}`;

const playKeyboard = [
  [{ text: '🎰 Play Golden Bounty', web_app: { url: APP_URL } }],
  [{ text: '🎁 Refer & Earn', callback_data: 'refer' }],
];

async function sendReferCard(chatId: number, tgId: number) {
  const link = refLink(tgId);
  const share = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(
    'Join me on Golden Bounty and get a $1 bonus straight into your Stack! 🎰',
  )}`;
  await api('sendMessage', {
    chat_id: chatId,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    text:
      '🎁 <b>Your referral link</b>\n\n' +
      `<code>${link}</code>\n\n` +
      'Anyone who joins with your link gets <b>$1 added to their Stack</b> automatically — ' +
      'and you earn <b>5% commission</b> on every deposit they make.',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📤 Share my link', url: share }],
        [{ text: '🎰 Open Golden Bounty', web_app: { url: APP_URL } }],
      ],
    },
  });
}

async function savePendingReferral(tgId: number, referrerTgId: number) {
  if (!referrerTgId || referrerTgId === tgId) return;
  // Only brand-new players count — existing accounts keep their own state.
  const { data: existing } = await svc.from('profiles').select('id').eq('telegram_id', tgId).maybeSingle();
  if (existing) return;
  const { data: referrer } = await svc.from('profiles').select('id').eq('telegram_id', referrerTgId).maybeSingle();
  if (!referrer) return;
  await svc.from('telegram_referrals').upsert(
    { tg_id: tgId, referrer_tg_id: referrerTgId },
    { onConflict: 'tg_id', ignoreDuplicates: true },
  );
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  try {
    const update = await req.json();

    const cb = update.callback_query;
    if (cb) {
      await api('answerCallbackQuery', { callback_query_id: cb.id });
      if (cb.data === 'refer') await sendReferCard(cb.message.chat.id, cb.from.id);
      return new Response('ok');
    }

    const msg = update.message;
    if (!msg?.text) return new Response('ok');
    const chatId = msg.chat.id;
    const tgId = msg.from.id;
    const text = String(msg.text).trim();

    if (/^\/refer/i.test(text)) {
      await sendReferCard(chatId, tgId);
      return new Response('ok');
    }

    if (/^\/start/i.test(text)) {
      const payload = text.split(/\s+/)[1] || '';
      const m = payload.match(/^ref_(\d+)$/);
      if (m) await savePendingReferral(tgId, Number(m[1]));
      await api('sendMessage', {
        chat_id: chatId,
        parse_mode: 'HTML',
        text:
          `👋 <b>Welcome to Golden Bounty${msg.from.first_name ? ', ' + msg.from.first_name : ''}!</b>\n\n` +
          'Play games, stack your balance and earn real rewards.\n' +
          (m ? '\n🎁 You joined through a referral link — <b>$1 will be added to your Stack</b> when you open the app.\n' : '') +
          '\nTap below to start playing, or use /refer to get your own referral link.',
        reply_markup: { inline_keyboard: playKeyboard },
      });
      return new Response('ok');
    }

    await api('sendMessage', {
      chat_id: chatId,
      text: 'Use /refer to get your referral link, or tap below to play.',
      reply_markup: { inline_keyboard: playKeyboard },
    });
    return new Response('ok');
  } catch (_e) {
    return new Response('ok');
  }
});