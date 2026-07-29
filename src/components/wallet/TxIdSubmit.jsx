import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Send, Loader2, Check } from 'lucide-react';

// Inline per-network form — rendered under each deposit address card. The
// network is implicit from the card it sits on, so no separate selector.
export default function TxIdRow({ amount, method, network }) {
  const { toast } = useToast();
  const [txid, setTxid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
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
      toast({ title: 'Transaction ID submitted', description: 'Pending verification — balance credited once confirmed.' });
    } catch (e) {
      toast({ title: 'Submission failed', description: e?.message || 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-1.5 mt-1 text-[12px] font-semibold" style={{ color: '#34d399' }}>
        <Check className="w-3.5 h-3.5" /> TxID received — pending verification.
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
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
        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Submit</>}
      </button>
    </div>
  );
}