import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { Address } from 'npm:@ton/core@0.60.1';

// Auto-verifies a MANUAL crypto deposit (Pay USDT / Pay USDC / Pay Crypto) by
// the transaction hash the user pastes. The sender wallet is NOT known (user
// sends from an external wallet), so verification only checks that the
// on-chain transaction credits the ADMIN address with the expected
// amount/coin. Idempotent by the raw tx hash (shared with the wallet-connector
// flows). On success, records a completed Transaction; the frontend credits
// the user balance. Public APIs, no secret.
//
// Supported network keys:
//   btc | ltc | doge |
//   eth_native | eth_usdt | eth_usdc |
//   bsc_native | bsc_usdt |
//   polygon_native | polygon_usdt | polygon_usdc |
//   avax_native | avax_usdt | avax_usdc |
//   sol_native | sol_usdt | sol_usdc |
//   trx_native | trx_usdt |
//   ton_native | ton_usdt |
//   apt_native | apt_usdt | apt_usdc
// Not yet supported (frontend falls back to manual admin review): dot
// (Subscan now strictly requires an API key — no keyless path exists).

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

const EVM = {
  eth: {
    rpc: 'https://eth.llamarpc.com', coin: 'ethereum', admin: '0x2a62cd712863028804a5789629c23d842990aded',
    usdt: ['0xdac17f958d2ee523a2206206994597c13d831ec7'], usdc: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
    label: 'Ethereum',
  },
  bsc: {
    rpc: 'https://bsc-dataseed.binance.org', coin: 'binancecoin', admin: '0x2a62cd712863028804a5789629c23d842990aded',
    usdt: ['0x55d398326f99059ff775485246999027b3197955'], usdc: [],
    label: 'BSC',
  },
  polygon: {
    rpc: 'https://polygon-rpc.com', coin: 'matic-network', admin: '0x2a62cd712863028804a5789629c23d842990aded',
    usdt: ['0xc2132d05d31c914a87c6611c10748aeb04b58e8f'], usdc: ['0x2791bca1f2de4661ed88a30c99a7a9449aa84174'],
    label: 'Polygon',
  },
  avax: {
    rpc: 'https://api.avax.network/ext/bc/C/rpc', coin: 'avalanche-2', admin: '0x2a62cd712863028804a5789629c23d842990aded',
    // USDT.e (bridged) + native USDT — accept either.
    usdt: ['0xc7198437980c041c805a1edcba50c1ce5db95118', '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7'],
    usdc: ['0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'],
    label: 'Avalanche',
  },
};

const SOLANA_RPC = 'https://solana-rpc.publicnode.com';
const SOL_ADMIN = 'ftmbTXAc6XWyT6ieXHLiEZ7zuJFDPVSAdvrvrTveniW';
const SOL_USDT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8Ben98NY';
const SOL_USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const BTC_ADMIN = 'bc1q6j34j85jswe2xmnwvljjax4nemagfmak44glt0';
const LTC_ADMIN = 'ltc1qr3sxhe7uhy7230n67ydvyazj7xl3ktg2594xnq';
const DOGE_ADMIN = 'DRia2VvUFipNk5D31AvWd4b3W714hBdbtW';

const TRX_ADMIN = 'TLrv3EJEbGfEJgGbjQi3Yi1Yc88mn9mDxn';
const TRX_USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

const TON_ADMIN = 'UQB5vp_yQ4L-EheVHn4df--zU1XDuRX_tMSCc7WEB-PGuGv6';
const TON_USDT_MASTER = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';

const APT_ADMIN = '0x5eed1ca335fec51a3b18c115c6ceb0f4c774f3bdaa943076d1f58024921501f4';
const APT_NODE = 'https://fullnode.mainnet.aptoslabs.com';

const TOKEN_DECIMALS = { eth_usdt: 6, eth_usdc: 6, bsc_usdt: 18, polygon_usdt: 6, polygon_usdc: 6, avax_usdt: 6, avax_usdc: 6, sol_usdt: 6, sol_usdc: 6, trx_usdt: 6, ton_usdt: 6 };

function topic32(addr) {
  return '0x' + String(addr).toLowerCase().replace(/^0x/, '').padStart(64, '0');
}

