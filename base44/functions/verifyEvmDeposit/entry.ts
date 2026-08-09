import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { creditDeposit } from '../../shared/wallet.ts';

// Verifies a USDT deposit (EVM) sent from the user's wallet to the admin wallet
// on the selected network, then records a completed Transaction. Idempotent by
// tx hash. Uses public RPCs — no secret needed.
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ADMIN = '0x2a62cd712863028804a5789629c23d842990aded';

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

    // Expected token units as a BigInt. Built from micro-units so 18-decimal
    // tokens keep full precision (Number can't hold 1e18 exactly).
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
      // log.data is a 32-byte zero-padded hex word — compare numerically, and
      // accept anything at least the expected amount (never a string compare).
      let sent = 0n;
      try { sent = BigInt(String(log.data || '0x0')); } catch { continue; }
      // Exact match — wallet connectors send the precise amount automatically.
      if (sent !== expectedUnits) continue;
      verified = true;
      break;
    }
    if (!verified) return Response.json({ ok: false, reason: 'transfer-not-found' });

    await creditDeposit(base44, user.id, user.email, amount, 'wallet-trust', txHash, `Trust Wallet · ${net.label}`);

    return Response.json({ ok: true, amount, already: false });
  } catch (error) {
    return Response.json({ ok: false, reason: 'server-error: ' + (error?.message || String(error)) });
  }
});