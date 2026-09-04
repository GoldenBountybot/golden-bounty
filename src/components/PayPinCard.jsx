import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getPayPin, savePayPin } from '@/lib/payPin';
import PayPinInput from '@/components/PayPinInput';
import { useLanguage } from '@/lib/LanguageContext';

// Set the 4-digit Pay PIN required for every withdrawal.
// A pin can be set ONCE — it can never be changed afterwards.
export default function PayPinCard() {
  const { t } = useLanguage();
  const [hasPin, setHasPin] = useState(null);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { getPayPin().then(p => setHasPin(!!p)); }, []);

  const submit = async () => {
    setErr(null);
    if (pin.length !== 4) { setErr(t("Your Pay PIN must contain exactly 4 digits.")); return; }
    if (pin !== confirm) { setErr(t("The PINs entered do not match. Please try again.")); return; }
    setBusy(true);
    const existing = await getPayPin();
    if (existing) { setBusy(false); setHasPin(true); return; }
    try {
      await savePayPin(pin);
      setHasPin(true);
      setPin(''); setConfirm('');
    } catch (e) {
      setErr(t("We couldn't save your Pay PIN at this time. Please try again."));
    }
    setBusy(false);
  };

  if (hasPin === null) return null;

  if (hasPin) {
    return (
      <div className="dash-card p-5 flex flex-col items-center gap-3 text-center" style={{ animation: 'dashFadeIn 400ms ease both', borderColor: 'rgba(52,211,153,0.4)' }}>
        <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.35)' }}>
          <CheckCircle2 className="w-6 h-6" style={{ color: '#34d399' }} />
        </div>
        <p className="text-base font-bold" style={{ color: '#34d399' }}>{t("Your Pay PIN has been successfully set")}</p>
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {t("Please make a note of it, as it cannot be reset or recovered if forgotten.")}
        </p>
      </div>
    );
  }

  return (
    <div className="dash-card p-5 flex flex-col gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)' }}>
          <Lock className="w-4 h-4" style={{ color: '#D4AF37' }} />
        </div>
        <h2 className="text-base font-bold" style={{ color: '#D4AF37' }}>{t("Set Pay Pin")}</h2>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(251,146,60,0.10)', border: '1px solid rgba(251,146,60,0.35)' }}>
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#fb923c' }} />
        <p className="text-[12px] font-semibold" style={{ color: '#fb923c' }}>
          {t("Important: your Pay PIN can be set only once and cannot be reset or recovered. Please record it and store it securely.")}
        </p>
      </div>

      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {t("A 4-digit pin is required to confirm every withdrawal (agent or USDT).")}
      </p>

      <PayPinInput value={pin} onChange={setPin} label={t("Enter 4-digit pin")} />
      <PayPinInput value={confirm} onChange={setConfirm} label={t("Confirm pin")} />

      <button onClick={submit} disabled={busy}
        className="dash-btn-gold w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
        <ShieldCheck className="w-4 h-4" /> {busy ? t("Saving…") : t("Save Pay Pin")}
      </button>

      {err && <p className="text-[12px]" style={{ color: '#f87171' }}>{err}</p>}
    </div>
  );
}