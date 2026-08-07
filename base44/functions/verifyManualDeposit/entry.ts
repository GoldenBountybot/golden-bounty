import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Auto-verifies a MANUAL crypto deposit (Pay USDT / Pay USDC / Pay Crypto) by
// the transaction hash the user pastes. Unlike the wallet-connector verify
// functions, the sender wallet is NOT known here (the user sends from an
// external wallet), so verification only checks that the on-chain transaction
// credits the ADMIN address with the expected amount/coin. Idempotent by the
// raw tx hash (shared with the wallet-connector flows, so a deposit can never
// be credited twice across flows). On success, records a completed
// Transaction; the frontend credits the user balance. Public APIs, no secret.
//
// Supported network keys:
//   btc | eth_native | eth_usdt | eth_usdc | bsc_native | bsc_usdt |
//   polygon_native | polygon_usdt | polygon_usdc | avax_native |
//   sol_native | sol_usdt | sol_usdc
// Other chains (TRX, TON, LTC, DOGE, DOT, APT, …) are not yet supported and
// the frontend falls back to manual admin review for them.

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const EVM = {
  eth: {
    rpc: 'https://eth.llamarpc.com',
    coin: 'ethereum',
    admin: '0x2a62cd712863028804a5789629c23d842990aded',
    usdt: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    label: 'Ethereum',
  },
  bsc: {
    rpc: 'https://bsc-dataseed.binance.org',
    coin: 'binancecoin',
    admin: '0x2a62cd712863028804a5789629c23d842990aded',
    usdt: '0x55d398326f99059ff775485246999027b3197955',
    label: 'BSC',
  },
  polygon: {
    rpc: 'https://polygon-rpc.com',
    coin: 'matic-network',
    admin: '0x2a62cd712863028804a5789629c23d842990aded',
    usdt: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    usdc: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    label: 'Polygon',
  },
  avax: {
    rpc: 'https://api.avax.network/ext/bc/C/rpc',
    coin: 'avalanche-2',
    admin: '0x2a62cd712863028804a5789629c23d842990aded',
    label: 'Avalanche',
  },
};

const SOLANA_RPC = 'https://solana-rpc.publicnode.com';
const SOL_ADMIN = 'ftmbTXAc6XWyT6ieXHLiEZ7zuJFDPVSAdvrvrTveniW';
const SOL_USDT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8Ben98NY';
const SOL_USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const BTC_ADMIN = 'bc1q6j34j85jswe2xmnwvljjax4nemagfmak44glt0';

const TOKEN_DECIMALS = {
  eth_usdt: 6, eth_usdc: 6,
  bsc_usdt: 18,
  polygon_usdt: 6, polygon_usdc: 6,
  sol_usdt: 6, sol_usdc: 6,
};

