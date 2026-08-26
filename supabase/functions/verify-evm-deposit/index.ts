// Verifies a USDT (EVM) deposit sent from the player's wallet to the admin
// wallet on the selected network, then credits the balance via the
// credit_deposit RPC. Idempotent by tx hash. Public RPCs — no secret needed.
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

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ADMIN = '0x2a62cd712863028804a5789629c23d842990aded';

const NETWORKS = {
  bsc:     { rpc: 'https://bsc-dataseed.binance.org', usdt: '0x55d398326f99059ff775485246999027b3197955', decimals: 18, label: 'BSC USDT' },
  eth:     { rpc: 'https://eth.llamarpc.com',         usdt: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6,  label: 'ETH USDT' },
  polygon: { rpc: 'https://polygon-rpc.com',          usdt: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', decimals: 6,  label: 'Polygon USDT' },
};

const topic32 = (addr) => '0x' + String(addr).toLowerCase().replace(/^0x/, '').padStart(64, '0');

async function rpc(rpcUrl, method, params) {
  try {
    const r = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    const j = await r.json();
    return j?.result ?? null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await authUser(req);
    if (!user) return json({ ok: false, reason: 'unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const txHash = String(body.txHash || '').toLowerCase();
    const amount = Number(body.amount);
    const userWallet = String(body.userWallet || '').toLowerCase();
    const netKey = String(body.network || 'bsc').toLowerCase();
    const net = NETWORKS[netKey] || NETWORKS.bsc;
    if (!txHash || !isFinite(amount) || amount <= 0 || !userWallet) {
      return json({ ok: false, reason: 'invalid-params' });
    }

    // Idempotency: this tx hash already credited a deposit.
    const { data: used } = await svc.from('transactions').select('id, amount').eq('reference', txHash).limit(1);
    if (used?.length) return json({ ok: true, already: true, amount: Number(used[0].amount) });

    const receipt = await rpc(net.rpc, 'eth_getTransactionReceipt', [txHash]);
    if (!receipt) return json({ ok: false, reason: 'pending' });
    if (receipt.status !== '0x1') return json({ ok: false, reason: 'tx-failed' });

    // Expected token units, built from micro-units so 18-decimal tokens keep
    // full precision (Number can't hold 1e18 exactly).
    const micro = BigInt(Math.round(amount * 1e6));
    const expectedUnits = net.decimals >= 6
      ? micro * (10n ** BigInt(net.decimals - 6))
      : micro / (10n ** BigInt(6 - net.decimals));
    const fromTopic = topic32(userWallet);
    const toTopic = topic32(ADMIN);

    let verified = false;
    for (const log of (receipt.logs || [])) {
      if (String(log.address || '').toLowerCase() !== net.usdt) continue;
      const topics = log.topics || [];
      if (topics[0] !== TRANSFER_TOPIC) continue;
      if (String(topics[1] || '').toLowerCase() !== fromTopic) continue;
      if (String(topics[2] || '').toLowerCase() !== toTopic) continue;
      let sent = 0n;
      try { sent = BigInt(String(log.data || '0x0')); } catch { continue; }
      if (sent !== expectedUnits) continue;
      verified = true;
      break;
    }
    if (!verified) return json({ ok: false, reason: 'transfer-not-found' });

    const { data: prof } = await svc.from('profiles').select('email').eq('id', user.id).maybeSingle();
    const { data: credit, error } = await svc.rpc('credit_deposit', {
      p_user: user.id,
      p_email: prof?.email || '',
      p_amount: amount,
      p_method: 'wallet-evm',
      p_reference: txHash,
      p_note: `Wallet · ${net.label}`,
    });
    if (error) return json({ ok: false, reason: error.message });

    return json({ ok: true, amount, already: false, balance: credit?.balance });
  } catch (e) {
    return json({ ok: false, reason: 'server-error: ' + String(e?.message || e) });
  }
});