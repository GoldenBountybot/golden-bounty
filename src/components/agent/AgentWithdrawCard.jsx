import React, { useState, useEffect } from 'react';
import { Send, User, CheckCircle2 } from 'lucide-react';
import { agentOps, agentError } from '@/lib/agentApi';
import PayPinInput from '@/components/PayPinInput';
import AgentMatchCard from '@/components/agent/AgentMatchCard';
import PlayerLookup from '@/components/agent/PlayerLookup';
import { verifyPayPin } from '@/lib/payPin';
import { reloadBalance } from '@/lib/useCasinoBalance';

// Player → agent withdrawal. Funds move instantly to the agent's balance.
export default function AgentWithdrawCard({ initialAmount = 0, onSuccess }) {
  const [q, setQ] = useState('');
  const [agents, setAgents] = useState([]);
  const [min, setMin] = useState(5);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);
  const [picked, setPicked] = useState(null);

  // Live match: the typed UID / username / name against the known agent list.
  const term = q.trim().toLowerCase();
  const matches = term
    ? agents.filter(a =>
        String(a.id || '').toLowerCase() === term ||
        String(a.uid || '').toLowerCase().includes(term) ||
        String(a.username || '').toLowerCase().includes(term) ||
        String(a.full_name || a.name || '').toLowerCase().includes(term)
      ).slice(0, 5)
    : [];

  useEffect(() => {
    agentOps('agents').then(r => setAgents(r.agents || []));
    agentOps('me').then(r => { if (r.min_withdraw) setMin(Number(r.min_withdraw)); });
  }, []);

  const submit = async () => {
    setErr(null);
    const amt = Number(initialAmount);
    if (!q.trim()) { setErr('Please enter the agent\u2019s username or ID.'); return; }
    if (!isFinite(amt) || amt <= 0) { setErr('Please enter a valid withdrawal amount.'); return; }
    if (amt < min) { setErr(`The minimum withdrawal amount is $${min.toFixed(2)}.`); return; }
    if (pin.length !== 4) { setErr('Please enter your 4-digit Pay PIN.'); return; }
    setBusy(true);
    const pinCheck = await verifyPayPin(pin);
    if (pinCheck !== 'ok') {
      setBusy(false);
      setErr(pinCheck === 'not_set'
        ? 'Please set your Pay PIN first from Dashboard → Pay PIN to continue.'
        : 'The Pay PIN you entered is incorrect. Please try again.');
      return;
    }
    const res = await agentOps('withdraw', { q: q.trim(), amount: amt });
    setBusy(false);
    if (!res.ok) { setErr(agentError(res)); return; }
    // Funds already left the wallet server-side — sync the local balance now so
    // the same amount can't be withdrawn again.
    await reloadBalance();
    setDone({ amount: amt, agent: res.agent?.username, balance: res.balance });
    onSuccess?.(res);
  };

  if (done) {
    return (
      <div className="dash-card p-6 flex flex-col items-center gap-3 text-center" style={{ borderColor: 'rgba(52,211,153,0.45)' }}>
        <div className="flex items-center justify-center w-14 h-14 rounded-full" style={{ background: 'rgba(52,211,153,0.15)' }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: '#34d399' }} />
        </div>
        <p className="text-lg font-extrabold" style={{ color: '#34d399' }}>Withdrawal Completed Successfully</p>
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
          ${done.amount.toFixed(2)} has been transferred to agent {done.agent}. Please contact the agent to receive your payout.
        </p>
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Your updated balance is ${Number(done.balance).toFixed(2)}.</p>
        <button onClick={() => (window.location.href = '/dashboard?tab=wallet')} className="dash-btn-gold px-6 py-3 text-sm">Back to Wallet</button>
      </div>
    );
  }

  return (
    <div className="dash-card p-5 flex flex-col gap-3">
      <h2 className="text-base font-bold" style={{ color: '#D4AF37' }}>Withdraw via Agent</h2>
      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Enter the agent's username or ID. Minimum ${min.toFixed(2)}.
      </p>
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 shrink-0" style={{ color: 'rgba(212,175,55,0.8)' }} />
        <input value={q} onChange={e => { setQ(e.target.value); setPicked(null); }} placeholder="Agent username or ID"
          className="dash-input flex-1 px-3 py-3 text-sm" />
      </div>
      {matches.length > 0 ? (
        <div className="flex flex-col gap-2">
          {matches.map(a => (
            <AgentMatchCard key={a.id} agent={a} selected={picked?.id === a.id}
              onSelect={(ag) => { setPicked(ag); setQ(ag.uid || ag.username || String(ag.id)); }} />
          ))}
        </div>
      ) : (
        /* No local match yet — look the typed username / ID up on the server so
           the profile card appears as soon as it's typed. */
        <PlayerLookup query={q} picked={picked}
          onPick={(u) => { setPicked(u); setQ(u.uid || u.username || String(u.id)); }} />
      )}
      <PayPinInput value={pin} onChange={setPin} label="Pay Pin (4 digits)" />
      <button onClick={submit} disabled={busy}
        className="dash-btn-gold w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
        <Send className="w-4 h-4" /> {busy ? 'Processing…' : 'Withdraw'}
      </button>
      {err && <p className="text-[12px]" style={{ color: '#f87171' }}>{err}</p>}
    </div>
  );
}