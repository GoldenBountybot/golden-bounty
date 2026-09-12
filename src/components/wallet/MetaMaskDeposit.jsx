import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';
import { Wallet, Loader2, CheckCircle2, AlertTriangle, ChevronLeft, ArrowRight, ChevronDown, LogOut, Smartphone, Copy, X } from 'lucide-react';
import { useAppKitAccount, useAppKitProvider, useWalletInfo } from '@reown/appkit/react';
import { appKit, restrictToSelectedNetwork, restoreAllNetworks } from '@/lib/appKit';
import { openWalletLink } from '@/lib/openWalletLink';
import { USDT_NETWORKS } from '@/lib/usdtNetworks';
import { hasTelegramBackButton } from '@/lib/telegram';
import { getCryptoPrices } from '@/lib/cryptoPrices';
import { reloadBalance } from '@/lib/useCasinoBalance';

// Cross-reload marker for a wallet connect attempt that was handed off to
// MetaMask but whose "session settled" event never made it back to this page
// (Telegram suspends or reloads the webview while the wallet is foregrounded).
const CONNECT_RESUME_KEY = 'gb.mmConnectResume';

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
const buildTrustSendLink = (net, amt) =>
  'https://link.trustwallet.com/send?asset=c' + TRUST_ASSET_COIN[net.key] + '_t' + net.usdt +
  '&address=' + net.admin + '&amount=' + encodeURIComponent(String(amt));

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
  const { walletInfo } = useWalletInfo('eip155');
  const providerRef = useRef(null);
  const accountRef = useRef(null);
  const lastBlockRef = useRef(null); // last block scanned while watching the chain
  const pollStartedRef = useRef(0);
  const netSyncRef = useRef(false); // sync the wallet to the app-selected network once per connection
  const netSyncRunRef = useRef(null); // a single in-flight network sync — no duplicate switch requests
  const sendingRef = useRef(false); // one in-flight payment request — never duplicate
  const statusRef = useRef('idle'); // latest status for the return-from-wallet recovery
  const connectRef = useRef(null); // latest openConnectModal, re-bound every render
  const autoRetriedRef = useRef(0); // cap on automatic reconnect attempts after returning
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
      await new Promise((rr) => setTimeout(rr, 2000));
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
      autoRetriedRef.current = 0; // a settled connect resets the auto-retry budget
      try { localStorage.removeItem(CONNECT_RESUME_KEY); } catch {}
      setStatus((s) => (s === 'idle' || s === 'connecting' || s === 'error' ? 'connected' : s));
      // Right after connecting, sync the wallet to the network selected in the
      // app: if it is already there nothing is asked; if it is on another
      // chain, ONE switch request is sent (adding the chain first if the
      // wallet doesn't have it). Connection and payment stay separate — this
      // only syncs the network; the Send Payment button sends the payment.
      if (!netSyncRef.current && walletProvider) {
        netSyncRef.current = true;
        (async () => { try { await ensureNetwork(); } catch {} })();
      }
    } else {
      providerRef.current = null;
      accountRef.current = null;
      setAccount(null);
      netSyncRef.current = false;
      autoRetriedRef.current = 0; // disconnected — next connect starts with a fresh retry budget
      setStatus((s) => (s === 'connected' ? 'idle' : s));
    }
  }, [isConnected, address, walletProvider]);

  // If the wallet modal is closed without connecting (rejected or cancelled),
  // return to idle so the Connect button becomes usable again — a cancelled
  // request must never leave the flow stuck on "connecting…".
  useEffect(() => {
    try {
      const unsub = appKit.subscribeEvents?.((e) => {
        if (e?.data?.event === 'MODAL_CLOSE') {
          setStatus((s) => (s === 'connecting' ? 'idle' : s));
        }
      });
      return unsub;
    } catch { return undefined; }
  }, []);

  // While connected, surface a wallet-side network change immediately. Send
  // Payment re-syncs the network automatically before the transaction — this
  // only warns the player, so a wrong-chain transfer is never a surprise.
  useEffect(() => {
    if (!isConnected || !walletProvider) return;
    const onChainChanged = () => {
      if (netSyncRunRef.current) return; // our own switch in flight — not a user action
      try {
        toast({ title: 'Wallet network changed', description: `Send Payment will switch your wallet back to ${net.label} before sending.` });
      } catch {}
    };
    try { walletProvider.on?.('chainChanged', onChainChanged); } catch {}
    return () => { try { walletProvider.off?.('chainChanged', onChainChanged); } catch {} };
  }, [isConnected, walletProvider, net.label]);

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

  const openConnectModal = async () => {
    if (status === 'connecting') return; // one connection request at a time
    setErrMsg('');
    setStatus('connecting'); // disables the button while the request is pending
    // Only the network the user selected may be part of the connect request.
    restrictToSelectedNetwork(net.chainId);
    try {
      let priorAttempts = 0;
      try { priorAttempts = (JSON.parse(localStorage.getItem(CONNECT_RESUME_KEY) || 'null') || {}).attempts || 0; } catch {}
      localStorage.setItem(CONNECT_RESUME_KEY, JSON.stringify({ chainId: net.chainId, attempts: priorAttempts, ts: Date.now() }));
    } catch {}
    await appKit.open();
  };

  // Latest status/connect closures for the visibility recovery below — re-bound
  // after every render so the recovery always runs fresh code.
  useEffect(() => {
    statusRef.current = status;
    connectRef.current = openConnectModal;
  });

  // Resume a connect attempt that was handed off to the wallet but never
  // settled back into this page: the wallet side already approved, yet the
  // deposit screen sits idle on the Connect button. When the page is visible
  // again and still not connected, restart the connect automatically — the
  // fresh pairing makes the wallet re-show its approval prompt right away,
  // and the moment the session settles the Send button with the amount
  // appears. Capped at three automatic resumes within three minutes.
  const resumePendingConnect = () => {
    if (!isMobile() || statusRef.current !== 'idle') return false;
    let pending = null;
    try { pending = JSON.parse(localStorage.getItem(CONNECT_RESUME_KEY) || 'null'); } catch {}
    if (!pending || Date.now() - (pending.ts || 0) > 180000 || (pending.attempts || 0) >= 3) {
      try { localStorage.removeItem(CONNECT_RESUME_KEY); } catch {}
      return false;
    }
    try { localStorage.setItem(CONNECT_RESUME_KEY, JSON.stringify({ ...pending, attempts: (pending.attempts || 0) + 1, ts: Date.now() })); } catch {}
    connectRef.current?.();
    return true;
  };

  // After a webview reload (Telegram sometimes destroys the page while the
  // wallet is foregrounded), give a persisted session two and a half seconds
  // to restore — if the connection is still missing by then, resume it.
  useEffect(() => {
    const id = setTimeout(() => { resumePendingConnect(); }, 2500);
    return () => clearTimeout(id);
  }, []);

  // Returning from MetaMask: Telegram suspends this webview while the wallet
  // is in the foreground, so the WalletConnect "session settled" event often
  // never reaches the page — MetaMask says connected, but the deposit screen
  // stays stuck on "connecting…" and the Send button with the amount never
  // shows. When the player comes back: give a settle that arrived just then a
  // moment to be processed (the mirror effect flips to 'connected', the Send
  // button appears and nothing else happens); if no settle ever landed, start
  // a fresh connect attempt automatically — the pairing reset in appKit.js
  // guarantees a brand-new pairing, so the wallet shows its approval prompt
  // again right away, and the moment one settles the Send button appears.
  // Capped at two automatic attempts; after that fall back to the Connect
  // button with a hint instead of looping forever.
  useEffect(() => {
    if (!isMobile()) return undefined;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      // Returned while idle but a recent connect never settled — resume it.
      if (statusRef.current === 'idle') {
        setTimeout(() => { resumePendingConnect(); }, 2000);
        return;
      }
      if (statusRef.current !== 'connecting') return;
      setTimeout(() => {
        if (statusRef.current !== 'connecting') return; // the settle landed
        if (autoRetriedRef.current >= 2) {
          setStatus('idle');
          try { toast({ title: 'Connection not received', description: 'Please tap Connect Wallet again.' }); } catch {}
          return;
        }
        autoRetriedRef.current += 1;
        setStatus('idle'); // release the one-at-a-time guard for the retry
        try { appKit.close(); } catch {}
        setTimeout(() => {
          if (statusRef.current !== 'idle') return; // settled while we waited
          connectRef.current?.();
        }, 400);
      }, 2000);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const disconnectWallet = async () => {
    try { await appKit.disconnect(); } catch {}
    restoreAllNetworks();
    try { localStorage.removeItem(CONNECT_RESUME_KEY); } catch {}
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
      setTimeout(() => onDone?.(), 1200);
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
    if (openTrust) openWalletLink(buildTrustSendLink(net, amount));
    setStatus('awaiting');
  };

  const checkForDeposit = async () => {
    const acct = accountRef.current;
    if (!acct || lastBlockRef.current == null) return null;
    const latestHex = await rpcCall(net.rpc, 'eth_blockNumber', []);
    if (!latestHex) return null;
    const latest = parseInt(latestHex, 16);
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
          await finishVerify('verifyEvmDeposit', { txHash: log.transactionHash, amount, userWallet: accountRef.current, network: net.key }, amount);
        }
      } finally { running = false; }
    };
    tick();
    const id = setInterval(tick, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [status, netKey, amount, payAsset]);

  // Ask the wallet for its REAL current chain — AppKit's chainId only mirrors
  // AppKit's own selected network, not the chain the wallet is actually on,
  // so it can't be trusted here. If the wallet is elsewhere, switch it to the
  // network the user selected on the deposit screen (adding the chain first if
  // the wallet doesn't have it yet), then wait for the switch to actually land
  // before sending anything: the payment request always targets the network
  // the user picked in the app.
  // Official app-open links: hand the phone over to a BACKGROUND wallet so it
  // can act on a pending request (network switch / payment approval). Only
  // links from the wallets themselves (WalletConnect registry / proven
  // universal links) are mapped — Coinbase shows its own OS notification and
  // falls back to the toast nudge instead of a dead link.
  const walletHome = () => {
    const wName = walletInfo?.name || '';
    if (isTrustWallet || /trust/i.test(wName)) return 'https://link.trustwallet.com/';
    if (/metamask/i.test(wName)) return 'https://metamask.app.link/';
    if (/binance wallet/i.test(wName)) return 'https://app.binance.com/cedefi';
    if (/my wallet/i.test(wName)) return 'https://my.tt/wc/';
    return null;
  };

  const runNetworkSync = async () => {
    const p = providerRef.current;
    if (!p) return false;
    const wantHex = '0x' + net.chainId.toString(16);
    const realChain = async () => {
      try { return await p.request({ method: 'eth_chainId' }); } catch { return null; }
    };
    let cur = await realChain();
    if (cur && parseInt(cur, 16) === net.chainId) return true;
    // ONE switch request over the WalletConnect session — sending it both
    // through AppKit and the provider made the wallet show its network
    // approval sheet twice.
    const addChain = async () => {
      try {
        await p.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: wantHex,
            chainName: net.label,
            nativeCurrency: { name: net.nativeName, symbol: net.nativeSymbol, decimals: 18 },
            rpcUrls: [net.rpc],
            blockExplorerUrls: [net.explorer],
          }],
        });
        return true;
      } catch {
        return false;
      }
    };
    // A user rejecting in the wallet must fail FAST — silently polling for a
    // minute afterwards makes "Send Payment" look broken.
    const isRejection = (e) => e?.code === 4001 || /user rejected|rejected by user|user denied|request denied/i.test(e?.message || '');
    try {
      await p.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: wantHex }] });
    } catch (swErr) {
      if (isRejection(swErr)) return false;
      // 4902 = the chain isn't in the wallet yet → ask permission to add it,
      // then switch to it.
      if (swErr?.code === 4902 || /unrecognized chain/i.test(swErr?.message || '')) {
        if (!(await addChain())) return false;
      }
    }
    // A wallet that is already awake (browser extension) switches on its own —
    // give it a couple of seconds before doing anything drastic.
    for (let i = 0; i < 2; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      cur = await realChain();
      if (cur && parseInt(cur, 16) === net.chainId) return true;
    }
    // MetaMask Mobile is known to ACK wallet_switchEthereumChain over
    // WalletConnect without actually switching (reown-com/appkit#4766). If the
    // wallet's real chain still doesn't match, force the issue with
    // wallet_addEthereumChain: re-adding a chain the wallet already has opens
    // its native "add / switch network" sheet, which really does switch it.
    await addChain();
    // A mobile wallet in the Telegram Mini App sits in the BACKGROUND — the
    // switch request reaches it but it cannot act on the request (or show its
    // confirmation sheet) until the app is open. That is why the switch never
    // happened. Open the wallet now: MetaMask auto-confirms the switch to a
    // known chain (BSC/Ethereum/Polygon) as soon as it processes the request,
    // and the player returns to the app right after.
    // Hand the phone over to a background wallet so it can act on the
    // pending switch. Wallets we can't name rely on their own notification.
    const home = walletHome();
    if (home) openWalletLink(home);
    // Keep watching for the switch to land — the moment the player is back and
    // the chain matches, the payment request fires automatically on exactly
    // the network the user picked in the app.
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      cur = await realChain();
      if (cur && parseInt(cur, 16) === net.chainId) return true;
    }
    return false;
  };

  // One network sync at a time: if the connect-time sync is still in flight,
  // Send Payment shares it instead of firing a second, duplicate switch
  // request at the wallet.
  const ensureNetwork = () => {
    if (!netSyncRunRef.current) {
      netSyncRunRef.current = runNetworkSync().finally(() => { netSyncRunRef.current = null; });
    }
    return netSyncRunRef.current;
  };

  const runDeposit = async () => {
    const p = providerRef.current;
    const acct = accountRef.current;
    if (!p || !acct) {
      // The session dropped (or is still restoring) between the click and the
      // request — tell the player instead of silently doing nothing.
      try { toast({ title: 'Wallet not ready', description: 'Please try again in a moment.' }); } catch {}
      return;
    }
    if (payAsset === 'usdt' && isMobile() && isTrustWallet) {
      await startAwaiting(true);
      return;
    }
    setStatus('sending'); setErrMsg('');
    // Make sure the wallet is actually on the selected network BEFORE asking for
    // the payment — otherwise a BNB deposit is presented to the user as an ETH
    // request (wallet still on Ethereum), which looks like a scam.
    if (!(await ensureNetwork())) {
      setErrMsg(`Please switch your wallet to ${net.label} and try again.`);
      setStatus('error');
      return;
    }
    // A wallet sitting in the background cannot act on the request — the known
    // Telegram-webview behaviour. Queue the request, then hand the phone over
    // to the wallet app (the same handoff the network sync uses) so the
    // confirmation sheet actually opens.
    const home = walletHome();
    const sendTx = (txParams) => {
      const res = p.request({ method: 'eth_sendTransaction', params: [txParams] });
      if (home) openWalletLink(home);
      // If the handoff is blocked the request just sits unanswered — nudge
      // the player after a bit instead of spinning silently forever.
      let settled = false;
      res.then(() => { settled = true; }, () => { settled = true; });
      setTimeout(() => {
        if (!settled) {
          try { toast({ title: 'Waiting for your wallet', description: 'Open your wallet app to approve the payment.' }); } catch {}
        }
      }, 15000);
      return res;
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
      setErrMsg('Transaction cancelled/failed: ' + msg);
      setStatus('error');
    }
  };
  // Send Payment — fires the payment request directly from the button click;
  // the in-flight guard turns a double click into exactly one wallet request.
  const deposit = async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    try { await runDeposit(); } finally { sendingRef.current = false; }
  };

  const busy = ['connecting', 'sending', 'awaiting', 'confirming', 'verifying'].includes(status);
  const statusText = {
    connecting: 'Connecting to wallet…',
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
          <span className="text-[12px] font-mono break-all" style={{ color: 'rgba(255,255,255,0.85)' }}>✓ {walletInfo?.name || 'Wallet'}: {account}</span>
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
                Send <b style={{ color: '#F6851A' }}>${amount.toFixed(2)} USDT</b> on <b>{net.label}</b> to:
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
            <><ArrowRight className="w-5 h-5" /> Send Payment{payAsset === 'native' ? ` — ${coinAmt.toFixed(5)} ${net.nativeSymbol}` : ` — ${amount.toFixed(2)} USDT`}</>
          )}
        </button>
      )}
      {payAsset === 'usdt' && status === 'connected' && (
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