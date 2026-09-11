import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet, Loader2, CheckCircle2, AlertTriangle, ChevronLeft, ArrowRight, Smartphone, Chrome, ChevronDown, LogOut } from 'lucide-react';
import { connectWalletConnect, disconnectWalletConnect, disconnectInjected, hasWalletConnect, onWalletConnectUri, preloadWalletConnect } from '@/lib/walletConnect';
import { USDT_NETWORKS } from '@/lib/usdtNetworks';
import { hasTelegramBackButton } from '@/lib/telegram';
import { openWalletLink } from '@/lib/openWalletLink';
import { openWalletForRequest } from '@/lib/walletRedirect';
import { getCryptoPrices } from '@/lib/cryptoPrices';
import { addWagerRequirement, reloadBalance } from '@/lib/useCasinoBalance';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

function toHexAmount(usd, decimals) {
  const factor = Math.pow(10, decimals);
  return '0x' + BigInt(Math.round(usd * factor)).toString(16);
}
function pad32(addr) {
  let h = String(addr).toLowerCase().replace(/^0x/, '');
  while (h.length < 64) h = '0' + h;
  return '0x' + h;
}
function getInjectedProvider() {
  if (typeof window === 'undefined') return null;
  return window.trustwallet || window.ethereum || null;
}
const isMobile = () => /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '')

