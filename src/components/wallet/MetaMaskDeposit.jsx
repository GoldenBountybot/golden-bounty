import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';
import { Wallet, Loader2, CheckCircle2, AlertTriangle, ChevronLeft, ArrowRight, ChevronDown, LogOut, Smartphone, Copy, X } from 'lucide-react';
import { useAppKitAccount, useAppKitProvider, useAppKitNetwork, useWalletInfo } from '@reown/appkit/react';
import { appKit, networkByChainId, restoreAllNetworks, noteConnectAttempt, restrictToSelectedNetwork } from '@/lib/appKit';
import { openWalletLink } from '@/lib/openWalletLink';
import { USDT_NETWORKS } from '@/lib/usdtNetworks';
import { hasTelegramBackButton } from '@/lib/telegram';
import { getCryptoPrices } from '@/lib/cryptoPrices';
import { reloadBalance } from '@/lib/useCasinoBalance';

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
const isMobile = () => /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '');

// ERC-20 Transfer event topic — used to watch the chain for the deposit.
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
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
// recipient and amount pre-filled (UAI asset format: c<slip44>_t<contract>).
const TRUST_ASSET_COIN = { bsc: '20000714', eth: '60', polygon: '966' };
// Trust's Universal Asset ID format: c<slip44>_t<TICKER> for native coins and
// c<slip44>_t<TICKER>-<contract> for tokens. A bare contract is NOT a valid
// asset id — Trust then silently drops the WHOLE prefill (asset, recipient,
// amount) and opens an empty Send screen.
const TRUST_NATIVE_TICKER = { bsc: 'BNB', eth: 'ETH' };
const buildTrustSendLink = (net, amt, isNative) => {
  const ticker = isNative ? TRUST_NATIVE_TICKER[net.key] : 'USDT';
  return 'https://link.trustwallet.com/send?asset=c' + TRUST_ASSET_COIN[net.key] + '_t' + ticker +
    (isNative ? '' : '-' + String(net.usdt).toLowerCase()) +
    '&address=' + net.admin + '&amount=' + encodeURIComponent(String(amt));
};

