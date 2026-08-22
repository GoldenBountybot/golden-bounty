import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail, KeyRound, ArrowRightLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { legacySupabase } from '@/lib/legacySupabase';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, sans-serif";

export default function MigrateTelegram() {
  const [me, setMe] = useState(null);
  const [step, setStep] = useState('verify'); // verify | confirm | done
  const [mode, setMode] = useState('password'); // password | code
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [legacy, setLegacy] = useState(null); // { id, balance }
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  const loadLegacy = async (userId) => {
    const { data: wallet } = await legacySupabase.from('wallets').select('balance, staked_amount').eq('user_id', userId).maybeSingle();
    const { data: prof } = await legacySupabase.from('profiles').select('email, telegram_id, migrated_to').eq('id', userId).maybeSingle();
    if (prof?.telegram_id) throw new Error('এই অ্যাকাউন্টটি ইতিমধ্যেই একটি টেলিগ্রাম অ্যাকাউন্ট।');
    if (prof?.migrated_to) throw new Error('এই অ্যাকাউন্টটি ইতিমধ্যেই ট্রান্সফার করা হয়েছে।');
    setLegacy({
      id: userId,
      email: prof?.email || email,
      balance: Number(wallet?.balance || 0),
      staked: Number(wallet?.staked_amount || 0),
    });
    setStep('confirm');
  };

  const signInPassword = async () => {
    setBusy(true); setError('');
    try {
      const { data, error: e } = await legacySupabase.auth.signInWithPassword({ email: email.trim(), password });
      if (e) throw new Error(e.message);
      await loadLegacy(data.user.id);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const sendCode = async () => {
    setBusy(true); setError('');
    try {
      const { error: e } = await legacySupabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } });
      if (e) throw new Error(e.message);
      setCodeSent(true);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const verifyCode = async () => {
    setBusy(true); setError('');
    try {
      const { data, error: e } = await legacySupabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
      if (e) throw new Error(e.message);
      await loadLegacy(data.user.id);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const doMigrate = async () => {
    setBusy(true); setError('');
    try {
      const tg = Number(me?.telegram_id);
      if (!tg) throw new Error('আপনার টেলিগ্রাম অ্যাকাউন্ট পাওয়া যায়নি। টেলিগ্রাম দিয়ে লগইন করুন।');
      const { data, error: e } = await legacySupabase.rpc('migrate_legacy_to_telegram', { p_tg: tg });
      if (e) throw new Error(e.message);
      setResult(data);
      setStep('done');
      await legacySupabase.auth.signOut({ scope: 'local' });
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
        <span className="text-lg font-extrabold" style={{ color: '#D4AF37' }}>পুরনো অ্যাকাউন্ট বাইন্ড</span>
      </header>

      <main className="px-4 py-4 flex flex-col gap-4 max-w-lg mx-auto">
        <div className="dash-card p-4 flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: '#34d399' }} />
          <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            আপনার পুরনো Google / Email অ্যাকাউন্টের ব্যালেন্স, স্টেক ও হিস্ট্রি এই টেলিগ্রাম অ্যাকাউন্টে চলে আসবে।
            ট্রান্সফারের সাথে সাথে পুরনো Google / Email লগইন স্থায়ীভাবে বন্ধ হয়ে যাবে।
          </p>
        </div>

        {step === 'verify' && (
          <div className="dash-card p-5 flex flex-col gap-3">
            <div className="flex gap-2">
              {[{ id: 'password', label: 'পাসওয়ার্ড' }, { id: 'code', label: 'ইমেইল কোড' }].map((m) => (
                <button key={m.id} onClick={() => { setMode(m.id); setError(''); }}
                  className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all"
                  style={mode === m.id
                    ? { background: 'linear-gradient(135deg, #FFD700, #C89B3C)', color: '#1a1408' }
                    : { border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}>
                  {m.label}
                </button>
              ))}
            </div>

            <label className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>পুরনো অ্যাকাউন্টের ইমেইল</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(212,175,55,0.6)' }} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@gmail.com"
                className="dash-input w-full pl-10 pr-4 py-2.5 text-sm" />
            </div>

            {mode === 'password' ? (
              <>
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>পাসওয়ার্ড</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(212,175,55,0.6)' }} />
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••"
                    className="dash-input w-full pl-10 pr-4 py-2.5 text-sm" />
                </div>
                <button onClick={signInPassword} disabled={busy || !email || !password} className="dash-btn-gold py-2.5 text-sm flex items-center justify-center gap-2">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} যাচাই করুন
                </button>
              </>
            ) : (
              <>
                {!codeSent ? (
                  <button onClick={sendCode} disabled={busy || !email} className="dash-btn-gold py-2.5 text-sm flex items-center justify-center gap-2">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} ইমেইলে কোড পাঠান
                  </button>
                ) : (
                  <>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>ইমেইলে আসা কোড</label>
                    <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456"
                      className="dash-input w-full px-4 py-2.5 text-sm tracking-[0.3em]" />
                    <button onClick={verifyCode} disabled={busy || !code} className="dash-btn-gold py-2.5 text-sm flex items-center justify-center gap-2">
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} কোড যাচাই করুন
                    </button>
                    <button onClick={sendCode} disabled={busy} className="text-[11px] font-semibold" style={{ color: 'rgba(212,175,55,0.8)' }}>আবার কোড পাঠান</button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {step === 'confirm' && legacy && (
          <div className="dash-card p-5 flex flex-col gap-4">
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>যাচাই সফল — নিচের ব্যালেন্স আপনার টেলিগ্রাম অ্যাকাউন্টে যাবে।</p>
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{legacy.email}</p>
                <p className="text-xl font-extrabold tabular-nums" style={{ color: '#fff' }}>${legacy.balance.toFixed(2)}</p>
                {legacy.staked > 0 && <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>স্টেক: ${legacy.staked.toFixed(2)}</p>}
              </div>
              <ArrowRightLeft className="w-5 h-5" style={{ color: '#D4AF37' }} />
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.8)' }}>টেলিগ্রাম</p>
                <p className="text-[13px] font-bold" style={{ color: '#fff' }}>@{me?.telegram_username || me?.username || '—'}</p>
              </div>
            </div>
            <button onClick={doMigrate} disabled={busy} className="dash-btn-gold py-3 text-sm flex items-center justify-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} বাইন্ড ও ট্রান্সফার করুন
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="dash-card p-6 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-12 h-12" style={{ color: '#34d399' }} />
            <p className="text-base font-bold" style={{ color: '#fff' }}>ট্রান্সফার সম্পন্ন</p>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              ${Number(result?.moved_balance || 0).toFixed(2)} আপনার টেলিগ্রাম অ্যাকাউন্টে যোগ হয়েছে। পুরনো লগইনটি বন্ধ করে দেওয়া হয়েছে।
            </p>
            <a href="/profile" className="dash-btn-gold px-6 py-2.5 text-sm">প্রোফাইলে যান</a>
          </div>
        )}

        {error && (
          <p className="text-[12px] px-3 py-2.5 rounded-xl" style={{ color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)' }}>{error}</p>
        )}
      </main>
    </div>
  );
}