import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { base44 } from '@/api/base44Client';
import { reloadBalance } from '@/lib/useCasinoBalance';
import { useLanguage } from '@/lib/LanguageContext';
import TxIdRow, { dispatchKeyFor } from '@/components/wallet/TxIdSubmit';
import { Loader2, Copy, Check, Clock, ShieldCheck, AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';

function CopyBtn({ text, label }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-3 h-9 rounded-[14px] text-xs font-bold transition-all active:scale-95 shrink-0"
      style={{ border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
      {copied ? <Check className="w-3.5 h-3.5" style={{ color: '#34d399' }} /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? t('Copied') : (label || t('Copy'))}
    </button>
  );
}

// Trim trailing zeros without losing the unique code digits (numeric value unchanged).
function fmtPay(payAmount, decimals) {
  const s = Number(payAmount).toFixed(Math.min(Number(decimals) || 4, 10));
  return s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

// Unique-amount manual deposit: creates a 20-minute deposit request with an
// exact amount (e.g. 10.0032 USDT), shows address + QR + countdown and polls
// the backend, which auto-detects the on-chain payment and credits — no TxID.
export default function ManualDepositSession({ amount, method, network, onBack }) {
  const { t } = useLanguage();
  const [req, setReq] = useState(null);
  const [phase, setPhase] = useState('creating'); // creating | waiting | completed | expired | fallback | error
  const [now, setNow] = useState(Date.now());
  const [checking, setChecking] = useState(false);
  const [showTx, setShowTx] = useState(false);
  const reqRef = useRef(null);
  const storeKey = `gb_mdr_${method}_${network.name}`;

  // Reuse a still-valid request that was saved before the user left the app
  // for their wallet, so the unique amount and countdown survive a webview
  // reload — a new amount is only requested when the old one is gone/expired.
  const restore = () => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storeKey) || 'null');
      if (saved && Number(saved.amount_usd) === Number(amount) && new Date(saved.expires_at).getTime() > Date.now()) return saved;
    } catch { /* private mode */ }
    return null;
  };

  const create = async () => {
    const saved = restore();
    if (saved) { reqRef.current = saved; setReq(saved); setPhase('waiting'); return; }
    setPhase('creating');
    const key = dispatchKeyFor(network.name) || dispatchKeyFor(network.network) || '';
    try {
      const res = await base44.functions.invoke('manualDepositCreate', {
        networkKey: key, networkLabel: network.name, address: network.address, method, amount,
      });
      if (res?.data?.ok) {
        const r = { ...res.data, amount_usd: amount };
        reqRef.current = r; setReq(r); setPhase('waiting');
        try { sessionStorage.setItem(storeKey, JSON.stringify(r)); } catch { /* private mode */ }
      }
      else if (res?.data?.reason === 'unsupported-network') setPhase('fallback');
      else setPhase('error');
    } catch { setPhase('error'); }
  };
  useEffect(() => { create(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const check = async () => {
    const r = reqRef.current;
    if (!r || checking) return;
    setChecking(true);
    try {
      const res = await base44.functions.invoke('manualDepositCheck', { id: r.id });
      const st = res?.data?.status;
      if (st === 'completed') {
        setPhase('completed'); reloadBalance();
        try { sessionStorage.removeItem(storeKey); } catch { /* private mode */ }
      } else if (st === 'expired') {
        setPhase('expired');
        try { sessionStorage.removeItem(storeKey); } catch { /* private mode */ }
      }
    } catch { /* transient — next poll retries */ } finally { setChecking(false); }
  };

  useEffect(() => {
    if (phase !== 'waiting') return;
    const iv = setInterval(check, 15000);
    const first = setTimeout(check, 4000);
    // Coming back from the wallet app — check right away instead of waiting.
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(iv); clearTimeout(first); document.removeEventListener('visibilitychange', onVisible); };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const msLeft = req ? Math.max(0, new Date(req.expires_at).getTime() - now) : 0;
  useEffect(() => {
    if (phase === 'waiting' && req && msLeft <= 0) {
      setPhase('expired');
      try { sessionStorage.removeItem(storeKey); } catch { /* private mode */ }
    }
  }, [msLeft, phase, req]);

  const mm = String(Math.floor(msLeft / 60000)).padStart(2, '0');
  const ss = String(Math.floor((msLeft % 60000) / 1000)).padStart(2, '0');
  const payStr = req ? fmtPay(req.pay_amount, req.decimals) : '';

  if (phase === 'creating') {
    return (
      <div className="dash-card p-6 flex flex-col items-center gap-3 text-center" style={{ animation: 'dashFadeIn 300ms ease both' }}>
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#D4AF37' }} />
        <p className="text-sm font-semibold" style={{ color: '#fff' }}>{t('Preparing your unique deposit amount…')}</p>
      </div>
    );
  }

  if (phase === 'completed') {
    return (
      <div className="dash-card p-6 flex flex-col items-center gap-3 text-center" style={{ animation: 'dashFadeIn 300ms ease both' }}>
        <ShieldCheck className="w-10 h-10" style={{ color: '#34d399' }} />
        <p className="text-base font-bold" style={{ color: '#fff' }}>{t('Payment detected!')}</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {t('{amount} has been credited to your balance.', { amount: `$${Number(amount).toFixed(2)}` })}
        </p>
        <Link to="/dashboard" className="dash-btn-gold px-6 py-2.5 text-sm">{t('Go to Dashboard')}</Link>
      </div>
    );
  }

  if (phase === 'expired') {
    return (
      <div className="dash-card p-6 flex flex-col items-center gap-3 text-center" style={{ animation: 'dashFadeIn 300ms ease both' }}>
        <Clock className="w-9 h-9" style={{ color: '#fb923c' }} />
        <p className="text-base font-bold" style={{ color: '#fff' }}>{t('Time expired')}</p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('The 20-minute window has ended. Get a new amount to continue — already sent? Verify below with your TxID.')}</p>
        <button onClick={create} className="dash-btn-gold px-6 py-2.5 text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4" /> {t('Get New Amount')}</button>
        <div className="w-full mt-2"><TxIdRow amount={amount} method={method} network={network.name} /></div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="dash-card p-6 flex flex-col items-center gap-3 text-center" style={{ animation: 'dashFadeIn 300ms ease both' }}>
        <AlertTriangle className="w-8 h-8" style={{ color: '#fb923c' }} />
        <p className="text-sm font-semibold" style={{ color: '#fff' }}>{t('Could not prepare the deposit. Please try again.')}</p>
        <button onClick={create} className="dash-btn-gold px-6 py-2.5 text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4" /> {t('Retry')}</button>
      </div>
    );
  }

  // waiting | fallback
  const isFallback = phase === 'fallback';
  return (
    <div className="flex flex-col gap-4" style={{ animation: 'dashFadeIn 300ms ease both' }}>
      <div className="dash-card p-5 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 w-full">
          {network.logo && (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shrink-0" style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.12)' }}>
              <img src={network.logo} alt="" className="w-7 h-7 object-contain" />
            </div>
          )}
          <p className="flex-1 text-sm font-bold" style={{ color: '#fff' }}>{network.name}</p>
          {!isFallback && (
            <div className="flex items-center gap-1.5 px-3 h-9 rounded-[14px] tabular-nums font-extrabold text-sm"
              style={{ border: '1px solid rgba(212,175,55,0.45)', background: 'rgba(212,175,55,0.10)', color: msLeft < 120000 ? '#fb923c' : '#D4AF37' }}>
              <Clock className="w-4 h-4" /> {mm}:{ss}
            </div>
          )}
        </div>

        {/* Real QR code of the deposit address */}
        <div className="p-3 rounded-2xl" style={{ background: '#fff', boxShadow: '0 0 24px rgba(212,175,55,0.25)' }}>
          <QRCodeCanvas value={network.address} size={176} level="M" />
        </div>

        {/* Exact amount to send */}
        {!isFallback && req && (
          <div className="w-full rounded-2xl p-4 flex flex-col items-center gap-2"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.14), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.5)' }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#D4AF37' }}>{t('Send Exactly this Amount')}</p>
            <p className="text-2xl font-extrabold tabular-nums" style={{ color: '#fff' }}>
              {payStr} <span style={{ color: '#D4AF37' }}>{req.coin}</span>
            </p>
            <CopyBtn text={payStr} label={t('Copy Amount')} />
            <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('This amount is unique to you — sending the exact amount lets us credit you automatically, no TxID needed.')}
            </p>
          </div>
        )}
        {isFallback && (
          <div className="w-full rounded-2xl p-3 flex items-center justify-between" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(212,175,55,0.85)' }}>{t('Amount')}</span>
            <span className="text-sm font-extrabold tabular-nums" style={{ color: '#fff' }}>${Number(amount).toFixed(2)}</span>
          </div>
        )}

        {/* Address + copy */}
        <div className="w-full flex items-center gap-2">
          <div className="flex-1 rounded-[14px] px-3 py-2.5 min-w-0" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(212,175,55,0.18)' }}>
            <p className="text-[12px] break-all font-mono" style={{ color: 'rgba(255,255,255,0.85)' }}>{network.address}</p>
          </div>
          <CopyBtn text={network.address} />
        </div>

        {!isFallback && (
          <>
            <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: '#D4AF37' }}>
              <Loader2 className="w-4 h-4 animate-spin" /> {t('Waiting for your payment — detected & credited automatically…')}
            </div>
            <button onClick={check} disabled={checking}
              className="dash-btn-gold w-full py-2.5 text-sm flex items-center justify-center gap-2">
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {t("I've sent it — Check now")}
            </button>
          </>
        )}
      </div>

      {/* TxID fallback */}
      <div className="dash-card p-4 flex flex-col gap-2">
        {isFallback ? (
          <>
            <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('Auto-detection is not available on this network — verify with your TxID after sending:')}</p>
            <TxIdRow amount={amount} method={method} network={network.name} />
          </>
        ) : (
          <>
            <button onClick={() => setShowTx(s => !s)} className="flex items-center gap-1.5 text-[12px] font-semibold w-fit" style={{ color: '#D4AF37' }}>
              {t('Problem with auto-detect? Verify by TxID')}
              <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ transform: showTx ? 'rotate(180deg)' : 'none' }} />
            </button>
            {showTx && <TxIdRow amount={amount} method={method} network={network.name} />}
          </>
        )}
      </div>
    </div>
  );
}