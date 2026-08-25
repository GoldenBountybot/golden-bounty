import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { useLanguage } from '@/lib/LanguageContext';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, sans-serif";

// Binding an old Google / Email account now needs nothing but the email
// address: the server looks the old account up, moves its balance, stake and
// history onto the current account, and disables the old login.
export default function MigrateTelegram() {
  const { t } = useLanguage();
  const [me, setMe] = useState(null);
  const [step, setStep] = useState('verify'); // verify | done
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  const ERRORS = {
    legacy_account_not_found: 'No old account was found with this email, or it has already been transferred.',
    same_account: 'This is already your current account.',
    email_required: 'Please enter the old account email.',
    not_authenticated: 'Please log in first.',
  };

  const bindByEmail = async () => {
    setBusy(true); setError('');
    try {
      const { data, error: e } = await supabase.rpc('migrate_legacy_by_email', { p_email: email.trim() });
      if (e) throw new Error(t(ERRORS[e.message] ? ERRORS[e.message] : e.message));
      setResult(data);
      setStep('done');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <header className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(13,13,13,0.8)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}>
        <Link to="/profile" className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <span className="text-lg font-extrabold" style={{ color: '#D4AF37' }}>{t('Bind Old Account')}</span>
      </header>

      <main className="px-4 py-4 flex flex-col gap-4 max-w-lg mx-auto">
        <div className="dash-card p-4 flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: '#34d399' }} />
          <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {t('Just enter your old Google / Email account address — no password or code needed. Its balance, stake and history will move to this account and the old login will be permanently disabled.')}
          </p>
        </div>

        {step === 'verify' && (
          <div className="dash-card p-5 flex flex-col gap-3">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t('Old Account Email')}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(212,175,55,0.6)' }} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@gmail.com"
                className="dash-input w-full pl-10 pr-4 py-2.5 text-sm" />
            </div>
            <button onClick={bindByEmail} disabled={busy || !email.trim()} className="dash-btn-gold py-3 text-sm flex items-center justify-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {t('Bind & Transfer')}
            </button>
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('Signed in as')} @{me?.telegram_username || me?.username || me?.email || '—'}
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="dash-card p-6 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-12 h-12" style={{ color: '#34d399' }} />
            <p className="text-base font-bold" style={{ color: '#fff' }}>{t('Transfer Complete')}</p>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {t('{amount} has been added to your Telegram account. The old login has been disabled.', { amount: `$${Number(result?.moved_balance || 0).toFixed(2)}` })}
            </p>
            {Number(result?.moved_staked || 0) > 0 && (
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {t('Stake')}: ${Number(result.moved_staked).toFixed(2)}
              </p>
            )}
            <Link to="/profile" className="dash-btn-gold px-6 py-2.5 text-sm">{t('Go to Profile')}</Link>
          </div>
        )}

        {error && (
          <p className="text-[12px] px-3 py-2.5 rounded-xl" style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)' }}>{error}</p>
        )}
      </main>
    </div>
  );
}