async function evmRpc(rpcUrl, method, params) {
  const r = await fetch(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = await r.json();
  return j?.result ?? null;
}

async function solRpc(method, params) {
  const r = await fetch(SOLANA_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = await r.json();
  return j?.result ?? null;
}

async function getJson(url, headers) {
  const r = await fetch(url, { headers: { Accept: 'application/json', ...(headers || {}) } });
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

function toRaw(addr) {
  try { return '0:' + Address.parse(addr).hash.toString('hex'); } catch { return ''; }
}

// --- EVM ---
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
    if ((Number(sentWei) / 1e18) * price < amount * 0.9) return { ok: false, reason: 'amount-mismatch' };
    return { ok: true, amount, note: `Manual · ${net.label} (native)` };
  }

  const contracts = token === 'usdt' ? net.usdt : token === 'usdc' ? net.usdc : [];
  if (!contracts.length) return { ok: false, reason: 'unsupported-token' };
  const decKey = token === 'usdt' ? 'usdt' : 'usdc';
  const dec = TOKEN_DECIMALS[decKey] || 6;
  const expected = BigInt(Math.round(amount * Math.pow(10, dec)));
  const toTopic = topic32(net.admin);
  for (const c of contracts) {
    const cLow = String(c).toLowerCase();
    for (const log of (receipt.logs || [])) {
      if (String(log.address || '').toLowerCase() !== cLow) continue;
      const topics = log.topics || [];
      if (topics[0] !== TRANSFER_TOPIC) continue;
      if (String(topics[2] || '').toLowerCase() !== toTopic) continue;
      let sent = 0n;
      try { sent = BigInt(String(log.data || '0x0')); } catch { continue; }
      if (sent * 100n < expected * 99n) continue;
      return { ok: true, amount, note: `Manual · ${net.label} (${token.toUpperCase()})` };
    }
  }
  return { ok: false, reason: 'transfer-not-found' };
}

// --- Solana ---
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
  const expected = BigInt(Math.round(amount * 1e6));
  const findAmt = (arr) => {
    const e = (arr || []).find((b) => b.mint === mint && b.owner === SOL_ADMIN);
    return e ? BigInt(String(e.uiTokenAmount?.amount || '0')) : 0n;
  };
  const received = findAmt(tx.meta.postTokenBalances) - findAmt(tx.meta.preTokenBalances);
  if (received < BigInt(Math.round(Number(expected) * 0.99))) return { ok: false, reason: 'amount-mismatch' };
  return { ok: true, amount, note: `Manual · Solana (${token.toUpperCase()})` };
}

// --- BTC / LTC / DOGE (UTXO chains via blockchair; BTC via blockstream) ---
async function verifyUtxo(chain, txid, amount, admin, coinId) {
  const tx = await getJson(`https://api.blockchair.com/${chain}/dashboards/transaction/${txid}`);
  const rec = tx?.data?.[txid];
  if (!rec) return { ok: false, reason: 'pending' };
  let total = 0;
  for (const o of (rec.outputs || [])) {
    if (o.recipient === admin) total += Number(o.value || 0);
  }
  if (total <= 0) return { ok: false, reason: 'recipient-not-found' };
  const price = await getPrice(coinId);
  if (!price) return { ok: false, reason: 'price-unavailable' };
  if ((total / 1e8) * price < amount * 0.9) return { ok: false, reason: 'amount-mismatch' };
  return { ok: true, amount, note: `Manual · ${chain.toUpperCase()}` };
}

async function verifyBtc(txid, amount) {
  const tx = await getJson(`https://blockstream.info/api/tx/${txid}`);
  if (!tx) return { ok: false, reason: 'pending' };
  let sats = 0;
  for (const o of (tx.vout || [])) if (o.scriptpubkey_address === BTC_ADMIN) sats += Number(o.value || 0);
  if (sats <= 0) return { ok: false, reason: 'recipient-not-found' };
  const price = await getPrice('bitcoin');
  if (!price) return { ok: false, reason: 'price-unavailable' };
  if ((sats / 1e8) * price < amount * 0.9) return { ok: false, reason: 'amount-mismatch' };
  return { ok: true, amount, note: 'Manual · Bitcoin (BTC)' };
}

