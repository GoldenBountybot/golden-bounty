import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance, addWagerRequirement } from '@/lib/useCasinoBalance';
import { useToast } from '@/components/ui/use-toast';
import { Wallet, Loader2, CheckCircle2, AlertTriangle, ChevronLeft, ArrowRight, Smartphone, Chrome, LogOut, ExternalLink } from 'lucide-react';
import { Connection, SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getCryptoPrices } from '@/lib/cryptoPrices';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";
const PHANTOM_PURPLE = '#AB9FF2';
const ADMIN_SOL = 'ftmbTXAc6XWyT6ieXHLiEZ7zuJFDPVSAdvrvrTveniW';
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const isMobile = () => /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '');

function getPhantomSolana() {
  if (typeof window === 'undefined') return null;
  if (window.phantom?.solana?.isPhantom) return window.phantom.solana;
  if (window.solana?.isPhantom) return window.solana;
  return null;
}

export default function PhantomSolanaDeposit({ amount, onBack, onDone }) {
  const { setBalance } = useCasinoBalance();
  const { toast } = useToast();
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState('idle'); // idle|connecting|connected|sending|confirming|verifying|done|error
  const [errMsg, setErrMsg] = useState('');
  const [price, setPrice] = useState(0);
  const providerRef = useRef(null);
  const accountRef = useRef(null);
  const solAmt = price ? amount / price : 0;
  const lamports = Math.round(solAmt * LAMPORTS_PER_SOL);

  const phantomBrowseUrl = 'https://phantom.app/ul/v1/browse/' + encodeURIComponent(window.location.href);

  useEffect(() => {
    getCryptoPrices().then((p) => setPrice(p.sol || 0)).catch(() => {});
  }, []);

  const openPhantomApp = () => { try { window.open(phantomBrowseUrl, '_blank'); } catch {} };

  const connect = async () => {
    const p = getPhantomSolana();
    if (!p) {
      setErrMsg('Phantom wallet not found. Install the Phantom extension or open this page in the Phantom app.');
      setStatus('error');
      return;
    }
    setStatus('connecting'); setErrMsg('');
    try {
      const resp = await p.connect();
      const pub = resp?.publicKey?.toString() || p.publicKey?.toString();
      providerRef.current = p;
      accountRef.current = pub;
      setAccount(pub);
      setStatus('connected');
    } catch (e) {
      const msg = e?.message || e?.code || (typeof e === 'string' ? e : 'cancelled');
      setErrMsg('Connection failed: ' + msg);
      setStatus('error');
    }
  };

  const disconnect = async () => {
    try { await providerRef.current?.disconnect?.(); } catch {}
    providerRef.current = null;
    accountRef.current = null;
    setAccount(null);
    setErrMsg('');
    setStatus('idle');
  };

  const finishVerify = async (signature, amt) => {
    setStatus('verifying');
    const res = await base44.functions.invoke('verifySolanaDeposit', {
      signature,
      amount: amt,
      userWallet: accountRef.current,
      expectedLamports: lamports,
    });
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
    const pub = accountRef.current;
    if (!p || !pub) return;
    if (!price) { setErrMsg('Could not fetch SOL price. Please try again.'); setStatus('error'); return; }
    setStatus('sending'); setErrMsg('');
    try {
      const connection = new Connection(SOLANA_RPC, 'confirmed');
      const fromPubkey = new PublicKey(pub);
      const toPubkey = new PublicKey(ADMIN_SOL);
      const ix = SystemProgram.transfer({ fromPubkey, toPubkey, lamports });
      const tx = new Transaction().add(ix);
      tx.feePayer = fromPubkey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      let signature;
      if (p.signAndSendTransaction) {
        const r = await p.signAndSendTransaction(tx);
        signature = typeof r === 'string' ? r : r?.signature;
      } else {
        const signed = await p.signTransaction(tx);
        const raw = signed.serialize();
        signature = await connection.sendRawTransaction(raw, { skipPreflight: false });
      }
      if (!signature) throw new Error('No signature returned');

      setStatus('confirming');
      for (let i = 0; i < 40; i++) {
        try {
          const s = await connection.getSignatureStatus(signature);
          const cs = s?.value?.confirmationStatus;
          if (cs === 'confirmed' || cs === 'finalized') break;
        } catch {}
        await new Promise((rr) => setTimeout(rr, 2000));
      }
      await finishVerify(signature, amount);
    } catch (e) {
      console.error('Phantom Solana deposit error:', e);
      const msg = e?.message || e?.code || (typeof e === 'string' ? e : 'cancelled/failed');
      setErrMsg('Transaction cancelled/failed: ' + msg);
      setStatus('error');
    }
  };

  const busy = ['connecting', 'sending', 'confirming', 'verifying'].includes(status);
  const statusText = {
    connecting: 'Connecting to Phantom…',
    sending: 'Sending transaction request to wallet…',
    confirming: 'Waiting for blockchain confirmation…',
    verifying: 'Verifying and adding balance…',
  }[status];
  const hasExtension = !!getPhantomSolana();

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: SANS, animation: 'dashFadeIn 350ms ease both' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="flex items-center gap-1.5 px-4 h-10 rounded-[14px] font-bold transition-all active:scale-95"
          style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-base font-extrabold" style={{ color: PHANTOM_PURPLE }}>Phantom · Solana Deposit</h1>
      </div>

      {/* Deposit amount card */}
      <div className="dash-card p-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(171,159,242,0.10), rgba(20,241,149,0.06), rgba(255,255,255,0.03))', border: '1px solid rgba(171,159,242,0.4)', boxShadow: '0 0 24px rgba(171,159,242,0.16), 0 8px 24px rgba(0,0,0,0.5)' }}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(171,159,242,0.85)' }}>Depositing</p>
          <p className="text-3xl font-extrabold tabular-nums mt-0.5" style={{ color: '#fff' }}>${amount.toFixed(2)}</p>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {price ? `≈ ${solAmt.toFixed(5)} SOL (Native)` : 'Fetching SOL price…'}
          </p>
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #AB9FF2, #14f195)', boxShadow: '0 0 18px rgba(171,159,242,0.5)' }}>
          <Wallet className="w-6 h-6" style={{ color: '#fff' }} />
        </div>
      </div>

      {/* Recipient note */}
      <div className="dash-card px-4 py-3 flex flex-col gap-1" style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.85)' }}>Recipient (Admin)</p>
        <p className="text-[12px] break-all font-mono" style={{ color: 'rgba(255,255,255,0.8)' }}>{ADMIN_SOL}</p>
      </div>

      {/* Connected account */}
      {account && (
        <div className="dash-card px-4 py-2.5 flex items-center justify-between gap-2" style={{ border: '1px solid rgba(171,159,242,0.25)' }}>
          <span className="text-[12px] font-mono break-all" style={{ color: 'rgba(255,255,255,0.85)' }}>✓ Connected: {account}</span>
          {!busy && (
            <button onClick={disconnect}
              className="shrink-0 flex items-center gap-1 px-3 h-8 rounded-[12px] text-[11px] font-bold transition-all active:scale-95"
              style={{ border: '1px solid rgba(244,63,94,0.4)', background: 'rgba(244,63,94,0.12)', color: '#fca5a5' }}>
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
                Confirm the <b style={{ color: PHANTOM_PURPLE }}>{solAmt.toFixed(5)} SOL</b> transfer in your Phantom wallet. A tiny amount of SOL is needed for the network fee (~$0.0001).
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
          <ArrowRight className="w-5 h-5" /> Send {solAmt.toFixed(5)} SOL from wallet
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