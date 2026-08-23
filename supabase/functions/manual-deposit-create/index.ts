// Creates a manual-deposit request with a UNIQUE pay amount (e.g. $10 →
// 10.0032 USDT). The user sends EXACTLY this amount to the shown address
// within 20 minutes; manual-deposit-check auto-detects the on-chain transfer
// by the unique amount and credits the balance — no TxID submission needed.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SB_URL = Deno.env.get('SUPABASE_URL');
const svc = createClient(SB_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

async function authUser(req) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!jwt) return null;
  const { data } = await createClient(SB_URL, ANON_KEY, { auth: { persistSession: false } }).auth.getUser(jwt);
  return data?.user ?? null;
}

// Coin display config. `dec` = decimals the unique code lives in (the last 2
// digits of `dec` are the per-user unique code).
const COINS = {
  usdt: { id: null, symbol: 'USDT', dec: 4 },
  usdc: { id: null, symbol: 'USDC', dec: 4 },
  btc:  { id: 'bitcoin', symbol: 'BTC', dec: 8 },
  eth:  { id: 'ethereum', symbol: 'ETH', dec: 8 },
  bnb:  { id: 'binancecoin', symbol: 'BNB', dec: 8 },
  trx:  { id: 'tron', symbol: 'TRX', dec: 6 },
  ltc:  { id: 'litecoin', symbol: 'LTC', dec: 8 },
  doge: { id: 'dogecoin', symbol: 'DOGE', dec: 8 },
  sol:  { id: 'solana', symbol: 'SOL', dec: 9 },
  ton:  { id: 'the-open-network', symbol: 'TON', dec: 9 },
  pol:  { id: 'matic-network', symbol: 'POL', dec: 8 },
  avax: { id: 'avalanche-2', symbol: 'AVAX', dec: 8 },
};

function coinKeyFor(netKey) {
  if (netKey.endsWith('_usdt')) return 'usdt';
  if (netKey.endsWith('_usdc')) return 'usdc';
  if (netKey === 'btc' || netKey === 'ltc' || netKey === 'doge') return netKey;
  if (netKey.endsWith('_native')) {
    const p = netKey.split('_')[0];
    if (p === 'polygon') return 'pol';
    if (p === 'bsc') return 'bnb';
    return COINS[p] ? p : null;
  }
  return null;
}

// Networks manual-deposit-check can actually auto-scan. Anything else falls
// back to the TxID flow on the frontend.
const SCANNABLE = new Set([
  'btc', 'ltc', 'doge',
  'trx_native', 'trx_usdt',
  'eth_native', 'eth_usdt', 'eth_usdc',
  'bsc_native', 'bsc_usdt',
  'polygon_native', 'polygon_usdt', 'polygon_usdc',
  'avax_usdt', 'avax_usdc',
  'sol_native', 'sol_usdt', 'sol_usdc',
  'ton_native', 'ton_usdt',
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await authUser(req);
    if (!user) return json({ ok: false, reason: 'unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    const netKey = String(body.networkKey || '').toLowerCase();
    const label = String(body.networkLabel || '');
    const address = String(body.address || '').trim();
    const method = String(body.method || 'usdt');
    const amount = Number(body.amount);
    if (!address || !isFinite(amount) || amount < 3 || amount > 100000) return json({ ok: false, reason: 'invalid-params' });

    const coinKey = coinKeyFor(netKey);
    const coin = coinKey ? COINS[coinKey] : null;
    if (!coin || !SCANNABLE.has(netKey)) return json({ ok: false, reason: 'unsupported-network' });

    let price = 1;
    if (coin.id) {
      try {
        const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.id}&vs_currencies=usd`);
        const j = await r.json();
        price = Number(j?.[coin.id]?.usd || 0);
      } catch { price = 0; }
      if (!price || !isFinite(price)) return json({ ok: false, reason: 'price-unavailable' });
    }

    const D = coin.dec;
    const scale = Math.pow(10, D);
    // Base coin amount with the last 2 decimals zeroed — the unique code goes there.
    const baseUnits = Math.floor((amount / price) * scale / 100) * 100;
    if (baseUnits <= 0) return json({ ok: false, reason: 'amount-too-small' });

    // Only one live unique amount per user+network — expire older pendings.
    await svc.from('manual_deposit_requests')
      .update({ status: 'expired' })
      .eq('user_id', user.id).eq('network_key', netKey).eq('status', 'pending');

    const { data: prof } = await svc.from('profiles').select('email').eq('id', user.id).maybeSingle();
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

    // Retry with a fresh 2-digit unique code on collision (partial unique index
    // on pending network_key+pay_amount guarantees no two users share one).
    for (let i = 0; i < 20; i++) {
      const k = 11 + Math.floor(Math.random() * 89); // 11..99
      const payAmount = (baseUnits + k) / scale;
      const { data: row, error } = await svc.from('manual_deposit_requests').insert({
        user_id: user.id,
        user_email: prof?.email || '',
        method,
        network_key: netKey,
        network_label: label,
        address,
        amount_usd: amount,
        pay_amount: payAmount,
        coin: coin.symbol,
        decimals: D,
        status: 'pending',
        expires_at: expiresAt,
      }).select('id').single();
      if (!error && row) {
        return json({ ok: true, id: row.id, pay_amount: payAmount, coin: coin.symbol, decimals: D, address, expires_at: expiresAt });
      }
      if (error && !String(error.message || '').toLowerCase().includes('duplicate')) {
        return json({ ok: false, reason: error.message });
      }
    }
    return json({ ok: false, reason: 'busy-try-again' });
  } catch (e) {
    return json({ ok: false, reason: 'server-error: ' + String(e?.message || e) });
  }
});