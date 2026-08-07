import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useCasinoBalance, addWagerRequirement } from '@/lib/useCasinoBalance';
import { useLanguage } from '@/lib/LanguageContext';
import { Send, Loader2, ShieldCheck, AlertTriangle, Clock, HelpCircle, ChevronDown } from 'lucide-react';

// Suggests where the user can find their transaction ID for a given network.
function explorerHint(name) {
  const s = String(name || '').toLowerCase();
  if (!s) return null;
  if (s.includes('btc') || s.includes('bitcoin')) return { url: 'blockstream.info / mempool.space', where: 'Transaction details → "TxID" (64-char hash)' };
  if (s.includes('eth') || s.includes('erc')) return { url: 'etherscan.io', where: 'Your transaction → "Transaction Hash" at the top' };
  if (s.includes('bnb') || s.includes('bep')) return { url: 'bscscan.com', where: 'Your transaction → "Transaction Hash" at the top' };
  if (s.includes('polygon') || s.includes('pol ')) return { url: 'polygonscan.com', where: 'Your transaction → "Transaction Hash" at the top' };
  if (s.includes('avax') || s.includes('avalanche')) return { url: 'snowtrace.io', where: 'Your transaction → "Transaction Hash" at the top' };
  if (s.includes('sol')) return { url: 'solscan.io / solana.fm', where: 'Transaction → "Signature" (long base58 string)' };
  if (s.includes('trx') || s.includes('tron') || s.includes('trc')) return { url: 'tronscan.org', where: 'Transaction → "Hash" at the top' };
  if (s.includes('ton')) return { url: 'tonviewer.com / tonscan.com', where: 'Transaction → "Transaction Hash / TxID"' };
  if (s.includes('apt')) return { url: 'aptoscan.com', where: 'Transaction → "Transaction Hash" at the top' };
  if (s.includes('ltc') || s.includes('lite')) return { url: 'blockchair.com/litecoin', where: 'Transaction → "Transaction ID"' };
  if (s.includes('doge')) return { url: 'blockchair.com/dogecoin', where: 'Transaction → "Transaction ID"' };
  return null;
}

// Map a network display name to a verifyManualDeposit dispatch key.
// Returns null for chains not yet auto-verifiable (falls back to manual admin review).
function dispatchKeyFor(name) {
  const s = String(name || '').toLowerCase();
  if (!s) return null;
  const isUsdt = s.includes('usdt');
  const isUsdc = s.includes('usdc');
  if (s.includes('btc') || s.includes('bitcoin')) return 'btc';
  if (s.includes('bnb') || s.includes('bep')) return isUsdt ? 'bsc_usdt' : 'bsc_native';
  if (s.includes('eth') || s.includes('erc')) return isUsdt ? 'eth_usdt' : isUsdc ? 'eth_usdc' : 'eth_native';
  if (s.includes('sol')) return isUsdt ? 'sol_usdt' : isUsdc ? 'sol_usdc' : 'sol_native';
  if (s.includes('avax') || s.includes('avalanche')) return isUsdt ? 'avax_usdt' : isUsdc ? 'avax_usdc' : 'avax_native';
  if (s.includes('polygon') || s.includes('matic') || (s.includes('pol') && !s.includes('polka'))) {
    return isUsdt ? 'polygon_usdt' : isUsdc ? 'polygon_usdc' : 'polygon_native';
  }
  if (s.includes('trx') || s.includes('tron') || s.includes('trc')) return isUsdt ? 'trx_usdt' : 'trx_native';
  if (s.includes('ton')) return isUsdt ? 'ton_usdt' : 'ton_native';
  if (s.includes('ltc') || s.includes('lite')) return 'ltc';
  if (s.includes('doge')) return 'doge';
  if (s.includes('apt')) return isUsdt ? 'apt_usdt' : isUsdc ? 'apt_usdc' : 'apt_native';
  // DOT (Polkadot) + APT USDT/USDC — not yet auto-verifiable.
  return null;
}

const REASON_TEXT = {
  'pending': 'Transaction not confirmed on-chain yet. Wait ~1 minute and submit again.',
  'tx-failed': 'This transaction failed on-chain. Check it in your wallet and try a valid one.',
  'recipient-not-found': 'This transaction does not send funds to our deposit address.',
  'transfer-not-found': 'No matching transfer to our address found in this transaction.',
  'amount-mismatch': 'The transferred amount does not match your selected deposit amount.',
  'price-unavailable': 'Could not fetch the live price to verify the amount. Please retry shortly.',
  'unsupported-network': 'This network is not auto-verifiable yet.',
};

