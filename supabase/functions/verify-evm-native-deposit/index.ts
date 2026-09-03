// Verifies a native BNB / ETH deposit sent from the player's wallet to the
// admin wallet, then credits the requested $ amount via the credit_deposit RPC.
// Idempotent by tx hash. The on-chain value must exactly match the expectedWei
// the frontend sent (= $amount / live price). Public RPCs — no secret needed.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { applyReferralCommission } from '../_shared/referral.ts';

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

const ADMIN = '0x2a62cd712863028804a5789629c23d842990aded';

const NETWORKS = {
  bsc: { rpc: 'https://bsc-dataseed.binance.org', label: 'BSC · BNB' },
  eth: { rpc: 'https://eth.llamarpc.com',         label: 'Ethereum · ETH' },
};

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
    const amount = Number(body.amount); // $ to credit
    const userWallet = String(body.userWallet || '').toLowerCase();
    const netKey = String(body.network || 'bsc').toLowerCase();
    const expectedWei = String(body.expectedWei || '').toLowerCase();
    const net = NETWORKS[netKey] || NETWORKS.bsc;
    if (!txHash || !isFinite(amount) || amount <= 0 || !userWallet || !expectedWei) {
      return json({ ok: false, reason: 'invalid-params' });
    }

    const { data: used } = await svc.from('transactions').select('id, amount').eq('reference', txHash).limit(1);
    if (used?.length) return json({ ok: true, already: true, amount: Number(used[0].amount) });

    const tx = await rpc(net.rpc, 'eth_getTransactionByHash', [txHash]);
    if (!tx) return json({ ok: false, reason: 'pending' });
    const receipt = await rpc(net.rpc, 'eth_getTransactionReceipt', [txHash]);
    if (!receipt) return json({ ok: false, reason: 'pending' });
    if (receipt.status !== '0x1') return json({ ok: false, reason: 'tx-failed' });

    const fromOk = String(tx.from || '').toLowerCase() === userWallet;
    const toOk = String(tx.to || '').toLowerCase() === ADMIN;
    let sentWei = 0n; let wantWei = 0n;
    try { sentWei = BigInt(String(tx.value || '0x0')); wantWei = BigInt(expectedWei); } catch {}
    const valOk = wantWei > 0n && sentWei === wantWei;
    if (!fromOk || !toOk || !valOk) return json({ ok: false, reason: 'transfer-not-found' });

    const { data: prof } = await svc.from('profiles').select('email').eq('id', user.id).maybeSingle();
    const { data: credit, error } = await svc.rpc('credit_deposit', {
      p_user: user.id,
      p_email: prof?.email || '',
      p_amount: amount,
      p_method: 'wallet-evm-native',
      p_reference: txHash,
      p_note: `Wallet · ${net.label}`,
    });
    if (error) return json({ ok: false, reason: error.message });

    await applyReferralCommission(svc, user.id, amount, txHash);

    return json({ ok: true, amount, already: false, balance: credit?.balance });
  } catch (e) {
    return json({ ok: false, reason: 'server-error: ' + String(e?.message || e) });
  }
});