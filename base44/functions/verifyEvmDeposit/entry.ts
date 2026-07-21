import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Verifies a BSC USDT (BEP20) deposit sent from the user's wallet to the admin's
// wallet, then records a completed Transaction. Idempotent by tx hash. No secret
// needed — uses a public BNB Smart Chain RPC for receipt lookup.
const BSC_RPC = 'https://bsc-dataseed.binance.org';
const USDT_CONTRACT = '0x55d398326f99059ff775485246999027b3197955';
const ADMIN_BSC = '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function topic32(addr) {
  return '0x' + String(addr).toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

async function rpc(method, params) {
  const r = await fetch(BSC_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const j = await r.json();
  return j?.result ?? null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const txHash = String(body.txHash || '').toLowerCase();
    const amount = Number(body.amount);
    const userWallet = String(body.userWallet || '').toLowerCase();
    if (!txHash || !isFinite(amount) || amount <= 0 || !userWallet) {
      return Response.json({ ok: false, reason: 'invalid-params' });
    }

    // Idempotency: a deposit for this tx hash was already credited.
    const existing = await base44.asServiceRole.entities.Transaction.filter({ reference: txHash });
    if (existing && existing.length) {
      return Response.json({ ok: true, already: true, amount: Number(existing[0].amount) });
    }

    const receipt = await rpc('eth_getTransactionReceipt', [txHash]);
    if (!receipt) return Response.json({ ok: false, reason: 'pending' });
    if (receipt.status !== '0x1') return Response.json({ ok: false, reason: 'tx-failed' });

    const expectedValue = '0x' + BigInt(Math.round(amount * 1e18)).toString(16).toLowerCase();
    const fromTopic = topic32(userWallet);
    const toTopic = topic32(ADMIN_BSC);

    let verified = false;
    for (const log of (receipt.logs || [])) {
      if (String(log.address || '').toLowerCase() !== USDT_CONTRACT) continue;
      const topics = log.topics || [];
      if (topics[0] !== TRANSFER_TOPIC) continue;
      if (String(topics[1] || '').toLowerCase() !== fromTopic) continue;
      if (String(topics[2] || '').toLowerCase() !== toTopic) continue;
      if (String(log.data || '').toLowerCase() !== expectedValue) continue;
      verified = true;
      break;
    }
    if (!verified) return Response.json({ ok: false, reason: 'transfer-not-found' });

    await base44.asServiceRole.entities.Transaction.create({
      user_id: user.id,
      user_email: user.email,
      type: 'deposit',
      amount,
      status: 'completed',
      method: 'wallet-trust',
      reference: txHash,
      note: 'Trust Wallet · BSC USDT',
    });

    return Response.json({ ok: true, amount, already: false });
  } catch (error) {
    return Response.json({ ok: false, reason: 'server-error: ' + (error?.message || String(error)) });
  }
});