// Inline per-network form — rendered under each deposit address card. The
// network is implicit from the card it sits on, so no separate selector.
export default function TxIdRow({ amount, method, network }) {
  const { toast } = useToast();
  const { setBalance } = useCasinoBalance();
  const { t } = useLanguage();
  const [txid, setTxid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState(null); // 'verifying' | 'credited' | 'failed' | 'manual'
  const [failReason, setFailReason] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const hint = explorerHint(network);

  const dispatchKey = dispatchKeyFor(network);

  const credit = (amt) => {
    setBalance((b) => b + amt);
    addWagerRequirement(amt);
  };

  // Fallback: create a pending Transaction for manual admin review.
  const submitManual = async () => {
    const id = txid.trim();
    if (!id) { toast({ title: 'Enter your transaction ID' }); return; }
    setSubmitting(true);
    try {
      let user = { id: '', email: '' };
      try { user = await base44.auth.me(); } catch {}
      await base44.entities.Transaction.create({
        user_id: user.id || '',
        user_email: user.email || '',
        type: 'deposit',
        amount,
        status: 'pending',
        method,
        reference: id,
        note: network ? `Manual ${method.toUpperCase()} deposit — ${network}` : `Manual ${method.toUpperCase()} deposit`,
      });
      setDone(true);
      setStatus('manual');
      toast({ title: 'Submitted for review', description: 'Pending verification — balance credited once confirmed.' });
    } catch (e) {
      toast({ title: 'Submission failed', description: e?.message || 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    const id = txid.trim();
    if (!id) { toast({ title: 'Enter your transaction ID' }); return; }
    // Unsupported network → manual admin review flow.
    if (!dispatchKey) { return submitManual(); }
    setSubmitting(true);
    setStatus('verifying');
    setFailReason('');
    try {
      const res = await base44.functions.invoke('verifyManualDeposit', { network: dispatchKey, txHash: id, amount });
      const ok = res?.data?.ok;
      if (ok) {
        if (!res.data.already) credit(Number(res.data.amount || amount));
        setStatus('credited');
        setDone(true);
        toast({ title: 'Deposit verified & credited', description: `$${Number(res.data.amount || amount).toFixed(2)} added to your balance.` });
      } else {
        const reason = String(res?.data?.reason || 'unknown');
        setStatus('failed');
        setFailReason(reason);
        toast({ title: 'Verification pending', description: REASON_TEXT[reason] || reason });
      }
    } catch (e) {
      setStatus('failed');
      setFailReason('server-error');
      toast({ title: 'Verification failed', description: e?.message || 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold" style={{
        color: status === 'credited' ? '#34d399' : '#fb923c',
      }}>
        {status === 'credited'
          ? <><ShieldCheck className="w-3.5 h-3.5" /> Verified — ${amount.toFixed(2)} credited to your balance.</>
          : <><Clock className="w-3.5 h-3.5" /> TxID received — pending admin verification.</>}
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          value={txid}
          onChange={(e) => setTxid(e.target.value)}
          placeholder="Paste transaction ID / hash"
          className="dash-input flex-1 min-w-0 px-3.5 h-10 text-[12px] font-mono"
        />
        <button
          onClick={submit}
          disabled={submitting || !txid.trim()}
          className="dash-btn-gold shrink-0 px-4 h-10 text-[12px] flex items-center gap-1.5"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Verify</>}
        </button>
      </div>
      {hint && (
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => setShowHelp(s => !s)}
            className="flex items-center gap-1.5 text-[11px] font-semibold w-fit"
            style={{ color: '#D4AF37' }}
          >
            <HelpCircle className="w-3.5 h-3.5" /> {t('How to find your TxID?')}
            <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ transform: showHelp ? 'rotate(180deg)' : 'none' }} />
          </button>
          {showHelp && (
            <div className="rounded-[12px] px-3 py-2.5 flex flex-col gap-1" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(212,175,55,0.2)', animation: 'dashFadeIn 200ms ease both' }}>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span style={{ color: '#D4AF37', fontWeight: 700 }}>1.</span> {t('Open your wallet app → Activity / History → tap the transaction you just sent.')}
              </p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span style={{ color: '#D4AF37', fontWeight: 700 }}>2.</span> {t('Copy the Transaction ID / Hash. You can also find it on')} <span style={{ color: '#D4AF37', fontWeight: 600 }}>{hint.url}</span>.
              </p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span style={{ color: '#D4AF37', fontWeight: 700 }}>3.</span> {hint.where}.
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {t('Paste it above and tap Verify — we confirm it on-chain, then credit your balance.')}
              </p>
            </div>
          )}
        </div>
      )}
      {status === 'verifying' && (
        <p className="text-[11px] flex items-center gap-1.5" style={{ color: '#D4AF37' }}>
          <Loader2 className="w-3 h-3 animate-spin" /> Checking on-chain…
        </p>
      )}
      {status === 'failed' && (
        <div className="flex items-start gap-1.5 text-[11px]" style={{ color: '#fca5a5' }}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{REASON_TEXT[failReason] || failReason}</span>
        </div>
      )}
      {dispatchKey && status === null && (
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Paste your tx hash — we verify it on-chain and credit your balance automatically.
        </p>
      )}
      {!dispatchKey && status === null && (
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Paste your tx hash — it will be submitted for manual verification.
        </p>
      )}
    </div>
  );
}