// ERC-20 Transfer event topic — used to watch the chain for the deposit.
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const topic32 = (addr) => '0x' + String(addr).toLowerCase().replace(/^0x/, '').padStart(64, '0');
async function rpcCall(rpcUrl, method, params) {
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
// Trust deep link — opens Trust Wallet's own Send screen with asset,
// recipient and amount pre-filled. UAI asset format is c<slip44>_t<TICKER>
// for native coins and c<slip44>_t<TICKER>-<contract> for tokens: a bare
// contract after _t is NOT a valid asset id — Trust silently drops the whole
// prefill and opens an empty Send screen.
const TRUST_ASSET_COIN = { bsc: '20000714', eth: '60', polygon: '966' };
const TRUST_NATIVE_TICKER = { bsc: 'BNB', eth: 'ETH' };
const buildTrustSendLink = (net, amt, isNative) => {
  const ticker = isNative ? TRUST_NATIVE_TICKER[net.key] : 'USDT';
  return 'https://link.trustwallet.com/send?asset=c' + TRUST_ASSET_COIN[net.key] + '_t' + ticker +
    (isNative ? '' : '-' + String(net.usdt).toLowerCase()) +
    '&address=' + net.admin + '&amount=' + encodeURIComponent(String(amt));
};

export default function TrustWalletDeposit({ amount, onBack, onDone }) {
  const { setBalance } = useCasinoBalance();
  const { toast } = useToast();
  const [netKey, setNetKey] = useState(USDT_NETWORKS[0].key);
  const [netOpen, setNetOpen] = useState(false);
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState('idle'); // idle|connecting|connected|sending|confirming|verifying|done|error
  const [errMsg, setErrMsg] = useState('');
  const [wcUri, setWcUri] = useState('');
  // Remember the player's coin choice (USDT / native coin) across sessions.
const [payAsset, setPayAsset] = useState(() => {
  try { return localStorage.getItem('gbPayAsset') === 'native' ? 'native' : 'usdt'; } catch { return 'usdt'; }
}); // 'usdt' | 'native'
useEffect(() => { try { localStorage.setItem('gbPayAsset', payAsset); } catch {} }, [payAsset]);
  const [price, setPrice] = useState(0);
  const providerRef = useRef(null);
  const accountRef = useRef(null);
  const wcUriRef = useRef('');
  const modeRef = useRef(''); // 'wc' | 'injected' — how the wallet was connected
  const lastBlockRef = useRef(null); // last block scanned while watching the chain
  const pollStartedRef = useRef(0);
  const net = USDT_NETWORKS.find((n) => n.key === netKey) || USDT_NETWORKS[0];
  const nativeSupported = net.key === 'bsc' || net.key === 'eth';
  const nativeKey = net.key === 'bsc' ? 'bnb' : 'eth';
  const coinAmt = price ? amount / price : 0;

  // WalletConnect providers reject eth_getTransactionReceipt via request(),
  // so fetch the receipt straight from a public RPC endpoint instead.
  const fetchReceipt = async (txHash) => {
    const body = { jsonrpc: '2.0', id: 1, method: 'eth_getTransactionReceipt', params: [txHash] };
    for (let i = 0; i < 45; i++) {
      try {
        const r = await fetch(net.rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const j = await r.json();
        if (j?.result) return j.result;
      } catch {}
      await new Promise((rr) => setTimeout(rr, 2000));
    }
    return null;
  };

  const openTrustApp = () => {
    const uri = wcUriRef.current;
    if (uri) {
      openWalletLink('https://link.trustwallet.com/wc?uri=' + encodeURIComponent(uri));
    } else {
      openWalletForRequest(providerRef.current, 'https://link.trustwallet.com/open');
    }
  };

  // Warm the WalletConnect provider for the SELECTED chain (re-warm whenever
  // the network changes) so tapping Connect opens the wallet immediately
  // instead of initialising first.
  useEffect(() => { if (hasWalletConnect()) preloadWalletConnect(net.chainId); }, [netKey]);

  useEffect(() => { if (!nativeSupported && payAsset === 'native') setPayAsset('usdt'); }, [netKey]);
  useEffect(() => {
    if (payAsset === 'native' && nativeSupported) {
      getCryptoPrices().then((p) => setPrice(p[nativeKey] || 0)).catch(() => {});
    }
  }, [payAsset, netKey]);

  const connectAndPay = async () => {
    if (!hasWalletConnect()) {
      setErrMsg('WalletConnect projectId is not set (src/lib/walletConfig.js).');
      setStatus('error'); return;
    }
    setStatus('connecting'); setErrMsg(''); setWcUri('');
    const mobile = isMobile();
    let freshPairing = false;
    onWalletConnectUri((uri) => {
      freshPairing = true;
      wcUriRef.current = uri;
      setWcUri(uri);
      if (mobile) {
        // Wait for the session proposal to be fully published to the relay
        // before foregrounding the wallet — opening it instantly freezes this
        // webview mid-publish and the wallet spins with no pending request.
        setTimeout(() => openWalletLink('https://link.trustwallet.com/wc?uri=' + encodeURIComponent(uri)), 800);
      }
    });
    const res = await connectWalletConnect(net.chainId);
    if (res && res.account) {
      providerRef.current = res.provider;
      accountRef.current = res.account;
      modeRef.current = 'wc';
      setAccount(res.account);
      // The pairing URI is consumed once connected — keeping it would make the
      // "open wallet" link re-open an expired pairing, so the wallet appears
      // with no pending request at all.
      wcUriRef.current = '';
      setWcUri('');
      // A previously saved session reconnects instantly — in that case show the
      // Send step instead of jumping straight into the wallet, so the player
      // can review the amount first.
      if (freshPairing) await deposit();
      else setStatus('connected');
    } else {
      setErrMsg('Wallet connection was cancelled or failed.');
      setStatus('error'); setWcUri('');
    }
  };

  const connectInjected = async () => {
    const p = getInjectedProvider();
    if (!p) { setErrMsg('No injected wallet found. Use the mobile app.'); setStatus('error'); return; }
    setStatus('connecting'); setErrMsg(''); setWcUri('');
    try {
      const accts = await p.request({ method: 'eth_requestAccounts' });
      try {
        await p.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: net.chainIdHex }] });
      } catch (e) {
        if (e && (e.code === 4902 || e.code === -32603)) {
          await p.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: net.chainIdHex,
              chainName: net.label,
              nativeCurrency: { name: net.nativeName, symbol: net.nativeSymbol, decimals: 18 },
              rpcUrls: [net.rpc],
              blockExplorerUrls: [net.explorer],
            }],
          });
        } else { throw e; }
      }
      providerRef.current = p;
      accountRef.current = accts[0];
      modeRef.current = 'injected';
      setAccount(accts[0]);
      setStatus('connected');
    } catch {
      setErrMsg('Wallet connection was cancelled.'); setStatus('error');
    }
  };

  const connectMobile = async () => {
    if (!hasWalletConnect()) {
      setErrMsg('WalletConnect projectId is not set (src/lib/walletConfig.js).');
      setStatus('error'); return;
    }
    setStatus('connecting'); setErrMsg(''); setWcUri('');
    onWalletConnectUri(setWcUri);
    const res = await connectWalletConnect(net.chainId);
    if (res && res.account) {
      providerRef.current = res.provider;
      accountRef.current = res.account;
      modeRef.current = 'wc';
      setAccount(res.account);
      wcUriRef.current = '';
      setWcUri('');
      setStatus('connected');
    } else {
      setErrMsg('Mobile wallet connection failed or was cancelled.');
      setStatus('error'); setWcUri('');
    }
  };

  const finishVerify = async (fn, payload, amt) => {
    setStatus('verifying');
    const res = await base44.functions.invoke(fn, payload);
    if (res?.data?.ok) {
      if (!res.data.already) {
        reloadBalance();
      }
      setStatus('done');
      toast({ title: 'Deposit successful', description: `$${Number(res.data.amount || amt).toFixed(2)} has been added to your balance.` });
      setTimeout(() => onDone?.(), 1200);
    } else {
      const reason = res?.data?.reason || 'unknown';
      setErrMsg(reason === 'pending' ? 'Transaction is still pending — please try again shortly.' : `Verification failed: ${reason}`);
      setStatus('error');
    }
  };

  // Trust Wallet's WalletConnect renderer doesn't decode token transfers — it
  // shows a scary "Send 0 BNB to <USDT contract>" screen with a fraud warning.
  // On mobile, open Trust's own Send screen (deep link) with everything
  // pre-filled instead, then watch the chain for the transfer.
  // The native link must carry the COIN amount, not the USD figure.
  const trustSendLinkFor = async () => {
    if (payAsset === 'native') {
      const pr = price || (await getCryptoPrices())[nativeKey] || 0;
      return buildTrustSendLink(net, pr ? amount / pr : amount, true);
    }
    return buildTrustSendLink(net, amount);
  };

  const startTrustSend = async () => {
    setStatus('sending'); setErrMsg('');
    try {
      const bn = await rpcCall(net.rpc, 'eth_blockNumber', []);
      lastBlockRef.current = bn ? parseInt(bn, 16) - 2 : null;
      pollStartedRef.current = Date.now();
    } catch {}
    openWalletLink(await trustSendLinkFor());
    setStatus('awaiting');
  };

  const checkForDeposit = async () => {
    const acct = accountRef.current;
    if (!acct || lastBlockRef.current == null) return null;
    const latestHex = await rpcCall(net.rpc, 'eth_blockNumber', []);
    if (!latestHex) return null;
    const latest = parseInt(latestHex, 16);
    if (payAsset === 'native') {
      // Native coin transfers emit no logs — scan the block transactions for
      // a payment from the player's wallet to the deposit address. The per-run
      // cap works through a big backlog (the webview is suspended while the
      // player is inside Trust) gradually over the next ticks.
      let cursor = lastBlockRef.current;
      if (latest - cursor > 5900) cursor = latest - 5900;
      const stopAt = Math.min(latest, cursor + 60);
      for (let b = cursor + 1; b <= stopAt; b++) {
        const block = await rpcCall(net.rpc, 'eth_getBlockByNumber', ['0x' + b.toString(16), true]);
        if (!block || !block.transactions) continue;
        lastBlockRef.current = b;
        const hit = block.transactions.find((tx) =>
          tx?.from?.toLowerCase() === acct.toLowerCase() &&
          tx?.to?.toLowerCase() === String(net.admin).toLowerCase() &&
          BigInt(tx.value || '0x0') > BigInt(0));
        if (hit) return { transactionHash: hit.hash, value: hit.value };
      }
      return null;
    }
    let cursor = lastBlockRef.current;
    if (latest - cursor > 5900) cursor = latest - 5900;
    for (let f = cursor + 1; f <= latest; f += 1000) {
      const to = Math.min(f + 999, latest);
      const logs = await rpcCall(net.rpc, 'eth_getLogs', [{
        fromBlock: '0x' + f.toString(16),
        toBlock: '0x' + to.toString(16),
        address: net.usdt,
        topics: [TRANSFER_TOPIC, topic32(acct), topic32(net.admin)],
      }]);
      lastBlockRef.current = to;
      if (logs && logs.length) return logs[0];
    }
    return null;
  };

  // While the player confirms in Trust's Send screen, poll the chain for
  // the USDT transfer and credit the balance automatically once it lands.
  useEffect(() => {
    if (status !== 'awaiting') return;
    let cancelled = false;
    let running = false;
    const tick = async () => {
      if (cancelled || running) return;
      running = true;
      try {
        if (Date.now() - pollStartedRef.current > 20 * 60 * 1000) {
          setErrMsg('No matching transaction found after 20 minutes. If you already sent it, please contact support with your transaction ID.');
          setStatus('error');
          return;
        }
        const log = await checkForDeposit();
        if (cancelled) return;
        if (log?.transactionHash) {
          if (payAsset === 'native') {
            await finishVerify('verifyEvmNativeDeposit', { txHash: log.transactionHash, amount, userWallet: accountRef.current, network: net.key, expectedWei: log.value }, amount);
          } else {
            await finishVerify('verifyEvmDeposit', { txHash: log.transactionHash, amount, userWallet: accountRef.current, network: net.key }, amount);
          }
        }
      } finally { running = false; }
    };
    tick();
    const id = setInterval(tick, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [status, netKey, amount, payAsset]);

  const deposit = async () => {
    const p = providerRef.current;
    const acct = accountRef.current;
    if (!p || !acct) return;
    // Trust rejects WalletConnect session requests with code 5201 ("Unknown
    // method(s) requested") — for USDT AND native coin sends alike — so on
    // mobile never send a payment request over WC: open Trust's own Send
    // screen pre-filled instead, then watch the chain for the payment.
    if (modeRef.current === 'wc' && isMobile()) {
      await startTrustSend();
      return;
    }
    setStatus('sending'); setErrMsg('');
    // The request MUST be dispatched over the WalletConnect relay BEFORE the
    // wallet is foregrounded — opening the wallet first backgrounds (and in the
    // Telegram webview freezes) this page, so the request never leaves and the
    // wallet shows nothing pending.
    const sendTx = (txParams) => {
      const pending = p.request({ method: 'eth_sendTransaction', params: [txParams] });
      if (isMobile()) setTimeout(() => openWalletForRequest(p, 'https://link.trustwallet.com/open'), 300);
      // Surface a silent hang instead of spinning forever, so we can see that
      // the relay never delivered the request.
      const timeout = new Promise((_, rej) => setTimeout(
        () => rej(new Error('no response from wallet after 90s (session topic: ' + (p?.session?.topic ? p.session.topic.slice(0, 8) : 'none') + ')')),
        90000));
      return Promise.race([pending, timeout]);
    };
    try {

      if (payAsset === 'native') {
        const pr = price || (await getCryptoPrices())[nativeKey] || 0;
        if (!pr) { setErrMsg('Could not fetch coin price. Please try again.'); setStatus('error'); return; }
        const wei = BigInt(Math.round((amount / pr) * 1e18));
        const value = '0x' + wei.toString(16);
        const txHash = await sendTx({ from: acct, to: net.admin, value });
        setStatus('confirming');
        const receipt = await fetchReceipt(txHash);
        if (!receipt) { setErrMsg('Confirmation not yet received, please try again shortly.'); setStatus('error'); return; }
        if (receipt.status !== '0x1') { setErrMsg('Transaction failed (reverted).'); setStatus('error'); return; }
        await finishVerify('verifyEvmNativeDeposit', { txHash, amount, userWallet: acct, network: net.key, expectedWei: value }, amount);
        return;
      }

      const data = '0xa9059cbb' + pad32(net.admin).slice(2) + pad32(toHexAmount(amount, net.decimals)).slice(2);
      const to = net.usdt.toLowerCase();
      // No eth_estimateGas here: WalletConnect relays often never answer it, so
      // awaiting it silently hangs the flow and the wallet never receives the
      // transaction. The wallet estimates gas itself.
      const txHash = await sendTx({ from: acct, to, data, value: '0x0' });
      setStatus('confirming');
      const receipt = await fetchReceipt(txHash);
      if (!receipt) { setErrMsg('Confirmation not yet received, please try again shortly.'); setStatus('error'); return; }
      if (receipt.status !== '0x1') { setErrMsg('Transaction failed (reverted).'); setStatus('error'); return; }
      await finishVerify('verifyEvmDeposit', { txHash, amount, userWallet: acct, network: net.key }, amount);
    } catch (e) {
      console.error('TrustWalletDeposit send error:', e);
      const msg = e?.message || e?.code || (typeof e === 'string' ? e : 'cancelled/failed');
      setErrMsg('Transaction cancelled/failed: ' + msg);
      setStatus('error');
    }
  };

  const busy = ['connecting', 'sending', 'awaiting', 'confirming', 'verifying'].includes(status);
  const statusText = {
    connecting: 'Connecting wallet…',
    sending: 'Sending transaction request to wallet…',
    awaiting: 'Waiting for your transfer — checking automatically…',
    confirming: 'Waiting for blockchain confirmation…',
    verifying: 'Verifying and adding balance…',
  }[status];
  const netLocked = busy || status === 'connected';

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: SANS, animation: 'dashFadeIn 350ms ease both' }}>
      {/* Header — text unchanged */}
      <div className="flex items-center gap-3">
        {!hasTelegramBackButton() && (
          <button onClick={onBack}
            className="flex items-center gap-1.5 px-4 h-10 rounded-[14px] font-bold transition-all active:scale-95"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        <h1 className="text-base font-extrabold" style={{ color: '#D4AF37' }}>Trust Wallet Deposit</h1>
      </div>

      {/* Network selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.85)' }}>Select USDT Network</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => !netLocked && setNetOpen((v) => !v)}
            disabled={netLocked}
            className="dash-input w-full flex items-center justify-between px-4 h-12 pr-10 text-sm font-semibold disabled:opacity-50 text-left"
            style={{ fontFamily: 'var(--font-western)', letterSpacing: '0.02em' }}
          >
            {net.label}
          </button>
          <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#D4AF37' }} />
          {netOpen && !netLocked && (
            <>
            <div className="fixed inset-0 z-30" onClick={() => setNetOpen(false)} />
            <div className="absolute z-40 left-0 right-0 top-full mt-1 rounded-[14px] overflow-hidden" style={{ background: '#1a2021', border: '1px solid rgba(212,175,55,0.35)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
              {USDT_NETWORKS.map((n) => {
                const sel = n.key === netKey;
                return (
                  <button
                    key={n.key}
                    type="button"
                    onClick={() => { setNetKey(n.key); setNetOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: sel ? 'rgba(76,201,192,0.10)' : 'transparent' }}
                  >
                    <span className="text-sm" style={{ fontFamily: 'var(--font-western)', color: sel ? '#4cc9c0' : '#fff', letterSpacing: '0.02em' }}>{n.label}</span>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${sel ? '#4cc9c0' : 'rgba(255,255,255,0.4)'}` }}>
                      {sel && <span className="w-2 h-2 rounded-full" style={{ background: '#4cc9c0' }} />}
                    </span>
                  </button>
                );
              })}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Payment coin segmented control */}
      {nativeSupported && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.85)' }}>Payment Coin</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPayAsset('usdt')} disabled={netLocked}
              className="h-12 rounded-[14px] text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={payAsset === 'usdt'
                ? { background: 'linear-gradient(135deg, #FFD700, #C89B3C)', color: '#1a1408', border: '1px solid rgba(255,215,0,0.6)', boxShadow: '0 4px 14px rgba(200,155,60,0.4)' }
                : { background: 'rgba(255,255,255,0.03)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
              USDT
            </button>
            <button onClick={() => setPayAsset('native')} disabled={netLocked}
              className="h-12 rounded-[14px] text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={payAsset === 'native'
                ? { background: 'linear-gradient(135deg, #FFD700, #C89B3C)', color: '#1a1408', border: '1px solid rgba(255,215,0,0.6)', boxShadow: '0 4px 14px rgba(200,155,60,0.4)' }
                : { background: 'rgba(255,255,255,0.03)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
              {net.nativeSymbol} (Native)
            </button>
          </div>
        </div>
      )}

      {/* Deposit amount card */}
      <div className="dash-card p-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.4)', boxShadow: '0 0 24px rgba(212,175,55,0.16), 0 8px 24px rgba(0,0,0,0.5)' }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.85)' }}>Depositing</p>
          <p className="text-3xl font-extrabold tabular-nums mt-0.5" style={{ color: '#fff' }}>${amount.toFixed(2)}</p>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{payAsset === 'native' ? `≈ ${coinAmt.toFixed(5)} ${net.nativeSymbol} (Native)` : `${net.short} (BEP20/ERC20)`}</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)', boxShadow: '0 0 18px rgba(212,175,55,0.5)' }}>
          <Wallet className="w-6 h-6" style={{ color: '#1a1408' }} />
        </div>
      </div>

      {/* Connected account */}
      {account && (
        <div className="dash-card px-4 py-2.5 flex items-center justify-between gap-2"
          style={{ border: '1px solid rgba(212,175,55,0.25)' }}>
          <span className="text-[12px] font-mono break-all" style={{ color: 'rgba(255,255,255,0.85)' }}>✓ Connected: {account}</span>
          {!busy && (
            <button
              onClick={async () => {
                try { await disconnectInjected(providerRef.current); } catch {}
                try { await disconnectWalletConnect(); } catch {}
                providerRef.current = null;
                accountRef.current = null;
                wcUriRef.current = '';
                setAccount(null);
                setWcUri('');
                setErrMsg('');
                setStatus('idle');
              }}
              className="shrink-0 flex items-center gap-1 px-3 h-8 rounded-[12px] text-[11px] font-bold transition-all active:scale-95"
              style={{ border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.12)', color: '#fca5a5' }}
            >
              <LogOut className="w-3.5 h-3.5" /> Disconnect
            </button>
          )}
        </div>
      )}

      {/* Busy status */}
      {busy && !wcUri && (
        <div className="dash-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#D4AF37' }}>
            <Loader2 className="w-4 h-4 animate-spin" /> {statusText}
          </div>
          {status === 'connecting' && (
            <>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Waiting for the Trust Wallet app to open. If it didn't open automatically, tap the button below.
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={openTrustApp}
                  className="flex items-center gap-2 px-4 h-11 rounded-[14px] font-bold transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}>
                  <Smartphone className="w-4 h-4" /> Open Wallet
                </button>
                <button onClick={() => { setStatus('idle'); setErrMsg(''); setWcUri(''); }}
                  className="flex items-center gap-2 px-4 h-11 rounded-[14px] font-bold transition-all active:scale-95"
                  style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.75)' }}>
                  Cancel
                </button>
              </div>
            </>
          )}
          {status === 'sending' && (
            <>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Seeing "<b style={{ color: '#D4AF37' }}>0 BNB</b>" in the wallet is normal — USDT transfers carry 0 native BNB; the actual {amount.toFixed(2)} USDT goes inside the contract call. However, your wallet needs a <b style={{ color: '#D4AF37' }}>small amount of BNB ($0.05–0.20)</b> for gas — otherwise it will show "Insufficient BNB balance".
              </p>
              <button onClick={openTrustApp}
                className="self-start flex items-center gap-2 px-4 h-11 rounded-[14px] font-bold transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}>
                <Smartphone className="w-4 h-4" /> Open Trust Wallet
              </button>
            </>
          )}
          {status === 'awaiting' && (
            <>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Trust Wallet's Send screen is open with the recipient (<b style={{ color: '#D4AF37' }}>{net.admin.slice(0, 10)}…{net.admin.slice(-6)}</b>) and amount filled in. Confirm the send there, then come back — your balance is added automatically. A small amount of {net.nativeSymbol} is needed for the network fee.
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={async () => openWalletLink(await trustSendLinkFor())}
                  className="flex items-center gap-2 px-4 h-11 rounded-[14px] font-bold transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}>
                  <Smartphone className="w-4 h-4" /> Open Trust Wallet
                </button>
                <button onClick={() => { setStatus('idle'); setErrMsg(''); }}
                  className="flex items-center gap-2 px-4 h-11 rounded-[14px] font-bold transition-all active:scale-95"
                  style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.75)' }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* WalletConnect QR */}
      {status === 'connecting' && wcUri && (
        <div className="dash-card p-5 flex flex-col items-center gap-3" style={{ background: '#fff', border: '1px solid rgba(212,175,55,0.4)' }}>
          <QRCodeSVG value={wcUri} size={208} level="M" />
          <p className="text-sm font-bold" style={{ color: '#1a1a1a' }}>Scan this QR with the Trust app</p>
          <p className="text-[11px]" style={{ color: '#888' }}>Trust Wallet app → Settings → WalletConnect</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={openTrustApp}
              className="flex items-center gap-2 px-4 h-11 rounded-[14px] font-bold transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}>
              <Smartphone className="w-4 h-4" /> Open Wallet
            </button>
            <button onClick={() => { setStatus('idle'); setErrMsg(''); setWcUri(''); }}
              className="flex items-center gap-2 px-4 h-11 rounded-[14px] font-bold transition-all active:scale-95"
              style={{ border: '1px solid rgba(0,0,0,0.15)', background: 'rgba(0,0,0,0.04)', color: '#555' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Idle action buttons */}
      {status === 'idle' && (
        <div className="flex flex-col gap-2.5">
          <button onClick={connectAndPay}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-[16px] font-extrabold transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', boxShadow: '0 6px 20px rgba(59,130,246,0.4)' }}>
            <Smartphone className="w-5 h-5" /> Open in Trust Wallet App (Auto Pay)
          </button>
          <button onClick={connectMobile}
            className="dash-btn-gold w-full flex items-center justify-center gap-2 h-14 rounded-[16px] text-[15px]">
            <Wallet className="w-5 h-5" /> Connect via QR Scan
          </button>
          <button onClick={connectInjected}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-[16px] font-bold transition-all active:scale-[0.98]"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#fff' }}>
            <Chrome className="w-5 h-5" style={{ color: '#D4AF37' }} /> Browser Extension
          </button>
        </div>
      )}

      {/* Connected — send */}
      {status === 'connected' && (
        <button onClick={deposit} disabled={payAsset === 'native' && !price}
          className="w-full flex items-center justify-center gap-2 h-14 rounded-[16px] font-extrabold transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#06281f', boxShadow: '0 6px 20px rgba(52,211,153,0.4)' }}>
          {payAsset === 'native' && !price ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Loading {net.nativeSymbol} price…</>
          ) : (
            <><ArrowRight className="w-5 h-5" /> Send {payAsset === 'native' ? `${coinAmt.toFixed(5)} ${net.nativeSymbol}` : `$${amount.toFixed(2)} USDT`} from wallet</>
          )}
        </button>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-[14px] text-[13px]"
          style={{ border: '1px solid rgba(244,63,94,0.35)', background: 'rgba(244,63,94,0.1)', color: '#fca5a5' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{errMsg}</span>
        </div>
      )}

      {/* Done */}
      {status === 'done' && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-[14px] text-sm font-bold"
          style={{ border: '1px solid rgba(52,211,153,0.4)', background: 'rgba(52,211,153,0.12)', color: '#6ee7b7' }}>
          <CheckCircle2 className="w-5 h-5" /> Deposit successful!
        </div>
      )}

    </div>
  );
}