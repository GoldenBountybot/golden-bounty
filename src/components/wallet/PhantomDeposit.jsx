import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet, Loader2, CheckCircle2, AlertTriangle, ChevronLeft, ArrowRight, Smartphone, Chrome, ChevronDown, LogOut, ExternalLink } from 'lucide-react';
import { USDT_NETWORKS } from '@/lib/usdtNetworks';
import { getCryptoPrices } from '@/lib/cryptoPrices';
import { addWagerRequirement } from '@/lib/useCasinoBalance';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";
const PHANTOM_PURPLE = '#AB9FF2';

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

function getPhantomProvider() {
  if (typeof window === 'undefined') return null;
  // Phantom injects window.phantom.ethereum for EVM chains
  if (window.phantom?.ethereum) return window.phantom.ethereum;
  return null;
}

export default function PhantomDeposit({ amount, onBack, onDone }) {
  const { setBalance } = useCasinoBalance();
  const { toast } = useToast();
  const [netKey, setNetKey] = useState(USDT_NETWORKS[0].key);
  const [netOpen, setNetOpen] = useState(false);
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState('idle'); // idle|connecting|connected|sending|confirming|verifying|done|error
  const [errMsg, setErrMsg] = useState('');
  const [payAsset, setPayAsset] = useState('usdt');
  const [price, setPrice] = useState(0);
  const providerRef = useRef(null);
  const accountRef = useRef(null);
  const net = USDT_NETWORKS.find((n) => n.key === netKey) || USDT_NETWORKS[0];
  const nativeSupported = net.key === 'bsc' || net.key === 'eth';
  const nativeKey = net.key === 'bsc' ? 'bnb' : 'eth';
  const coinAmt = price ? amount / price : 0;

  // Deep-link to open the current page inside Phantom's in-app browser (mobile)
  const phantomBrowseUrl = 'https://phantom.app/ul/v1/browse/' + encodeURIComponent(window.location.href);

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

  const openPhantomApp = () => {
    try { window.open(phantomBrowseUrl, '_blank'); } catch {}
  };

  useEffect(() => { if (!nativeSupported && payAsset === 'native') setPayAsset('usdt'); }, [netKey]);
  useEffect(() => {
    if (payAsset === 'native' && nativeSupported) {
      getCryptoPrices().then((p) => setPrice(p[nativeKey] || 0)).catch(() => {});
    }
  }, [payAsset, netKey]);

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

  // Connect via Phantom's injected EVM provider (browser extension or in-app browser)
  const connect = async () => {
    const p = getPhantomProvider();
    if (!p) {
      setErrMsg('Phantom wallet not found. Install the Phantom extension or open this page in the Phantom app.');
      setStatus('error');
      return;
    }
    setStatus('connecting'); setErrMsg('');
    try {
      const accts = await p.request({ method: 'eth_requestAccounts' });
      await ensureChain(p);
      providerRef.current = p;
      accountRef.current = accts[0];
      setAccount(accts[0]);
      setStatus('connected');
    } catch (e) {
      const msg = e?.message || e?.code || (typeof e === 'string' ? e : 'cancelled');
      setErrMsg('Connection failed: ' + msg);
      setStatus('error');
    }
  };

  const finishVerify = async (fn, payload, amt) => {
    setStatus('verifying');
    const res = await base44.functions.invoke(fn, payload);
    if (res?.data?.ok) {
      if (!res.data.already) {
        const credited = Number(res.data.amount || amt);
        setBalance((b) => b + credited);
        addWagerRequirement(credited);
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
    try {
      await new Promise((r) => setTimeout(r, 800));

      if (payAsset === 'native') {
        const pr = price || (await getCryptoPrices())[nativeKey] || 0;
        if (!pr) { setErrMsg('Could not fetch coin price. Please try again.'); setStatus('error'); return; }
        const wei = BigInt(Math.round((amount / pr) * 1e18));
        const value = '0x' + wei.toString(16);
        const txHash = await p.request({ method: 'eth_sendTransaction', params: [{ from: acct, to: net.admin, value }] });
        setStatus('confirming');
        const receipt = await fetchReceipt(txHash);
        if (!receipt) { setErrMsg('Confirmation not yet received, please try again shortly.'); setStatus('error'); return; }
        if (receipt.status !== '0x1') { setErrMsg('Transaction failed (reverted).'); setStatus('error'); return; }
        await finishVerify('verifyEvmNativeDeposit', { txHash, amount, userWallet: acct, network: net.key, expectedWei: value }, amount);
        return;
      }

      const data = '0xa9059cbb' + pad32(net.admin).slice(2) + pad32(toHexAmount(amount, net.decimals)).slice(2);
      const to = net.usdt.toLowerCase();
      let gas = '0x' + (60000).toString(16);
      try {
        const est = await p.request({ method: 'eth_estimateGas', params: [{ from: acct, to, data, value: '0x0' }] });
        if (typeof est === 'string' && est.startsWith('0x')) gas = est;
      } catch {}
      const txHash = await p.request({
        method: 'eth_sendTransaction',
        params: [{ from: acct, to, data, value: '0x0', gas }],
      });
      setStatus('confirming');
      const receipt = await fetchReceipt(txHash);
      if (!receipt) { setErrMsg('Confirmation not yet received, please try again shortly.'); setStatus('error'); return; }
      if (receipt.status !== '0x1') { setErrMsg('Transaction failed (reverted).'); setStatus('error'); return; }
      await finishVerify('verifyEvmDeposit', { txHash, amount, userWallet: acct, network: net.key }, amount);
    } catch (e) {
      console.error('PhantomDeposit send error:', e);
      const msg = e?.message || e?.code || (typeof e === 'string' ? e : 'cancelled/failed');
      setErrMsg('Transaction cancelled/failed: ' + msg);
      setStatus('error');
    }
  };

  const disconnect = () => {
    providerRef.current = null;
    accountRef.current = null;
    setAccount(null);
    setErrMsg('');
    setStatus('idle');
  };

  const busy = ['connecting', 'sending', 'confirming', 'verifying'].includes(status);
  const statusText = {
    connecting: 'Connecting to Phantom…',
    sending: 'Sending transaction request to wallet…',
    confirming: 'Waiting for blockchain confirmation…',
    verifying: 'Verifying and adding balance…',
  }[status];
  const netLocked = busy || status === 'connected';
  const hasExtension = !!getPhantomProvider();

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: SANS, animation: 'dashFadeIn 350ms ease both' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="flex items-center gap-1.5 px-4 h-10 rounded-[14px] font-bold transition-all active:scale-95"
          style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-base font-extrabold" style={{ color: PHANTOM_PURPLE }}>Phantom Deposit</h1>
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
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: sel ? 'rgba(171,159,242,0.10)' : 'transparent' }}
                  >
                    <span className="text-sm" style={{ fontFamily: 'var(--font-western)', color: sel ? PHANTOM_PURPLE : '#fff', letterSpacing: '0.02em' }}>{n.label}</span>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${sel ? PHANTOM_PURPLE : 'rgba(255,255,255,0.4)'}` }}>
                      {sel && <span className="w-2 h-2 rounded-full" style={{ background: PHANTOM_PURPLE }} />}
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
        style={{ background: 'linear-gradient(135deg, rgba(171,159,242,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(171,159,242,0.4)', boxShadow: '0 0 24px rgba(171,159,242,0.16), 0 8px 24px rgba(0,0,0,0.5)' }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(171,159,242,0.85)' }}>Depositing</p>
          <p className="text-3xl font-extrabold tabular-nums mt-0.5" style={{ color: '#fff' }}>${amount.toFixed(2)}</p>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{payAsset === 'native' ? `≈ ${coinAmt.toFixed(5)} ${net.nativeSymbol} (Native)` : `${net.short} (BEP20/ERC20)`}</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #AB9FF2, #7B6FE8)', boxShadow: '0 0 18px rgba(171,159,242,0.5)' }}>
          <Wallet className="w-6 h-6" style={{ color: '#fff' }} />
        </div>
      </div>

      {/* Connected account */}
      {account && (
        <div className="dash-card px-4 py-2.5 flex items-center justify-between gap-2"
          style={{ border: '1px solid rgba(171,159,242,0.25)' }}>
          <span className="text-[12px] font-mono break-all" style={{ color: 'rgba(255,255,255,0.85)' }}>✓ Connected: {account}</span>
          {!busy && (
            <button onClick={disconnect}
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
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: PHANTOM_PURPLE }}>
            <Loader2 className="w-4 h-4 animate-spin" /> {statusText}
          </div>
          {status === 'sending' && (
            <>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Seeing "<b style={{ color: PHANTOM_PURPLE }}>0 {net.nativeSymbol}</b>" in the wallet is normal — USDT transfers carry 0 native coin; the actual {amount.toFixed(2)} USDT goes inside the contract call. However, your wallet needs a <b style={{ color: PHANTOM_PURPLE }}>small amount of {net.nativeSymbol} ($0.05–0.20)</b> for gas — otherwise it will show "Insufficient {net.nativeSymbol} balance".
              </p>
              {isMobile() && (
                <button onClick={openPhantomApp}
                  className="self-start flex items-center gap-2 px-4 h-11 rounded-[14px] font-bold transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #AB9FF2, #7B6FE8)', color: '#fff', boxShadow: '0 4px 14px rgba(171,159,242,0.35)' }}>
                  <Smartphone className="w-4 h-4" /> Open Phantom
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Idle action buttons */}
      {status === 'idle' && (
        <div className="flex flex-col gap-2.5">
          {hasExtension ? (
            <button onClick={connect}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-[16px] font-extrabold transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #AB9FF2, #7B6FE8)', color: '#fff', boxShadow: '0 6px 20px rgba(171,159,242,0.4)' }}>
              <Wallet className="w-5 h-5" /> Connect Phantom Wallet
            </button>
          ) : (
            <button onClick={openPhantomApp}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-[16px] font-extrabold transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #AB9FF2, #7B6FE8)', color: '#fff', boxShadow: '0 6px 20px rgba(171,159,242,0.4)' }}>
              <Smartphone className="w-5 h-5" /> Open in Phantom App
            </button>
          )}
          <button onClick={openPhantomApp}
            className="dash-btn-gold w-full flex items-center justify-center gap-2 h-14 rounded-[16px] text-[15px]">
            <ExternalLink className="w-5 h-5" /> Open in Phantom Browser
          </button>
          <a href="https://phantom.app/download" target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 h-12 rounded-[16px] font-bold transition-all active:scale-[0.98]"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#fff' }}>
            <Chrome className="w-5 h-5" style={{ color: PHANTOM_PURPLE }} /> Install Phantom Extension
          </a>
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