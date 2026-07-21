import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Verifies a USDT deposit (EVM) sent from the user's wallet to the admin wallet
// on the selected network, then records a completed Transaction. Idempotent by
// tx hash. Uses public RPCs — no secret needed.
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ADMIN = '0xbe44b1608cd0a7e7f18166d18ad2c21a61bd6570';

const NETWORKS = {
  bsc: {
    rpc: 'https://bsc-dataseed.binance.org',
    usdt: '0x55d398326f99059ff775485246999027b3197955',
    decimals: 18,
    label: 'BSC USDT',
  },
  eth: {
    rpc: 'https://eth.llamarpc.com',
    usdt: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6,
    label: 'ETH USDT',
  },
  polygon: {
    rpc: 'https://polygon-rpc.com',
    usdt: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    decimals: 6,
    label: 'Polygon USDT',
  },
};

function topic32(addr) {
  return '0x' + String(addr).toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

async function rpc(rpcUrl, method, params) {
  const r = await fetch(rpcUrl, {
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
    const netKey = String(body.network || 'bsc').toLowerCase();
    const net = NETWORKS[netKey] || NETWORKS.bsc;
    if (!txHash || !isFinite(amount) || amount <= 0 || !userWallet) {
      return Response.json({ ok: false, reason: 'invalid-params' });
    }

    // Idempotency: a deposit for this tx hash was already credited.
    const existing = await base44.asServiceRole.entities.Transaction.filter({ reference: txHash });
    if (existing && existing.length) {
      return Response.json({ ok: true, already: true, amount: Number(existing[0].amount) });
    }

    const receipt = await rpc(net.rpc, 'eth_getTransactionReceipt', [txHash]);
    if (!receipt) return Response.json({ ok: false, reason: 'pending' });
    if (receipt.status !== '0x1') return Response.json({ ok: false, reason: 'tx-failed' });

    const expectedValue = '0x' + BigInt(Math.round(amount * Math.pow(10, net.decimals))).toString(16).toLowerCase();
    const fromTopic = topic32(userWallet);
    const toTopic = topic32(ADMIN);

    let verified = false;
    for (const log of (receipt.logs || [])) {
      if (String(log.address || '').toLowerCase() !== net.usdt) continue;
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
      note: `Trust Wallet · ${net.label}`,
    });

    return Response.json({ ok: true, amount, already: false });
  } catch (error) {
    return Response.json({ ok: false, reason: 'server-error: ' + (error?.message || String(error)) });
  }
});