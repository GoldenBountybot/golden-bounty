import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Verifies a native BNB / ETH deposit sent from the user's wallet to the admin
// wallet, then records a completed Transaction credited with the requested $
// amount. Idempotent by tx hash. The on-chain value must match the expectedWei
// the frontend sent (= $amount / live price), and a sanity price check guards
// against a manipulated/tiny amount. Public RPCs — no secret needed.
const ADMIN = '0x2a62cd712863028804a5789629c23d842990aded';

const NETWORKS = {
  bsc: { rpc: 'https://bsc-dataseed.binance.org', bfSymbol: 'tBNBUSD', gtPair: 'bnb_usdt', decimals: 18, label: 'BSC · BNB' },
  eth: { rpc: 'https://eth.llamarpc.com', bfSymbol: 'tETHUSD', gtPair: 'eth_usdt', decimals: 18, label: 'Ethereum · ETH' },
};

async function rpc(rpcUrl, method, params) {
  const r = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const j = await r.json();
  return j?.result ?? null;
}

async function getPrice(net) {
  const headers = { 'User-Agent': 'VIPSlots/1.0', 'Accept': 'application/json' };
  try {
    const r = await fetch(`https://api-pub.bitfinex.com/v2/ticker/${net.bfSymbol}`, { headers });
    if (r.ok) { const j = await r.json(); if (Array.isArray(j) && j[6]) return Number(j[6]); }
  } catch {}
  try {
    const r = await fetch(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${net.gtPair}`, { headers });
    if (r.ok) { const j = await r.json(); if (Array.isArray(j) && j[0]?.last) return Number(j[0].last); }
  } catch {}
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const txHash = String(body.txHash || '').toLowerCase();
    const amount = Number(body.amount); // $ to credit
    const userWallet = String(body.userWallet || '').toLowerCase();
    const netKey = String(body.network || 'bsc').toLowerCase();
    const expectedWei = String(body.expectedWei || '').toLowerCase();
    const net = NETWORKS[netKey] || NETWORKS.bsc;
    if (!txHash || !isFinite(amount) || amount <= 0 || !userWallet || !expectedWei) {
      return Response.json({ ok: false, reason: 'invalid-params' });
    }

    const existing = await base44.asServiceRole.entities.Transaction.filter({ reference: txHash });
    if (existing && existing.length) {
      return Response.json({ ok: true, already: true, amount: Number(existing[0].amount) });
    }

    const tx = await rpc(net.rpc, 'eth_getTransactionByHash', [txHash]);
    if (!tx) return Response.json({ ok: false, reason: 'pending' });
    const receipt = await rpc(net.rpc, 'eth_getTransactionReceipt', [txHash]);
    if (!receipt) return Response.json({ ok: false, reason: 'pending' });
    if (receipt.status !== '0x1') return Response.json({ ok: false, reason: 'tx-failed' });

    const fromOk = String(tx.from || '').toLowerCase() === userWallet;
    const toOk = String(tx.to || '').toLowerCase() === ADMIN;
    const valOk = String(tx.value || '').toLowerCase() === expectedWei;
    if (!fromOk || !toOk || !valOk) {
      return Response.json({ ok: false, reason: 'transfer-not-found' });
    }

    // Sanity: the sent coin must be worth ~ the requested $ amount (15% tolerance).
    const price = await getPrice(net);
    if (price && isFinite(price)) {
      const coinAmt = Number(BigInt(expectedWei)) / Math.pow(10, net.decimals);
      if (coinAmt * price < amount * 0.85) {
        return Response.json({ ok: false, reason: 'amount-mismatch' });
      }
    }

    await base44.asServiceRole.entities.Transaction.create({
      user_id: user.id,
      user_email: user.email,
      type: 'deposit',
      amount,
      status: 'completed',
      method: 'wallet-trust-native',
      reference: txHash,
      note: `Trust Wallet · ${net.label}`,
    });

    return Response.json({ ok: true, amount, already: false });
  } catch (error) {
    return Response.json({ ok: false, reason: 'server-error: ' + (error?.message || String(error)) });
  }
});