// --- Tron (tronscan, keyless) ---
async function verifyTron(hash, amount, token) {
  const j = await getJson(`https://apilist.tronscanapi.com/api/transaction-info?hash=${hash}`);
  if (!j || (!j.hash && !j.contractType)) return { ok: false, reason: 'pending' };
  if (j.contractRet && j.contractRet !== 'SUCCESS') return { ok: false, reason: 'tx-failed' };

  if (token === 'native') {
    const cd = j.contractData || {};
    if (String(cd.to_address || '') !== TRX_ADMIN) return { ok: false, reason: 'recipient-not-found' };
    const sun = Number(cd.amount || 0);
    if (sun <= 0) return { ok: false, reason: 'transfer-not-found' };
    const price = await getPrice('tron');
    if (!price) return { ok: false, reason: 'price-unavailable' };
    if ((sun / 1e6) * price < amount * 0.9) return { ok: false, reason: 'amount-mismatch' };
    return { ok: true, amount, note: 'Manual · Tron (native TRX)' };
  }
  // TRC20 USDT
  const expected = BigInt(Math.round(amount * 1e6));
  const list = j.trc20TransferInfo || j.transfersAllList || [];
  for (const t of list) {
    if (String(t.contract_address || '') !== TRX_USDT) continue;
    if (String(t.to_address || '') !== TRX_ADMIN) continue;
    let sent = 0n;
    try { sent = BigInt(String(t.amount_str || t.amount || '0')); } catch { continue; }
    if (sent * 100n < expected * 99n) continue;
    return { ok: true, amount, note: 'Manual · Tron (USDT)' };
  }
  return { ok: false, reason: 'transfer-not-found' };
}

// --- TON (tonapi admin events scan, keyless) ---
async function verifyTon(hash, amount, token) {
  const adminRaw = toRaw(TON_ADMIN);
  if (!adminRaw) return { ok: false, reason: 'server-error: admin addr' };
  const want = String(hash).toLowerCase();
  // Scan up to 3 pages of admin events for the matching transaction hash.
  let before = 0;
  for (let page = 0; page < 3; page++) {
    const url = `https://tonapi.io/v2/accounts/${TON_ADMIN}/events?limit=100` + (before ? `&before=${before}` : '');
    const ev = await getJson(url);
    const events = ev?.events || [];
    if (!events.length) break;
    for (const e of events) {
      if (String(e.event_id || '').toLowerCase() !== want) continue;
      for (const a of (e.actions || [])) {
        if (token === 'native' && a.type === 'TonTransfer') {
          const t = a.TonTransfer;
          if (!t || String(t.recipient?.address || '') !== adminRaw) continue;
          const nano = Number(t.amount || 0);
          if (nano <= 0) continue;
          const price = await getPrice('the-open-network');
          if (!price) return { ok: false, reason: 'price-unavailable' };
          if ((nano / 1e9) * price < amount * 0.9) return { ok: false, reason: 'amount-mismatch' };
          return { ok: true, amount, note: 'Manual · TON (native)' };
        }
        if (token === 'usdt' && a.type === 'JettonTransfer') {
          const t = a.JettonTransfer;
          if (!t) continue;
          if (String(t.recipient?.address || '') !== adminRaw) continue;
          if (String(t.jetton?.address || '') !== TON_USDT_MASTER) continue;
          const expected = BigInt(Math.round(amount * 1e6));
          let sent = 0n;
          try { sent = BigInt(String(t.amount || '0')); } catch { continue; }
          if (sent * 100n < expected * 99n) continue;
          return { ok: true, amount, note: 'Manual · TON (USDT)' };
        }
      }
      return { ok: false, reason: 'transfer-not-found' };
    }
    before = events[events.length - 1].timestamp;
  }
  return { ok: false, reason: 'pending' };
}

