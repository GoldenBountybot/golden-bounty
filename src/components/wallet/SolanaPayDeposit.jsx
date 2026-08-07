import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { reloadBalance } from '@/lib/useCasinoBalance';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet, Loader2, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink, QrCode } from 'lucide-react';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";
const PHANTOM_PURPLE = '#AB9FF2';
const PHANTOM_LOGO = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/1a373c31c_file_00000000bf088207bca808f6fa5670a3.png';
const ADMIN_SOL = 'ftmbTXAc6XWyT6ieXHLiEZ7zuJFDPVSAdvrvrTveniW';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export default function SolanaPayDeposit({ amount, onDone }) {
  const { toast } = useToast();
  const [requestId, setRequestId] = useState(null);
  const [payUnits, setPayUnits] = useState(0);
  const [status, setStatus] = useState('preparing'); // preparing|waiting|confirming|done|error
  const [errMsg, setErrMsg] = useState('');
  const pollRef = useRef(null);

  // Unique pay amount: base USDC units + random microcents so each request is
  // uniquely identifiable on-chain by its exact transfer amount.
  const payUsd = payUnits / 1e6;
  const solanaPayUrl = `solana:${ADMIN_SOL}?amount=${payUsd.toFixed(6)}&spl-token=${USDC_MINT}`;

  // Create the deposit request on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const units = Math.round(amount * 1e6) + Math.floor(Math.random() * 9999) + 1;
        const me = await base44.auth.me();
        const rec = await base44.entities.SolanaDepositRequest.create({
          user_id: me?.id,
          amount,
          pay_units: units,
          user_email: me?.email || '',
        });
        if (cancelled) return;
        setRequestId(rec.id);
        setPayUnits(units);
        setStatus('waiting');
      } catch (e) {
        if (cancelled) return;
        setErrMsg('Could not start deposit: ' + (e?.message || e));
        setStatus('error');
      }
    })();
    return () => { cancelled = true; if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll the backend for confirmation once we have a request id.
  useEffect(() => {
    if (!requestId || status !== 'waiting') return;
    let stopped = false;
    const poll = async () => {
      try {
        const res = await base44.functions.invoke('pollSolanaPayDeposits', { request_id: requestId });
        if (stopped) return;
        if (res?.data?.ok) {
          const mine = (res.data.completed || []).find((c) => c.request_id === requestId);
          if (mine) {
            setStatus('confirming');
            await reloadBalance();
            setStatus('done');
            toast({ title: 'Deposit successful', description: `$${Number(mine.amount).toFixed(2)} has been added to your balance.` });
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            setTimeout(() => onDone?.(), 1400);
          }
        }
      } catch {}
    };
    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => { stopped = true; if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, status]);

  const openInPhantom = () => {
    // On mobile, the solana: scheme opens the Phantom app (or whatever Solana
    // Pay wallet is installed) with the pre-filled transfer. On desktop, the
    // user scans the QR with their phone instead.
    window.location.href = solanaPayUrl;
  };

  const busy = status === 'confirming';

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: SANS, animation: 'dashFadeIn 350ms ease both' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 overflow-hidden" style={{ background: '#7868e6', boxShadow: '0 0 0 1.5px rgba(171,159,242,0.4)' }}>
          <img src={PHANTOM_LOGO} alt="Phantom" className="w-7 h-7 object-contain" />
        </div>
        <h1 className="text-base font-extrabold" style={{ color: PHANTOM_PURPLE }}>Phantom · Solana Pay</h1>
      </div>

      {/* Deposit amount card */}
      <div className="dash-card p-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(171,159,242,0.10), rgba(20,241,149,0.06), rgba(255,255,255,0.03))', border: '1px solid rgba(171,159,242,0.4)', boxShadow: '0 0 24px rgba(171,159,242,0.16), 0 8px 24px rgba(0,0,0,0.5)' }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(171,159,242,0.85)' }}>Depositing</p>
          <p className="text-3xl font-extrabold tabular-nums mt-0.5" style={{ color: '#fff' }}>${amount.toFixed(2)}</p>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>USDC (SPL) · Solana Network</p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #AB9FF2, #14f195)', boxShadow: '0 0 18px rgba(171,159,242,0.5)' }}>
          <Wallet className="w-6 h-6" style={{ color: '#fff' }} />
        </div>
      </div>

      {/* QR + actions */}
      {(status === 'waiting' || status === 'confirming') && payUnits > 0 && (
        <>
          <div className="dash-card p-5 flex flex-col items-center gap-3" style={{ border: '1px solid rgba(171,159,242,0.3)' }}>
            <div className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: PHANTOM_PURPLE }}>
              <QrCode className="w-4 h-4" /> Scan with Phantom to pay
            </div>
            <div className="rounded-2xl p-3" style={{ background: '#fff', boxShadow: '0 0 18px rgba(171,159,242,0.35)' }}>
              <QRCodeSVG value={solanaPayUrl} size={184} level="M" includeMargin={false} />
            </div>
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.5)' }}>Send exactly</p>
              <p className="text-lg font-extrabold tabular-nums" style={{ color: '#14f195' }}>{payUsd.toFixed(6)} USDC</p>
              <p className="text-[10px] mt-0.5 font-mono break-all" style={{ color: 'rgba(255,255,255,0.35)' }}>→ {ADMIN_SOL.slice(0, 6)}…{ADMIN_SOL.slice(-6)}</p>
            </div>
          </div>

          <button onClick={openInPhantom}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-[16px] font-extrabold transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #AB9FF2, #7B6FE8)', color: '#fff', boxShadow: '0 6px 20px rgba(171,159,242,0.4)' }}>
            <ArrowRight className="w-5 h-5" /> Open in Phantom
          </button>

          <div className="dash-card p-4 flex items-center gap-2.5" style={{ border: '1px solid rgba(171,159,242,0.25)' }}>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: PHANTOM_PURPLE }} />
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Waiting for your payment on the Solana network… This page confirms automatically the moment your transfer lands. Keep it open.
            </p>
          </div>

          <a href="https://phantom.app/download" target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 h-12 rounded-[16px] font-bold transition-all active:scale-[0.98]"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#fff' }}>
            <ExternalLink className="w-5 h-5" style={{ color: PHANTOM_PURPLE }} /> Install Phantom
          </a>
        </>
      )}

      {/* Preparing */}
      {status === 'preparing' && (
        <div className="dash-card p-5 flex items-center justify-center gap-2" style={{ border: '1px solid rgba(171,159,242,0.3)' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: PHANTOM_PURPLE }} />
          <span className="text-sm font-semibold" style={{ color: PHANTOM_PURPLE }}>Preparing your deposit…</span>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-[14px] text-[13px]"
            style={{ border: '1px solid rgba(244,63,94,0.35)', background: 'rgba(244,63,94,0.1)', color: '#fca5a5' }}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{errMsg}</span>
          </div>
          <button onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-[16px] font-bold transition-all active:scale-[0.98]"
            style={{ border: '1px solid rgba(171,159,242,0.4)', background: 'rgba(171,159,242,0.10)', color: PHANTOM_PURPLE }}>
            <Wallet className="w-5 h-5" /> Try Again
          </button>
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