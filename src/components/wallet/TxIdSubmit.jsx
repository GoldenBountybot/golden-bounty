import React, { useState } from 'react';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Send, Loader2, Check } from 'lucide-react';

// Manual deposit flow — after sending USDT/crypto to a listed address, the
// player pastes their transaction ID so an admin can verify and credit it.
export default function TxIdSubmit({ amount, method, networks }) {
  const { toast } = useToast();
  const [network, setNetwork] = useState(networks[0]?.name || '');
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

  return (
    <WesternFrame variant="glass" className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Send className="w-4 h-4 text-amber-300" />
        <p className="text-sm font-black italic text-amber-200" style={W}>Already sent? Submit Transaction ID</p>
      </div>
      {done ? (
        <div className="flex items-center gap-2 py-1 text-emerald-300 text-sm italic" style={W}>
          <Check className="w-4 h-4" /> Transaction ID received — pending verification.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest text-amber-300/70 uppercase" style={W}>Network / Coin</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full rounded-md px-2 py-2 text-sm italic outline-none"
              style={{ border: '1px solid rgba(190,140,55,0.6)', background: 'rgba(20,13,6,0.9)', color: '#ffe6a8', ...W }}
            >
              {networks.map((n) => (
                <option key={n.name} value={n.name} style={{ color: '#1a1206' }}>{n.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] tracking-widest text-amber-300/70 uppercase" style={W}>Transaction ID / Hash</label>
            <input
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              placeholder="Paste your tx hash / transaction ID"
              className="w-full rounded-md px-3 py-2 text-xs font-mono outline-none"
              style={{ border: '1px solid rgba(190,140,55,0.6)', background: 'rgba(20,13,6,0.9)', color: '#ffe6a8' }}
            />
          </div>
          <button
            onClick={submit}
            disabled={submitting || !txid.trim()}
            className="w-full py-2.5 rounded-md text-sm font-black italic disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(to bottom, #f5c542, #c8881e)', border: '1px solid rgba(245,210,120,0.9)', color: '#2a1a06', ...W }}
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4" /> Submit Transaction ID</>}
          </button>
          <p className="text-[10px] text-amber-100/50 italic text-center" style={W}>Balance credited once the transfer is verified by admin.</p>
        </>
      )}
    </WesternFrame>
  );
}