// --- Aptos native (payload aptos_account::transfer) ---
async function verifyAptNative(hash, amount) {
  const t = await getJson(`${APT_NODE}/v1/transactions/by_hash/${hash}`);
  if (!t) return { ok: false, reason: 'pending' };
  if (t.type !== 'user_transaction' || t.success === false) return { ok: false, reason: 'tx-failed' };
  const fn = t.payload?.function || '';
  if (fn !== '0x1::aptos_account::transfer' && fn !== '0x1::coin::transfer') return { ok: false, reason: 'transfer-not-found' };
  const args = t.payload?.arguments || [];
  const toAddr = String(args[0] || '').toLowerCase();
  if (toAddr !== APT_ADMIN) return { ok: false, reason: 'recipient-not-found' };
  const octas = Number(args[1] || 0);
  if (octas <= 0) return { ok: false, reason: 'transfer-not-found' };
  const price = await getPrice('aptos');
  if (!price) return { ok: false, reason: 'price-unavailable' };
  if ((octas / 1e8) * price < amount * 0.9) return { ok: false, reason: 'amount-mismatch' };
  return { ok: true, amount, note: 'Manual · Aptos (native APT)' };
  }

  // --- Aptos Fungible Asset (USDT / USDC) via primary_fungible_store::transfer ---
  // The FA transfer passes the token's metadata object as argument 0; we resolve
  // its on-chain Metadata resource to confirm the symbol + decimals, then check
  // recipient (arg 1) and amount (arg 2).
  async function verifyAptFa(hash, amount, token) {
  const t = await getJson(`${APT_NODE}/v1/transactions/by_hash/${hash}`);
  if (!t) return { ok: false, reason: 'pending' };
  if (t.type !== 'user_transaction' || t.success === false) return { ok: false, reason: 'tx-failed' };
  const fn = t.payload?.function || '';
  if (fn !== '0x1::primary_fungible_store::transfer') return { ok: false, reason: 'transfer-not-found' };
  const args = t.payload?.arguments || [];
  // Argument 0 = metadata object (wrapped as { inner: "0x..." } or a raw address).
  const arg0 = args[0];
  let metaAddr = '';
  if (typeof arg0 === 'string') metaAddr = arg0;
  else if (arg0 && typeof arg0 === 'object' && arg0.inner) metaAddr = String(arg0.inner);
  metaAddr = String(metaAddr || '').toLowerCase();
  if (!metaAddr.startsWith('0x')) return { ok: false, reason: 'transfer-not-found' };
  const meta = await getJson(`${APT_NODE}/v1/accounts/${metaAddr}/resource/0x1::fungible_asset::Metadata`);
  const symbol = String(meta?.data?.symbol || '').toLowerCase();
  const decimals = Number(meta?.data?.decimals || 0);
  const wantSym = token === 'usdt' ? 'usdt' : 'usdc';
  if (symbol !== wantSym || !decimals) return { ok: false, reason: 'transfer-not-found' };
  const toAddr = String(args[1] || '').toLowerCase();
  if (toAddr !== APT_ADMIN) return { ok: false, reason: 'recipient-not-found' };
  const sent = Number(args[2] || 0);
  if (sent <= 0) return { ok: false, reason: 'transfer-not-found' };
  const expected = Math.round(amount * Math.pow(10, decimals));
  if (sent * 100 < expected * 99) return { ok: false, reason: 'amount-mismatch' };
  return { ok: true, amount, note: `Manual · Aptos (${token.toUpperCase()})` };
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
    const isEvm = netKey.startsWith('eth_') || netKey.startsWith('bsc_') || netKey.startsWith('polygon_') || netKey.startsWith('avax_');
    if (isEvm) txHash = txHash.toLowerCase();

    const existing = await base44.asServiceRole.entities.Transaction.filter({ reference: txHash });
    if (existing && existing.length) {
      return Response.json({ ok: true, already: true, amount: Number(existing[0].amount) });
    }

    let res;
    if (netKey === 'btc') res = await verifyBtc(txHash, amount);
    else if (netKey === 'ltc') res = await verifyUtxo('litecoin', txHash, amount, LTC_ADMIN, 'litecoin');
    else if (netKey === 'doge') res = await verifyUtxo('dogecoin', txHash, amount, DOGE_ADMIN, 'dogecoin');
    else if (netKey === 'sol_native') res = await verifySolana(txHash, amount, 'native');
    else if (netKey === 'sol_usdt') res = await verifySolana(txHash, amount, 'usdt');
    else if (netKey === 'sol_usdc') res = await verifySolana(txHash, amount, 'usdc');
    else if (netKey === 'trx_native') res = await verifyTron(txHash, amount, 'native');
    else if (netKey === 'trx_usdt') res = await verifyTron(txHash, amount, 'usdt');
    else if (netKey === 'ton_native') res = await verifyTon(txHash, amount, 'native');
    else if (netKey === 'ton_usdt') res = await verifyTon(txHash, amount, 'usdt');
    else if (netKey === 'apt_native') res = await verifyAptNative(txHash, amount);
    else if (netKey === 'apt_usdt') res = await verifyAptFa(txHash, amount, 'usdt');
    else if (netKey === 'apt_usdc') res = await verifyAptFa(txHash, amount, 'usdc');
    else if (netKey.endsWith('_native')) {
      const net = EVM[netKey.split('_')[0]];
      res = net ? await verifyEvm(net, txHash, amount, 'native') : { ok: false, reason: 'unsupported-network' };
    } else if (netKey.endsWith('_usdt') || netKey.endsWith('_usdc')) {
      const parts = netKey.split('_');
      const token = parts[parts.length - 1];
      const net = EVM[parts.slice(0, -1).join('_')];
      res = net ? await verifyEvm(net, txHash, amount, token) : { ok: false, reason: 'unsupported-network' };
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