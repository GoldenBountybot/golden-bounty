import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet, Loader2, CheckCircle2, AlertTriangle, ChevronLeft, ArrowRight, Smartphone, Chrome, ChevronDown, LogOut } from 'lucide-react';
import { getMetaMaskSdk, disconnectMetaMask, onMetaMaskUri, getInjectedMetaMask, preloadMetaMask } from '@/lib/metaMaskSdk';
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
const isMobile = () => /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '');

export default function MetaMaskDeposit({ amount, onBack, onDone }) {
  const { setBalance } = useCasinoBalance();
  const { toast } = useToast();
  const [netKey, setNetKey] = useState(USDT_NETWORKS[0].key);
  const [netOpen, setNetOpen] = useState(false);
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState('idle'); // idle|connecting|connected|sending|confirming|verifying|done|error
  const [errMsg, setErrMsg] = useState('');
  const [qrUri, setQrUri] = useState('');
  const [payAsset, setPayAsset] = useState('usdt'); // 'usdt' | 'native'
  const [price, setPrice] = useState(0);
  const providerRef = useRef(null);
  const accountRef = useRef(null);
  const qrUriRef = useRef('');
  const net = USDT_NETWORKS.find((n) => n.key === netKey) || USDT_NETWORKS[0];
  const nativeSupported = net.key === 'bsc' || net.key === 'eth';
  const nativeKey = net.key === 'bsc' ? 'bnb' : 'eth';
  const coinAmt = price ? amount / price : 0;

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

  const openMetaMaskApp = () => {
    const uri = qrUriRef.current;
    if (uri) {
      openWalletLink('https://metamask.app.link/wc?uri=' + encodeURIComponent(uri));
      return;
    } else {
      openWalletForRequest(providerRef.current, 'https://metamask.app.link');
    }
  };

  // Warm the SDK up front so the connect request reaches MetaMask instantly.
  useEffect(() => { preloadMetaMask(); }, []);

  useEffect(() => { if (!nativeSupported && payAsset === 'native') setPayAsset('usdt'); }, [netKey]);
  useEffect(() => {
    if (payAsset === 'native' && nativeSupported) {
      getCryptoPrices().then((p) => setPrice(p[nativeKey] || 0)).catch(() => {});
    }
  }, [payAsset, netKey]);

  // Switch to the target chain (add it if missing)
  const ensureChain = async (provider) => {
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: net.chainIdHex }] });
    } catch (e) {
      if (e && (e.code === 4902 || e.code === -32603)) {
        await provider.request({
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
  };

  // Primary button — SDK auto-detects: mobile deep-link, desktop extension, or QR
  const connectMobile = async () => {
    setStatus('connecting'); setErrMsg(''); setQrUri('');
    const mobile = isMobile();
    onMetaMaskUri((uri) => {
      qrUriRef.current = uri;
      setQrUri(uri);
      // Hand the pairing link straight to the MetaMask app on mobile, so the
      // connection prompt appears without the user hunting for a button.
      if (mobile) openWalletLink('https://metamask.app.link/wc?uri=' + encodeURIComponent(uri));
    });
    try {
      const sdk = getMetaMaskSdk();
      await sdk.connect();
      const provider = sdk.getProvider();
      await ensureChain(provider);
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (!accounts || !accounts.length) throw new Error('No account returned');
      providerRef.current = provider;
      accountRef.current = accounts[0];
      setAccount(accounts[0]);
      // Consumed pairing URI — reusing it would open MetaMask on an expired
      // pairing, showing no pending request.
      qrUriRef.current = '';
      setQrUri('');
      await deposit();
    } catch (e) {
      console.error('MetaMask SDK connect error:', e);
      const msg = e?.message || e?.code || (typeof e === 'string' ? e : 'cancelled/failed');
      setErrMsg('Connection failed: ' + msg);
      setStatus('error'); setQrUri('');
    }
  };

  // QR scan button — SDK connect but we show our own QR code
  const connectQr = async () => {
    setStatus('connecting'); setErrMsg(''); setQrUri('');
    onMetaMaskUri((uri) => { qrUriRef.current = uri; setQrUri(uri); });
    try {
      const sdk = getMetaMaskSdk();
      await sdk.connect();
      const provider = sdk.getProvider();
      await ensureChain(provider);
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (!accounts || !accounts.length) throw new Error('No account returned');
      providerRef.current = provider;
      accountRef.current = accounts[0];
      setAccount(accounts[0]);
      qrUriRef.current = '';
      setQrUri('');
      setStatus('connected');
    } catch (e) {
      console.error('MetaMask QR connect error:', e);
      const msg = e?.message || e?.code || (typeof e === 'string' ? e : 'cancelled/failed');
      setErrMsg('Connection failed: ' + msg);
      setStatus('error'); setQrUri('');
    }
  };

  // Browser extension button — use injected MetaMask provider directly
  const connectInjected = async () => {
    const p = getInjectedMetaMask();
    if (!p) { setErrMsg('MetaMask extension not found. Use the QR scan or mobile app button.'); setStatus('error'); return; }
    setStatus('connecting'); setErrMsg(''); setQrUri('');
    try {
      const accts = await p.request({ method: 'eth_requestAccounts' });
      await ensureChain(p);
      providerRef.current = p;
      accountRef.current = accts[0];
      setAccount(accts[0]);
      setStatus('connected');
    } catch (e) {
      setErrMsg('Wallet connection was cancelled.'); setStatus('error');
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

  const deposit = async () => {
    const p = providerRef.current;
    const acct = accountRef.current;
    if (!p || !acct) return;
    setStatus('sending'); setErrMsg('');
    // Dispatch the request over the relay FIRST, then foreground the wallet —
    // opening MetaMask first backgrounds (and in the Telegram webview freezes)
    // this page, so the request never leaves and the wallet shows nothing.
    const sendTx = (txParams) => {
      const pending = p.request({ method: 'eth_sendTransaction', params: [txParams] });
      if (isMobile()) setTimeout(() => openWalletForRequest(p, 'https://metamask.app.link'), 300);
      return pending;
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

  const busy = ['connecting', 'sending', 'confirming', 'verifying'].includes(status);
  const statusText = {
    connecting: 'Connecting to MetaMask…',
    sending: 'Sending transaction request to wallet…',
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
              onClick={async () => {
                try { await disconnectMetaMask(); } catch {}
                providerRef.current = null;
                accountRef.current = null;
                qrUriRef.current = '';
                setAccount(null);
                setQrUri('');
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
      {busy && !qrUri && (
        <div className="dash-card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F6851A' }}>
            <Loader2 className="w-4 h-4 animate-spin" /> {statusText}
          </div>
          {status === 'connecting' && (
            <>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Waiting for the MetaMask app to open. If it didn't open automatically, tap the button below.
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={openMetaMaskApp}
                  className="flex items-center gap-2 px-4 h-11 rounded-[14px] font-bold transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #F6851A, #E2761B)', color: '#fff', boxShadow: '0 4px 14px rgba(246,133,26,0.35)' }}>
                  <Smartphone className="w-4 h-4" /> Open Wallet
                </button>
                <button onClick={() => { setStatus('idle'); setErrMsg(''); setQrUri(''); }}
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
                Seeing "<b style={{ color: '#F6851A' }}>0 {net.nativeSymbol}</b>" in the wallet is normal — USDT transfers carry 0 native coin; the actual {amount.toFixed(2)} USDT goes inside the contract call. However, your wallet needs a <b style={{ color: '#F6851A' }}>small amount of {net.nativeSymbol} ($0.05–0.20)</b> for gas — otherwise it will show "Insufficient {net.nativeSymbol} balance".
              </p>
              <button onClick={openMetaMaskApp}
                className="self-start flex items-center gap-2 px-4 h-11 rounded-[14px] font-bold transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #F6851A, #E2761B)', color: '#fff', boxShadow: '0 4px 14px rgba(246,133,26,0.35)' }}>
                <Smartphone className="w-4 h-4" /> Open MetaMask
              </button>
            </>
          )}
        </div>
      )}

      {/* QR code — shown when connecting via QR scan */}
      {status === 'connecting' && qrUri && (
        <div className="dash-card p-5 flex flex-col items-center gap-3" style={{ background: '#fff', border: '1px solid rgba(246,133,26,0.4)' }}>
          <QRCodeSVG value={qrUri} size={208} level="M" />
          <p className="text-sm font-bold" style={{ color: '#1a1a1a' }}>Scan this QR with the MetaMask app</p>
          <p className="text-[11px]" style={{ color: '#888' }}>MetaMask app → Scan QR Code</p>
          {isMobile() && (
            <button onClick={openMetaMaskApp}
              className="flex items-center gap-2 px-4 h-11 rounded-[14px] font-bold transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #F6851A, #E2761B)', color: '#fff', boxShadow: '0 4px 14px rgba(246,133,26,0.35)' }}>
              <Smartphone className="w-4 h-4" /> Open MetaMask App
            </button>
          )}
        </div>
      )}

      {/* Idle action buttons — 3 options like Trust Wallet */}
      {status === 'idle' && (
        <div className="flex flex-col gap-2.5">
          <button onClick={connectMobile}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-[16px] font-extrabold transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #F6851A, #E2761B)', color: '#fff', boxShadow: '0 6px 20px rgba(246,133,26,0.4)' }}>
            <Smartphone className="w-5 h-5" /> Open in MetaMask App (Auto Pay)
          </button>
          <button onClick={connectQr}
            className="dash-btn-gold w-full flex items-center justify-center gap-2 h-14 rounded-[16px] text-[15px]">
            <Wallet className="w-5 h-5" /> Connect via QR Scan
          </button>
          <button onClick={connectInjected}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-[16px] font-bold transition-all active:scale-[0.98]"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#fff' }}>
            <Chrome className="w-5 h-5" style={{ color: '#F6851A' }} /> Browser Extension
          </button>
        </div>
      )}

      {/* Connected — send */}
      {status === 'connected' && (
        <button onClick={deposit}
          className="w-full flex items-center justify-center gap-2 h-14 rounded-[16px] font-extrabold transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#06281f', boxShadow: '0 6px 20px rgba(52,211,153,0.4)' }}>
          <ArrowRight className="w-5 h-5" /> Send {payAsset === 'native' ? `${coinAmt.toFixed(5)} ${net.nativeSymbol}` : `$${amount.toFixed(2)} USDT`} from wallet
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