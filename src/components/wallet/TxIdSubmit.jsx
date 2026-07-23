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

  const W = { fontFamily: 'Georgia, serif' };

  if (done) {
    return (
      <div className="flex items-center gap-1.5 mt-1 text-emerald-300 text-[11px] italic" style={W}>
        <Check className="w-3.5 h-3.5" /> TxID received — pending verification.
      </div>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-1.5">
      <input
        value={txid}
        onChange={(e) => setTxid(e.target.value)}
        placeholder="Paste transaction ID / hash"
        className="flex-1 min-w-0 rounded-md px-2 py-1.5 text-[11px] font-mono outline-none"
        style={{ border: '1px solid rgba(190,140,55,0.6)', background: 'rgba(20,13,6,0.9)', color: '#ffe6a8' }}
      />
      <button
        onClick={submit}
        disabled={submitting || !txid.trim()}
        className="shrink-0 px-2.5 py-1.5 rounded-md text-[11px] font-black italic disabled:opacity-50 active:scale-95 transition-transform flex items-center gap-1"
        style={{ background: 'linear-gradient(to bottom, #f5c542, #c8881e)', border: '1px solid rgba(245,210,120,0.9)', color: '#2a1a06', ...W }}
      >
        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Submit</>}
      </button>
    </div>
  );
}