import React, { useState } from 'react';
import { Send, User, DollarSign, CheckCircle2 } from 'lucide-react';
import { agentOps, agentError } from '@/lib/agentApi';
import PlayerLookup from '@/components/agent/PlayerLookup';

// Admin / agent → player balance transfer. Lands as a deposit for the player.
export default function AgentTransferForm({ onDone }) {
  const [q, setQ] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [picked, setPicked] = useState(null);

  const send = async () => {
    setMsg(null);
    if (!q.trim()) { setMsg({ ok: false, text: 'Please enter the player\u2019s username or ID.' }); return; }
    const amt = Number(amount);
    if (!isFinite(amt) || amt <= 0) { setMsg({ ok: false, text: 'Please enter a valid transfer amount.' }); return; }
    setBusy(true);
    const res = await agentOps('transfer', { q: q.trim(), amount: amt });
    setBusy(false);
    if (!res.ok) { setMsg({ ok: false, text: agentError(res) }); return; }
    setMsg({ ok: true, text: `Transfer completed successfully. $${amt.toFixed(2)} has been credited to ${res.to?.username}'s account. Your remaining balance is $${Number(res.balance).toFixed(2)}.` });
    setQ(''); setAmount(''); setPicked(null);
    onDone?.();
  };

  return (
    <div className="dash-card p-4 flex flex-col gap-3">
      <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>Send Balance to Player</h3>
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 shrink-0" style={{ color: 'rgba(212,175,55,0.8)' }} />
        <input value={q} onChange={e => { setQ(e.target.value); setPicked(null); }} placeholder="Username, ID or email"
          className="dash-input flex-1 px-3 py-2.5 text-sm" />
      </div>
      <PlayerLookup query={q} picked={picked}
        onPick={(u) => { setPicked(u); setQ(u.uid || u.username || String(u.id)); }} />
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 shrink-0" style={{ color: 'rgba(212,175,55,0.8)' }} />
        <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal"
          placeholder="Amount" className="dash-input flex-1 px-3 py-2.5 text-sm tabular-nums" />
      </div>
      <button onClick={send} disabled={busy} className="dash-btn-gold w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
        <Send className="w-4 h-4" /> {busy ? 'Sending…' : 'Send as Deposit'}
      </button>
      {msg && (
        <p className="text-[12px] flex items-start gap-1.5" style={{ color: msg.ok ? '#34d399' : '#f87171' }}>
          {msg.ok && <CheckCircle2 className="w-4 h-4 shrink-0" />} {msg.text}
        </p>
      )}
    </div>
  );
}