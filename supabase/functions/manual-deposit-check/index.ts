// Polled by the frontend while a manual-deposit request is open. Scans the
// deposit address's recent INCOMING transfers on the request's chain and
// matches the request's unique pay amount. On match: credits the wallet via
// the credit_deposit RPC (idempotent by tx hash) — no TxID submission needed.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { Address } from 'https://esm.sh/@ton/core@0.60.1';
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

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const EVM = {
  eth:     { rpc: 'https://eth.llamarpc.com', usdt: ['0xdac17f958d2ee523a2206206994597c13d831ec7'], usdc: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'], usdtDec: 6, usdcDec: 6, range: 400,  scan: 'https://eth.blockscout.com' },
  bsc:     { rpc: 'https://bsc-dataseed.binance.org', usdt: ['0x55d398326f99059ff775485246999027b3197955'], usdc: [], usdtDec: 18, usdcDec: 18, range: 1600, scan: 'https://bsc.blockscout.com' },
  polygon: { rpc: 'https://polygon-rpc.com', usdt: ['0xc2132d05d31c914a87c6611c10748aeb04b58e8f'], usdc: ['0x2791bca1f2de4661ed88a30c99a7a9449aa84174'], usdtDec: 6, usdcDec: 6, range: 900, scan: 'https://polygon.blockscout.com' },
  avax:    { rpc: 'https://api.avax.network/ext/bc/C/rpc', usdt: ['0xc7198437980c041c805a1edcba50c1ce5db95118', '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7'], usdc: ['0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'], usdtDec: 6, usdcDec: 6, range: 900, scan: null },
};
const SOLANA_RPC = 'https://solana-rpc.publicnode.com';
const SOL_USDT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8Ben98NY';
const SOL_USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const TRX_USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TON_USDT_MASTER = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';

function topic32(addr) { return '0x' + String(addr).toLowerCase().replace(/^0x/, '').padStart(64, '0'); }

async function getJson(url) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}
async function rpcCall(rpcUrl, method, params) {
  try {
    const r = await fetch(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
    const j = await r.json();
    return j?.result ?? null;
  } catch { return null; }
}
const solRpc = (m, p) => rpcCall(SOLANA_RPC, m, p);

// Every scanner returns [{ tx, units, dec }] — incoming transfers TO addr,
// in raw on-chain units so matching is exact (no float precision loss).

async function scanBtc(addr, sinceMs) {
  const txs = await getJson(`https://blockstream.info/api/address/${addr}/txs`) || [];
  const out = [];
  for (const t of (Array.isArray(txs) ? txs.slice(0, 50) : [])) {
    const tMs = t.status?.block_time ? t.status.block_time * 1000 : Date.now(); // mempool tx = now
    if (tMs < sinceMs) continue;
    let sats = 0;
    for (const o of (t.vout || [])) if (o.scriptpubkey_address === addr) sats += Number(o.value || 0);
    if (sats > 0) out.push({ tx: t.txid, units: sats, dec: 8 });
  }
  return out;
}

async function scanBlockchair(chain, addr, sinceMs) {
  const j = await getJson(`https://api.blockchair.com/${chain}/outputs?q=recipient(${addr})&limit=50&s=id(desc)`);
  const out = [];
  for (const o of (j?.data || [])) {
    if (o.time) {
      const tMs = new Date(String(o.time).replace(' ', 'T') + 'Z').getTime();
      if (isFinite(tMs) && tMs < sinceMs) continue;
    }
    out.push({ tx: o.transaction_hash, units: Number(o.value || 0), dec: 8 });
  }
  return out;
}

async function scanTronUsdt(addr, sinceMs) {
  const j = await getJson(`https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=50&start=0&toAddress=${addr}&contract_address=${TRX_USDT}`);
  const out = [];
  for (const t of (j?.token_transfers || [])) {
    if (Number(t.block_ts || 0) < sinceMs) continue;
    if (String(t.to_address || '') !== addr) continue;
    if (t.finalResult && t.finalResult !== 'SUCCESS') continue;
    let u; try { u = BigInt(String(t.quant || '0')); } catch { continue; }
    if (u > 0n) out.push({ tx: t.transaction_id, units: u, dec: 6 });
  }
  return out;
}

async function scanTronNative(addr, sinceMs) {
  const j = await getJson(`https://apilist.tronscanapi.com/api/transaction?sort=-timestamp&limit=50&start=0&address=${addr}`);
  const out = [];
  for (const t of (j?.data || [])) {
    if (Number(t.timestamp || 0) < sinceMs) continue;
    if (Number(t.contractType) !== 1) continue;
    const to = t.toAddress || t.contractData?.to_address || '';
    if (String(to) !== addr) continue;
    const sun = Number(t.contractData?.amount || t.amount || 0);
    if (sun > 0) out.push({ tx: t.hash, units: sun, dec: 6 });
  }
  return out;
}

async function scanEvmToken(net, contracts, dec, addr) {
  const latestHex = await rpcCall(net.rpc, 'eth_blockNumber', []);
  if (!latestHex) return [];
  const latest = parseInt(latestHex, 16);
  const from = '0x' + Math.max(0, latest - net.range).toString(16);
  const out = [];
  for (const c of contracts) {
    const logs = await rpcCall(net.rpc, 'eth_getLogs', [{ fromBlock: from, toBlock: 'latest', address: c, topics: [TRANSFER_TOPIC, null, topic32(addr)] }]) || [];
    for (const log of (Array.isArray(logs) ? logs : [])) {
      let v; try { v = BigInt(String(log.data || '0x0')); } catch { continue; }
      if (v > 0n) out.push({ tx: log.transactionHash, units: v, dec });
    }
  }
  return out;
}

async function scanEvmNative(net, addr, sinceMs) {
  if (!net.scan) return [];
  const j = await getJson(`${net.scan}/api?module=account&action=txlist&address=${addr}&sort=desc&page=1&offset=50`);
  const out = [];
  for (const t of (j?.result || [])) {
    if (typeof t !== 'object') continue;
    if (String(t.to || '').toLowerCase() !== addr.toLowerCase()) continue;
    if (t.isError === '1' || t.txreceipt_status === '0') continue;
    if (Number(t.timeStamp || 0) * 1000 < sinceMs) continue;
    let v; try { v = BigInt(String(t.value || '0')); } catch { continue; }
    if (v > 0n) out.push({ tx: t.hash, units: v, dec: 18 });
  }
  return out;
}

async function scanSol(addr, sinceMs, token) {
  let scanAddr = addr;
  if (token !== 'native') {
    const mint = token === 'usdt' ? SOL_USDT : SOL_USDC;
    const acc = await solRpc('getTokenAccountsByOwner', [addr, { mint }, { encoding: 'jsonParsed' }]);
    scanAddr = acc?.value?.[0]?.pubkey || addr;
  }
  const sigs = await solRpc('getSignaturesForAddress', [scanAddr, { limit: 20 }]) || [];
  const recent = (Array.isArray(sigs) ? sigs : []).filter((s) => !s.err && (!s.blockTime || s.blockTime * 1000 >= sinceMs)).slice(0, 8);
  const out = [];
  for (const s of recent) {
    const tx = await solRpc('getTransaction', [s.signature, { maxSupportedTransactionVersion: 0, encoding: 'jsonParsed' }]);
    if (!tx || tx.meta?.err) continue;
    if (token === 'native') {
      const keys = (tx.transaction.message.accountKeys || []).map((a) => (typeof a === 'string' ? a : a.pubkey));
      const i = keys.indexOf(addr);
      if (i < 0) continue;
      const d = (tx.meta.postBalances[i] || 0) - (tx.meta.preBalances[i] || 0);
      if (d > 0) out.push({ tx: s.signature, units: d, dec: 9 });
    } else {
      const mint = token === 'usdt' ? SOL_USDT : SOL_USDC;
      const f = (arr) => { const e = (arr || []).find((b) => b.mint === mint && b.owner === addr); return e ? BigInt(String(e.uiTokenAmount?.amount || '0')) : 0n; };
      const d = f(tx.meta.postTokenBalances) - f(tx.meta.preTokenBalances);
      if (d > 0n) out.push({ tx: s.signature, units: d, dec: 6 });
    }
  }
  return out;
}

async function scanTon(addr, sinceMs, token) {
  let adminRaw = '';
  try { adminRaw = '0:' + Address.parse(addr).hash.toString('hex'); } catch { return []; }
  const ev = await getJson(`https://tonapi.io/v2/accounts/${addr}/events?limit=50`);
  const out = [];
  for (const e of (ev?.events || [])) {
    if (Number(e.timestamp || 0) * 1000 < sinceMs) continue;
    for (const a of (e.actions || [])) {
      if (token === 'native' && a.type === 'TonTransfer') {
        const t = a.TonTransfer;
        if (t && String(t.recipient?.address || '') === adminRaw && Number(t.amount) > 0) {
          out.push({ tx: e.event_id, units: Number(t.amount), dec: 9 });
        }
      }
      if (token === 'usdt' && a.type === 'JettonTransfer') {
        const t = a.JettonTransfer;
        if (t && String(t.recipient?.address || '') === adminRaw && String(t.jetton?.address || '') === TON_USDT_MASTER) {
          let u; try { u = BigInt(String(t.amount || '0')); } catch { continue; }
          if (u > 0n) out.push({ tx: e.event_id, units: u, dec: 6 });
        }
      }
    }
  }
  return out;
}

// Returns null when the network can't be auto-scanned.
async function scan(netKey, addr, sinceMs) {
  if (netKey === 'btc') return scanBtc(addr, sinceMs);
  if (netKey === 'ltc') return scanBlockchair('litecoin', addr, sinceMs);
  if (netKey === 'doge') return scanBlockchair('dogecoin', addr, sinceMs);
  if (netKey === 'trx_usdt') return scanTronUsdt(addr, sinceMs);
  if (netKey === 'trx_native') return scanTronNative(addr, sinceMs);
  if (netKey === 'sol_native') return scanSol(addr, sinceMs, 'native');
  if (netKey === 'sol_usdt') return scanSol(addr, sinceMs, 'usdt');
  if (netKey === 'sol_usdc') return scanSol(addr, sinceMs, 'usdc');
  if (netKey === 'ton_native') return scanTon(addr, sinceMs, 'native');
  if (netKey === 'ton_usdt') return scanTon(addr, sinceMs, 'usdt');
  const parts = netKey.split('_');
  const net = EVM[parts[0]];
  const token = parts[1];
  if (!net || !token) return null;
  if (token === 'native') return net.scan ? scanEvmNative(net, addr, sinceMs) : null;
  if (token === 'usdt') return net.usdt.length ? scanEvmToken(net, net.usdt, net.usdtDec, addr) : null;
  if (token === 'usdc') return net.usdc.length ? scanEvmToken(net, net.usdc, net.usdcDec, addr) : null;
  return null;
}

// Exact unit-level amount match (want is at D decimals; units at `dec`).
function unitsMatch(units, dec, want, D) {
  let U;
  try { U = typeof units === 'bigint' ? units : BigInt(Math.round(Number(units))); } catch { return false; }
  if (dec === D) return U === want;
  if (dec > D) { const f = 10n ** BigInt(dec - D); return U % f === 0n && U / f === want; }
  return U * (10n ** BigInt(D - dec)) === want;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const user = await authUser(req);
    if (!user) return json({ ok: false, reason: 'unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '');
    if (!id) return json({ ok: false, reason: 'invalid-params' });

    const { data: row } = await svc.from('manual_deposit_requests').select('*').eq('id', id).maybeSingle();
    if (!row || row.user_id !== user.id) return json({ ok: false, reason: 'not-found' }, 404);
    if (row.status === 'completed') return json({ ok: true, status: 'completed', amount: Number(row.amount_usd) });
    if (row.status === 'expired') return json({ ok: true, status: 'expired' });

    const expMs = new Date(row.expires_at).getTime();
    // 90s grace after the visible timer so a payment sent at the last second still credits.
    if (Date.now() > expMs + 90 * 1000) {
      await svc.from('manual_deposit_requests').update({ status: 'expired' }).eq('id', id).eq('status', 'pending');
      return json({ ok: true, status: 'expired' });
    }

    const sinceMs = new Date(row.created_at).getTime() - 60 * 1000;
    const cands = await scan(row.network_key, row.address, sinceMs);
    if (cands === null) return json({ ok: true, status: 'pending', scan: 'unsupported' });

    const D = Number(row.decimals) || 4;
    const want = BigInt(Math.round(Number(row.pay_amount) * Math.pow(10, D)));

    for (const c of cands) {
      if (!c.tx || !unitsMatch(c.units, c.dec, want, D)) continue;
      // Idempotency: this tx hash must not have credited anything before.
      const { data: used } = await svc.from('transactions').select('id').eq('reference', c.tx).limit(1);
      if (used?.length) continue;

      // Atomic claim — only one concurrent check may credit this request.
      const { data: claimed } = await svc.from('manual_deposit_requests')
        .update({ status: 'completed', tx_hash: c.tx })
        .eq('id', id).eq('status', 'pending').select('id');
      if (!claimed?.length) return json({ ok: true, status: 'completed', amount: Number(row.amount_usd) });

      const { data: prof } = await svc.from('profiles').select('email').eq('id', user.id).maybeSingle();
      const { data: credit, error } = await svc.rpc('credit_deposit', {
        p_user: user.id,
        p_email: prof?.email || '',
        p_amount: Number(row.amount_usd),
        p_method: 'manual-auto',
        p_reference: c.tx,
        p_note: `Auto-detect · ${row.network_label || row.network_key} · sent ${row.pay_amount} ${row.coin}`,
      });
      if (error) {
        // Roll back the claim so a later poll can retry the credit.
        await svc.from('manual_deposit_requests').update({ status: 'pending', tx_hash: '' }).eq('id', id);
        return json({ ok: false, reason: error.message });
      }
      await applyReferralCommission(svc, user.id, Number(row.amount_usd), c.tx);

      return json({ ok: true, status: 'completed', amount: Number(row.amount_usd), balance: credit?.balance });
    }

    return json({ ok: true, status: 'pending' });
  } catch (e) {
    return json({ ok: false, reason: 'server-error: ' + String(e?.message || e) });
  }
});