function topic32(addr) {
  return '0x' + String(addr).toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

async function evmRpc(rpcUrl, method, params) {
  const r = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const j = await r.json();
  return j?.result ?? null;
}

async function solRpc(method, params) {
  const r = await fetch(SOLANA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const j = await r.json();
  return j?.result ?? null;
}

async function getJson(url) {
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) return null;
  return await r.json();
}

async function getPrice(coinId) {
  try {
    const j = await getJson(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
    if (j && j[coinId] && isFinite(j[coinId].usd)) return Number(j[coinId].usd);
  } catch {}
  return null;
}

// Returns { ok, already?, amount?, reason? }.
async function verifyEvm(net, txHash, amount, token) {
  const receipt = await evmRpc(net.rpc, 'eth_getTransactionReceipt', [txHash]);
  if (!receipt) return { ok: false, reason: 'pending' };
  if (receipt.status !== '0x1') return { ok: false, reason: 'tx-failed' };

  if (token === 'native') {
    const tx = await evmRpc(net.rpc, 'eth_getTransactionByHash', [txHash]);
    if (!tx) return { ok: false, reason: 'pending' };
    if (String(tx.to || '').toLowerCase() !== net.admin) return { ok: false, reason: 'recipient-not-found' };
    let sentWei = 0n;
    try { sentWei = BigInt(String(tx.value || '0x0')); } catch {}
    if (sentWei <= 0n) return { ok: false, reason: 'transfer-not-found' };
    const price = await getPrice(net.coin);
    if (!price) return { ok: false, reason: 'price-unavailable' };
    const coinAmt = Number(sentWei) / 1e18;
    if (coinAmt * price < amount * 0.9) return { ok: false, reason: 'amount-mismatch' };
    return { ok: true, amount, note: `Manual · ${net.label} (native)` };
  }

  // ERC-20 token transfer: find a Transfer event to the admin for the right token.
  const tokenAddr = token === 'usdt' ? net.usdt : token === 'usdc' ? net.usdc : null;
  if (!tokenAddr) return { ok: false, reason: 'unsupported-token' };
  const dec = TOKEN_DECIMALS[token === 'usdt' ? 'eth_usdt' : 'eth_usdc'] || 6;
  const expected = BigInt(Math.round(amount * Math.pow(10, dec)));
  const toTopic = topic32(net.admin);
  let verified = false;
  for (const log of (receipt.logs || [])) {
    if (String(log.address || '').toLowerCase() !== String(tokenAddr).toLowerCase()) continue;
    const topics = log.topics || [];
    if (topics[0] !== TRANSFER_TOPIC) continue;
    if (String(topics[2] || '').toLowerCase() !== toTopic) continue;
    let sent = 0n;
    try { sent = BigInt(String(log.data || '0x0')); } catch { continue; }
    if (sent * 100n < expected * 99n) continue;
    verified = true;
    break;
  }
  if (!verified) return { ok: false, reason: 'transfer-not-found' };
  const sym = token === 'usdt' ? 'USDT' : 'USDC';
  return { ok: true, amount, note: `Manual · ${net.label} (${sym})` };
}

async function verifySolana(signature, amount, token) {
  const tx = await solRpc('getTransaction', [signature, { maxSupportedTransactionVersion: 0, encoding: 'jsonParsed' }]);
  if (!tx) return { ok: false, reason: 'pending' };
  if (tx.meta?.err) return { ok: false, reason: 'tx-failed' };
  const keys = (tx.transaction.message.accountKeys || []).map((a) => (typeof a === 'string' ? a : a.pubkey));
  const recipientIdx = keys.indexOf(SOL_ADMIN);
  if (recipientIdx < 0) return { ok: false, reason: 'recipient-not-found' };

  if (token === 'native') {
    const received = (tx.meta.postBalances[recipientIdx] || 0) - (tx.meta.preBalances[recipientIdx] || 0);
    if (received <= 0) return { ok: false, reason: 'transfer-not-found' };
    const price = await getPrice('solana');
    if (!price) return { ok: false, reason: 'price-unavailable' };
    if ((received / 1e9) * price < amount * 0.9) return { ok: false, reason: 'amount-mismatch' };
    return { ok: true, amount, note: 'Manual · Solana (native SOL)' };
  }

  const mint = token === 'usdt' ? SOL_USDT : SOL_USDC;
  const dec = 6;
  const expected = BigInt(Math.round(amount * Math.pow(10, dec)));
  const findAmt = (arr) => {
    const e = (arr || []).find((b) => b.mint === mint && b.owner === SOL_ADMIN);
    return e ? BigInt(String(e.uiTokenAmount?.amount || '0')) : 0n;
  };
  const received = findAmt(tx.meta.postTokenBalances) - findAmt(tx.meta.preTokenBalances);
  if (received < BigInt(Math.round(Number(expected) * 0.99))) return { ok: false, reason: 'amount-mismatch' };
  const sym = token === 'usdt' ? 'USDT' : 'USDC';
  return { ok: true, amount, note: `Manual · Solana (${sym})` };
}

async function verifyBtc(txid, amount) {
  const tx = await getJson(`https://blockstream.info/api/tx/${txid}`);
  if (!tx) return { ok: false, reason: 'pending' };
  let sats = 0;
  for (const o of (tx.vout || [])) {
    if (o.scriptpubkey_address === BTC_ADMIN) sats += Number(o.value || 0);
  }
  if (sats <= 0) return { ok: false, reason: 'recipient-not-found' };
  const price = await getPrice('bitcoin');
  if (!price) return { ok: false, reason: 'price-unavailable' };
  if ((sats / 1e8) * price < amount * 0.9) return { ok: false, reason: 'amount-mismatch' };
  return { ok: true, amount, note: 'Manual · Bitcoin (BTC)' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, reason: 'unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const netKey = String(body.network || '').toLowerCase();
    const amount = Number(body.amount);
    let txHash = String(body.txHash || '').trim();
    if (!netKey || !txHash || !isFinite(amount) || amount <= 0) {
      return Response.json({ ok: false, reason: 'invalid-params' });
    }
    // EVM hashes are case-insensitive; normalize to lowercase for idempotency.
    const isEvm = netKey.startsWith('eth_') || netKey.startsWith('bsc_') || netKey.startsWith('polygon_') || netKey.startsWith('avax_');
    if (isEvm) txHash = txHash.toLowerCase();

    // Idempotency: a deposit for this tx hash was already credited (shared
    // with the wallet-connector flows, which use the same raw reference).
    const existing = await base44.asServiceRole.entities.Transaction.filter({ reference: txHash });
    if (existing && existing.length) {
      return Response.json({ ok: true, already: true, amount: Number(existing[0].amount) });
    }

    let res;
    if (netKey === 'btc') {
      res = await verifyBtc(txHash, amount);
    } else if (netKey === 'sol_native') {
      res = await verifySolana(txHash, amount, 'native');
    } else if (netKey === 'sol_usdt') {
      res = await verifySolana(txHash, amount, 'usdt');
    } else if (netKey === 'sol_usdc') {
      res = await verifySolana(txHash, amount, 'usdc');
    } else if (netKey === 'eth_native' || netKey === 'bsc_native' || netKey === 'polygon_native' || netKey === 'avax_native') {
      const net = EVM[netKey.split('_')[0]];
      res = await verifyEvm(net, txHash, amount, 'native');
    } else if (netKey === 'eth_usdt' || netKey === 'bsc_usdt' || netKey === 'polygon_usdt') {
      const net = EVM[netKey.split('_')[0]];
      res = await verifyEvm(net, txHash, amount, 'usdt');
    } else if (netKey === 'eth_usdc' || netKey === 'polygon_usdc') {
      const net = EVM[netKey.split('_')[0]];
      res = await verifyEvm(net, txHash, amount, 'usdc');
    } else {
      return Response.json({ ok: false, reason: 'unsupported-network' });
    }

    if (!res.ok) return Response.json({ ok: false, reason: res.reason });

    await base44.asServiceRole.entities.Transaction.create({
      user_id: user.id,
      user_email: user.email,
      type: 'deposit',
      amount,
      status: 'completed',
      method: 'manual-auto',
      reference: txHash,
      note: res.note || `Manual · ${netKey}`,
    });

    return Response.json({ ok: true, amount, already: false });
  } catch (error) {
    return Response.json({ ok: false, reason: 'server-error: ' + (error?.message || String(error)) });
  }
});