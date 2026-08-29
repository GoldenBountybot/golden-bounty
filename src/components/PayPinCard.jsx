import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { getPayPin, savePayPin } from '@/lib/payPin';
import PayPinInput from '@/components/PayPinInput';

// Set / change the 4-digit Pay PIN required for every withdrawal.
export default function PayPinCard() {
  const [hasPin, setHasPin] = useState(false);
  const [current, setCurrent] = useState('');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(false);

  useEffect(() => { getPayPin().then(p => setHasPin(!!p)); }, []);

  const submit = async () => {
    setErr(null); setOk(false);
    if (pin.length !== 4) { setErr('Pay Pin must be exactly 4 digits.'); return; }
    if (pin !== confirm) { setErr('The two pins do not match.'); return; }
    setBusy(true);
    if (hasPin) {
      const stored = await getPayPin();
      if (current !== stored) { setBusy(false); setErr('Invalid pay pin'); return; }
    }
    await savePayPin(pin);
    setBusy(false);
    setHasPin(true); setOk(true);
    setCurrent(''); setPin(''); setConfirm('');
  };

  return (
    <div className="dash-card p-5 flex flex-col gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)' }}>
          <Lock className="w-4 h-4" style={{ color: '#D4AF37' }} />
        </div>
        <h2 className="text-base font-bold" style={{ color: '#D4AF37' }}>
          {hasPin ? 'Change Pay Pin' : 'Set Pay Pin'}
        </h2>
      </div>
      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
        A 4-digit pin is required to confirm every withdrawal (agent or USDT).
      </p>

      {hasPin && <PayPinInput value={current} onChange={setCurrent} label="Current pin" />}
      <PayPinInput value={pin} onChange={setPin} label="New 4-digit pin" />
      <PayPinInput value={confirm} onChange={setConfirm} label="Confirm pin" />

      <button onClick={submit} disabled={busy}
        className="dash-btn-gold w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
        <ShieldCheck className="w-4 h-4" /> {busy ? 'Saving…' : hasPin ? 'Update Pay Pin' : 'Save Pay Pin'}
      </button>

      {err && <p className="text-[12px]" style={{ color: '#f87171' }}>{err}</p>}
      {ok && <p className="text-[12px]" style={{ color: '#34d399' }}>Pay Pin saved successfully.</p>}
    </div>
  );
}