export default function MetaMaskDeposit({ amount, onBack, onDone }) {
  const { setBalance } = useCasinoBalance();
  const { toast } = useToast();
  const [netKey, setNetKey] = useState(USDT_NETWORKS[0].key);
  const [netOpen, setNetOpen] = useState(false);
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState('idle'); // idle|connecting|connected|sending|confirming|verifying|done|error
  const [errMsg, setErrMsg] = useState('');
  const [payAsset, setPayAsset] = useState('usdt'); // 'usdt' | 'native'
  const [price, setPrice] = useState(0);
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const { chainId, switchNetwork } = useAppKitNetwork();
  const { walletInfo } = useWalletInfo('eip155');
  const providerRef = useRef(null);
  const accountRef = useRef(null);
  const lastBlockRef = useRef(null); // last block scanned while watching the chain
  const pollStartedRef = useRef(0);
  // Single-open lock: a double-tap on Connect must never stack duplicate
  // AppKit modals / connect requests.
  const openModalRef = useRef(false);
  const autoPayRef = useRef(false);
  // Fires the payment request exactly once per connection — covers both a
  // fresh Connect tap (autoPayRef) AND a session AppKit restores on mount
  // (returning player, already connected from a previous visit), so the
  // player never has to tap an extra "Send" button after approving connect.
  const autoFiredRef = useRef(false);
  // Live wallet chain: AppKit chainId state mirrored into a ref so async flows
  // (deposit) always read the CURRENT chain instead of a stale closure value.
  const chainIdRef = useRef(chainId);
  useEffect(() => { chainIdRef.current = chainId; }, [chainId]);
  const net = USDT_NETWORKS.find((n) => n.key === netKey) || USDT_NETWORKS[0];
  const nativeSupported = net.key === 'bsc' || net.key === 'eth';
  const nativeKey = net.key === 'bsc' ? 'bnb' : 'eth';
  const coinAmt = price ? amount / price : 0;
  const isTrustWallet = /trust/i.test(walletInfo?.name || '') || !!window.trustwallet;

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
      await new Promise((rr) => setTimeout(rr, 1200));
    }
    return null;
  };

  // AppKit keeps the connection state — mirror it into our local refs so the
  // existing deposit logic keeps working untouched.
  useEffect(() => {
    if (isConnected && address) {
      providerRef.current = walletProvider || null;
      accountRef.current = address;
      setAccount(address);
      setStatus((s) => (s === 'idle' || s === 'connecting' || s === 'error' ? 'connected' : s));
      // AppKit can publish isConnected/address before its EIP-1193 provider
      // is ready. Do not consume the once-per-connection guard in that window;
      // the effect runs again when walletProvider arrives and then sends the
      // actual payment request to the same wallet session.
      if (walletProvider && (autoPayRef.current || !autoFiredRef.current)) {
        autoPayRef.current = false;
        autoFiredRef.current = true;
        setTimeout(() => deposit(), 250);
      }
    } else {
      providerRef.current = null;
      accountRef.current = null;
      setAccount(null);
      setStatus((s) => (s === 'connected' ? 'idle' : s));
    }
  }, [isConnected, address, walletProvider]);

  // The connection usually settles only after the user comes back from the
  // wallet — and AppKit's connect modal then stays open over the deposit
  // screen, looking like nothing happened. Close it as soon as we're connected
  // so the deposit UI (and the switch / payment requests) take over.
  useEffect(() => {
    if (isConnected) {
      try { appKit.close(); } catch {}
    }
  }, [isConnected]);

  // Polygon has no native option here — fall back to USDT if it was selected.
  useEffect(() => { if (!nativeSupported && payAsset === 'native') setPayAsset('usdt'); }, [netKey, nativeSupported]);

  // Load the live coin price whenever the native option / network changes so
  // the amount shown (and sent) is never 0.
  useEffect(() => {
    if (!nativeSupported) { setPrice(0); return; }
    let alive = true;
    (async () => {
      const p = (await getCryptoPrices())[nativeKey] || 0;
      if (alive) setPrice(p);
    })();
    return () => { alive = false; };
  }, [nativeKey, nativeSupported]);

  // Keep the wallet on the selected deposit network.
  useEffect(() => {
    if (isConnected && chainId != null && Number(chainId) !== net.chainId) {
      try { switchNetwork(networkByChainId(net.chainId)); } catch {}
    }
  }, [netKey, isConnected]);

  const openConnectModal = async () => {
    // One modal / one connect request at a time — extra taps while one is
    // already opening are ignored instead of stacking duplicate requests.
    if (openModalRef.current) return;
    openModalRef.current = true;
    setErrMsg('');
    try {
      console.log('[gb-wc] Connect tapped — recording attempt, opening AppKit once');
      // Only the network the user picked on this screen may go into the
      // connect request. Without this, the proposal asks the wallet to
      // approve BSC + Ethereum + Polygon all at once, and the deposit then
      // rides on whichever chain the wallet happened to pick.
      restrictToSelectedNetwork(net.chainId);
      noteConnectAttempt();
      autoPayRef.current = true;
      await appKit.open();
    } catch (error) {
      console.error('[gb-wc] Wallet connection error:', error);
      setErrMsg('Unable to open wallet connection. Please try again.');
      setStatus((s) => (s === 'idle' ? 'error' : s));
    } finally {
      openModalRef.current = false;
    }
  };

  const disconnectWallet = async () => {
    try { await appKit.disconnect(); } catch {}
    restoreAllNetworks();
    autoFiredRef.current = false;
    setErrMsg('');
    setStatus('idle');
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
      setTimeout(() => onDone?.(), 500);
    } else {
      const reason = res?.data?.reason || 'unknown';
      setErrMsg(reason === 'pending' ? 'Transaction is still pending — please try again shortly.' : `Verification failed: ${reason}`);
      setStatus('error');
    }
  };

  // Some mobile wallets (Trust) render a USDT contract call as a scary
  // "0 BNB to contract" fraud warning. Instead: open Trust's own Send screen
  // pre-filled (deep link) — or let the player send manually from any wallet —
  // and watch the chain for the transfer, crediting automatically.
  const startAwaiting = async (openTrust) => {
    setStatus('sending'); setErrMsg('');
    try {
      const bn = await rpcCall(net.rpc, 'eth_blockNumber', []);
      lastBlockRef.current = bn ? parseInt(bn, 16) - 2 : null;
      pollStartedRef.current = Date.now();
    } catch {}
    if (openTrust) {
      if (payAsset === 'native') {
        // The link must carry the COIN amount, not the USD figure.
        const pr = price || (await getCryptoPrices())[nativeKey] || 0;
        openWalletLink(buildTrustSendLink(net, pr ? amount / pr : amount, true));
      } else {
        openWalletLink(buildTrustSendLink(net, amount));
      }
    }
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
        topics: [TRANSFER_TOPIC, pad32(acct), pad32(net.admin)],
      }]);
      lastBlockRef.current = to;
      if (logs && logs.length) return logs[0];
    }
    return null;
  };

  // While the player sends from their wallet, poll the chain for the USDT
  // transfer and credit the balance automatically once it lands.
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
    const id = setInterval(tick, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, [status, netKey, amount, payAsset]);

  const deposit = async () => {
    // Inside Trust Wallet's own browser Trust injects a native EIP-1193
    // provider (window.trustwallet). Sending over the WalletConnect loopback
    // session there fails with code 5201 ("Unknown method(s) requested"), so
    // always prefer the injected provider whenever it exists.
    const trustInjected = window.trustwallet || (window.ethereum?.isTrust ? window.ethereum : null);
    const p = trustInjected || providerRef.current;
    const acct = accountRef.current;
    if (!p || !acct) return;
    // Only fall back to Trust's Send deep link when connected to Trust over
    // WalletConnect (no injected provider). Trust rejects WC session requests
    // with code 5201 ("Unknown method(s) requested") — for USDT AND native
    // coin sends alike. Inside Trust's own browser the injected provider
    // exists, so send directly there instead.
    if (isMobile() && isTrustWallet && !trustInjected) {
      await startAwaiting(true);
      return;
    }
    setStatus('sending'); setErrMsg('');
    // Make sure the wallet is actually on the selected network BEFORE asking for
    // the payment — otherwise a BNB deposit is presented to the user as an ETH
    // request (wallet still on Ethereum), which looks like a scam.
        try {
      // NEVER ask the wallet for eth_chainId over WalletConnect: that method is
      // not part of the proposed session methods, so the wallet answers
      // "unknown method" and every WC deposit dies at this step. AppKit already
      // tracks the wallet's active chain (updated on each chainChanged event) —
      // read that live state via chainIdRef instead.
      const chainNum = (v) => { const s = String(v == null ? '' : v); return /^0x/i.test(s) ? parseInt(s, 16) : parseInt(s, 10); };
      const onChain = () => chainNum(chainIdRef.current) === net.chainId;
      if (!onChain()) {
        try {
          await p.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + net.chainId.toString(16) }],
          });
        } catch (swErr) {
          // 4902 = the chain isn't in the wallet yet → ask permission to add it,
          // then switch to it.
          if (swErr?.code === 4902 || /unrecognized chain/i.test(swErr?.message || '')) {
            try {
              await p.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x' + net.chainId.toString(16),
                  chainName: net.label,
                  nativeCurrency: { name: net.nativeName, symbol: net.nativeSymbol, decimals: 18 },
                  rpcUrls: [net.rpc],
                  blockExplorerUrls: [net.explorer],
                }],
              });
            } catch {}
          }
          try { await switchNetwork(networkByChainId(net.chainId)); } catch {}
        }
        // Wait for the wallet's chainChanged event to reach AppKit's state.
        for (let i = 0; i < 20 && !onChain(); i++) {
          await new Promise((r) => setTimeout(r, 200));
        }
        if (!onChain()) {
          setErrMsg(`Please switch your wallet to ${net.label} and try again.`);
          setStatus('error');
          return;
        }
      }
    } catch {
      setErrMsg(`Could not verify the wallet network. Switch to ${net.label} in your wallet and try again.`);
      setStatus('error');
      return;
    }
    // AppKit dispatches the request and foregrounds the wallet itself (via
    // Telegram's openLink inside the Mini App), so we just await the response.
    const sendTx = (txParams) =>
      p.request({ method: 'eth_sendTransaction', params: [txParams] });
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
      // No eth_estimateGas here: the relay often never answers it, so awaiting
      // it silently hangs the flow and the wallet never receives the
      // transaction. The wallet estimates gas itself.
      const txHash = await sendTx({ from: acct, to, data, value: '0x0' });
      setStatus('confirming');
      const receipt = await fetchReceipt(txHash);
      if (!receipt) { setErrMsg('Confirmation not yet received, please try again shortly.'); setStatus('error'); return; }
      if (receipt.status !== '0x1') { setErrMsg('Transaction failed (reverted).'); setStatus('error'); return; }
      await finishVerify('verifyEvmDeposit', { txHash, amount, userWallet: acct, network: net.key }, amount);
    } catch (e) {
      console.error('MetaMaskDeposit send error:', e);
      const msg = e?.message || e?.code || (typeof e === 'string' ? e : 'cancelled/failed');
      // Some mobile wallets (Trust and others) connected over WalletConnect
      // reject direct transaction requests with code 5201 ("Unknown
      // method(s) requested") — and on this path walletInfo doesn't always
      // identify the wallet up front. Don't dead-end the deposit: fall back
      // to the manual send flow, which watches the chain and credits the
      // deposit automatically either way. Only open Trust's own pre-filled
      // Send deep link when the connected wallet is actually confirmed to be
      // Trust — forcing that link on a different wallet (e.g. MetaMask)
      // would send the player to an app they never opened.
      const raw = String(e?.code ?? '') + ' ' + String(msg);
      if (/5201/.test(raw) || /unknown method/i.test(raw)) {
        await startAwaiting(isTrustWallet);
        return;
      }
      setErrMsg('Transaction cancelled/failed: ' + msg);
      setStatus('error');
    }
  };

  const busy = ['connecting', 'sending', 'awaiting', 'confirming', 'verifying'].includes(status);
  const statusText = {
    connecting: 'Connecting to MetaMask…',
    sending: 'Sending transaction request to wallet…',
    awaiting: 'Watching the blockchain for your transfer…',
    confirming: 'Waiting for blockchain confirmation…',
    verifying: 'Verifying and adding balance…',
  }[status];
  const netLocked = busy || status === 'connected';

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: SANS, animation: 'dashFadeIn 350ms ease both' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        {!hasTelegramBackButton() && (
          <button onClick={onBack}
            className="flex items-center gap-1.5 px-4 h-10 rounded-[14px] font-bold transition-all active:scale-95"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        <h1 className="text-base font-extrabold" style={{ color: '#F6851A' }}>MetaMask Deposit</h1>
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
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: sel ? 'rgba(246,133,26,0.10)' : 'transparent' }}
                  >
                    <span className="text-sm" style={{ fontFamily: 'var(--font-western)', color: sel ? '#F6851A' : '#fff', letterSpacing: '0.02em' }}>{n.label}</span>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${sel ? '#F6851A' : 'rgba(255,255,255,0.4)'}` }}>
                      {sel && <span className="w-2 h-2 rounded-full" style={{ background: '#F6851A' }} />}
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
        style={{ background: 'linear-gradient(135deg, rgba(246,133,26,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(246,133,26,0.4)', boxShadow: '0 0 24px rgba(246,133,26,0.16), 0 8px 24px rgba(0,0,0,0.5)' }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(246,133,26,0.85)' }}>Depositing</p>
          <p className="text-3xl font-extrabold tabular-nums mt-0.5" style={{ color: '#fff' }}>${amount.toFixed(2)}</p>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{payAsset === 'native' ? `≈ ${coinAmt.toFixed(5)} ${net.nativeSymbol} (Native)` : `${net.short} (BEP20/ERC20)`}</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #F6851A, #E2761B)', boxShadow: '0 0 18px rgba(246,133,26,0.5)' }}>
          <Wallet className="w-6 h-6" style={{ color: '#fff' }} />
        </div>
      </div>

      {/* Connected account */}
      {account && (
        <div className="dash-card px-4 py-2.5 flex items-center justify-between gap-2"
          style={{ border: '1px solid rgba(246,133,26,0.25)' }}>
          <span className="text-[12px] font-mono break-all" style={{ color: 'rgba(255,255,255,0.85)' }}>✓ Connected: {account}</span>
          {!busy && (
            <button
              onClick={disconnectWallet}
              className="shrink-0 flex items-center gap-1 px-3 h-8 rounded-[12px] text-[11px] font-bold transition-all active:scale-95"
              style={{ border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.12)', color: '#fca5a5' }}
            >
              <LogOut className="w-3.5 h-3.5" /> Disconnect
            </button>
          )}
        </div>
      )}

      {/* Busy status */}
      {busy && (
        <div className="dash-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F6851A' }}>
            <Loader2 className="w-4 h-4 animate-spin" /> {statusText}
          </div>
          {status === 'sending' && (
            <>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Seeing "<b style={{ color: '#F6851A' }}>0 {net.nativeSymbol}</b>" in the wallet is normal — USDT transfers carry 0 native coin; the actual {amount.toFixed(2)} USDT goes inside the contract call. However, your wallet needs a <b style={{ color: '#F6851A' }}>small amount of {net.nativeSymbol} ($0.05–0.20)</b> for gas — otherwise it will show "Insufficient {net.nativeSymbol} balance".
              </p>
            </>
          )}
          {status === 'awaiting' && (
            <>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Send{' '}
                {payAsset === 'native'
                  ? <b style={{ color: '#F6851A' }}>{coinAmt ? coinAmt.toFixed(5) : '≈'} {net.nativeSymbol} (≈ ${amount.toFixed(2)})</b>
                  : <b style={{ color: '#F6851A' }}>${amount.toFixed(2)} USDT</b>}{' '}
                on <b>{net.label}</b> to:
              </p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-[12px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(246,133,26,0.3)' }}>
                <span className="text-[12px] font-mono break-all flex-1" style={{ color: '#fff' }}>{net.admin}</span>
                <button onClick={() => { try { navigator.clipboard.writeText(net.admin); toast({ title: 'Address copied' }); } catch {} }}
                  className="shrink-0 flex items-center gap-1 px-2.5 h-8 rounded-[10px] text-[11px] font-bold"
                  style={{ background: 'rgba(246,133,26,0.15)', color: '#F6851A', border: '1px solid rgba(246,133,26,0.35)' }}>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
              {isMobile() && isTrustWallet && (
                <button onClick={() => openWalletLink(buildTrustSendLink(net, amount))}
                  className="self-start flex items-center gap-2 px-4 h-11 rounded-[14px] font-bold transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}>
                  <Smartphone className="w-4 h-4" /> Open Trust Wallet (pre-filled)
                </button>
              )}
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Checking automatically — once your transfer lands on-chain, your balance is added. A small amount of {net.nativeSymbol} is needed for the network fee.
              </p>
              <button onClick={() => { setStatus('connected'); setErrMsg(''); }}
                className="self-start flex items-center gap-2 px-4 h-10 rounded-[14px] font-bold transition-all active:scale-95"
                style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.75)' }}>
                <X className="w-4 h-4" /> Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* Idle — one reliable connect button (Reown AppKit modal handles
          MetaMask / Trust / QR / extension, and works in Telegram's webview) */}
      {(status === 'idle' || (status === 'error' && !account)) && (
        <button onClick={openConnectModal}
          className="dash-btn-gold w-full flex items-center justify-center gap-2 h-14 rounded-[16px] text-[15px]">
          <Wallet className="w-5 h-5" /> Connect Wallet
        </button>
      )}



      {/* USDT explainer — wallets show a token transfer as a contract call with
          "0 {native}", which players misread as being charged in BNB/ETH. */}
      {payAsset === 'usdt' && (status === 'connected' || status === 'error') && (
        <div className="px-4 py-3 rounded-[14px] text-[12.5px]"
          style={{ border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.08)', color: 'rgba(255,255,255,0.8)' }}>
          Your wallet will show this as a <b style={{ color: '#F6851A' }}>contract interaction with 0 {net.nativeSymbol}</b> — that is
          normal for USDT. The {amount.toFixed(2)} USDT amount is inside the token transfer, and only a few cents of {net.nativeSymbol} is used as gas.
        </div>
      )}

      {/* Connected — send */}
      {(status === 'connected' || (status === 'error' && account)) && (
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
      {status === 'connected' && (
        <button onClick={() => startAwaiting(false)}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-[14px] text-[13px] font-bold transition-all active:scale-95"
          style={{ border: '1px solid rgba(246,133,26,0.3)', background: 'rgba(246,133,26,0.06)', color: '#F6851A' }}>
          <AlertTriangle className="w-4 h-4" /> Wallet showing an error? Send manually & auto-verify
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
