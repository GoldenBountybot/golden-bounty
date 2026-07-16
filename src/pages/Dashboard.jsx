import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Wallet, Gift, Users, Copy, Check, ArrowDownToLine, ArrowUpFromLine, Shield } from 'lucide-react';
import { useCasinoAccount } from '@/lib/useCasinoAccount';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';

const TABS = [
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'bonus', label: 'Bonuses', icon: Gift },
  { id: 'referral', label: 'Referral', icon: Users },
];

const REF_KEY = 'casino_referral_code';

function useReferralCode() {
  const [code, setCode] = useState('');
  useEffect(() => {
    let c = localStorage.getItem(REF_KEY);
    if (!c) {
      c = Math.random().toString(36).slice(2, 8).toUpperCase();
      localStorage.setItem(REF_KEY, c);
    }
    setCode(c);
  }, []);
  return code;
}

function BonusCard({ title, amount, desc, disabled, disabledText, onClaim }) {
  return (
    <WesternFrame className="p-4 flex items-center justify-between gap-3">
      <div className="flex-1">
        <h3 className="font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
        <p className="text-xs text-amber-100/60 mt-0.5">{desc}</p>
        <p className="text-sm font-bold italic text-yellow-100 mt-1">${amount.toFixed(2)}</p>
      </div>
      <button
        onClick={onClaim}
        disabled={disabled}
        className={`px-4 py-2 rounded-lg text-sm font-bold italic border whitespace-nowrap ${disabled ? 'bg-black/30 text-amber-100/40 border-amber-700/30 cursor-not-allowed' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 border-amber-300 hover:from-amber-300'}`}
        style={{ fontFamily: 'Georgia, serif' }}
      >
        {disabled ? disabledText : 'Claim'}
      </button>
    </WesternFrame>
  );
}

export default function Dashboard() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'wallet');
  const acct = useCasinoAccount();
  const { user } = useAuth();
  const { toast } = useToast();
  const refCode = useReferralCode();
  const refLink = `${window.location.origin}/?ref=${refCode}`;
  const [copied, setCopied] = useState(false);
  const [depAmt, setDepAmt] = useState('');
  const [wdAmt, setWdAmt] = useState('');

  const goTab = (id) => {
    setTab(id);
    if (id === 'wallet') setParams({}, { replace: true });
    else setParams({ tab: id }, { replace: true });
  };

  const doDeposit = (amount) => {
    const n = Number(amount);
    if (!n || n <= 0) { toast({ title: 'Enter a valid amount' }); return; }
    acct.deposit(n);
    toast({ title: 'Deposit successful', description: `$${n.toFixed(2)} added · 50% bonus ready to claim` });
    setDepAmt('');
  };

  const doWithdraw = () => {
    const n = Number(wdAmt);
    if (!n || n <= 0) { toast({ title: 'Enter a valid amount' }); return; }
    const ok = acct.withdraw(n);
    if (ok) { toast({ title: 'Withdrawal requested', description: `$${n.toFixed(2)} deducted` }); setWdAmt(''); }
    else toast({ title: 'Insufficient balance' });
  };

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const claim = (name, fn) => {
    const res = fn();
    if (res === false) toast({ title: `${name} not available yet` });
    else if (typeof res === 'number') toast({ title: `${name} claimed!`, description: `+$${res.toFixed(2)} added to balance` });
    else toast({ title: `${name} claimed!`, description: 'Bonus added to your balance' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-green-950 to-stone-950 pb-10">
      <header className="sticky top-0 z-20 bg-emerald-950/90 backdrop-blur-xl border-b border-amber-600/30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => { window.location.href = '/'; }} title="Back" className="flex items-center justify-center w-9 h-9 rounded-lg text-stone-300 hover:text-amber-200 hover:bg-black/40 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-base font-black italic text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>Dashboard</h1>
          </div>
          {user?.role === 'admin' && (
            <button onClick={() => { window.location.href = '/admin'; }} title="Admin Panel" className="flex items-center justify-center w-9 h-9 rounded-lg text-amber-200 hover:text-amber-100 hover:bg-black/40 transition-colors">
              <Shield className="w-5 h-5" />
            </button>
          )}
          </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 flex flex-col gap-4">
        {/* Balance */}
        <WesternFrame glow className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-amber-300/70">Balance</p>
            <p className="text-2xl font-black italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${acct.balance.toFixed(2)}</p>
          </div>
          <Wallet className="w-8 h-8 text-amber-400/60" />
        </WesternFrame>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => goTab(t.id)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-colors ${active ? 'bg-amber-400 text-stone-900 border-amber-300' : 'bg-black/30 text-amber-100/80 border-amber-700/40 hover:bg-black/50'}`}
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <Icon className="w-5 h-5" /><span className="text-xs font-bold italic">{t.label}</span>
              </button>
            );
          })}
        </div>

        {tab === 'wallet' && (
          <div className="flex flex-col gap-4">
            <WesternFrame className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-200">
                <ArrowDownToLine className="w-5 h-5" />
                <h2 className="font-black italic" style={{ fontFamily: 'Georgia, serif' }}>Deposit</h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[50, 100, 500, 1000].map(a => (
                  <button key={a} onClick={() => doDeposit(a)} className="px-3 py-1.5 rounded-md text-sm font-bold italic border bg-black/30 text-amber-100/80 border-amber-700/40 hover:bg-black/50" style={{ fontFamily: 'Georgia, serif' }}>${a}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="number" value={depAmt} onChange={e => setDepAmt(e.target.value)} placeholder="Custom amount" className="flex-1 px-3 py-2 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 placeholder-amber-100/40 outline-none" />
                <button onClick={() => doDeposit(depAmt)} className="px-4 py-2 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>Deposit</button>
              </div>
            </WesternFrame>

            <WesternFrame className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-200">
                <ArrowUpFromLine className="w-5 h-5" />
                <h2 className="font-black italic" style={{ fontFamily: 'Georgia, serif' }}>Withdraw</h2>
              </div>
              <div className="flex gap-2">
                <input type="number" value={wdAmt} onChange={e => setWdAmt(e.target.value)} placeholder="Amount to withdraw" className="flex-1 px-3 py-2 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 placeholder-amber-100/40 outline-none" />
                <button onClick={doWithdraw} className="px-4 py-2 rounded-md bg-gradient-to-r from-rose-500 to-red-700 text-white font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>Withdraw</button>
              </div>
            </WesternFrame>
          </div>
        )}

        {tab === 'bonus' && (
          <div className="flex flex-col gap-3">
            <BonusCard title="Signup Bonus" amount={acct.bonuses.signup.amount} desc="Claim once after sign-up" disabled={acct.bonuses.signup.claimed} disabledText="Claimed" onClaim={() => claim('Signup bonus', acct.bonuses.signup.claim)} />
            <BonusCard title="Daily Bonus" amount={acct.bonuses.daily.amount} desc="Claim once every day" disabled={acct.bonuses.daily.claimed} disabledText="Claimed today" onClaim={() => claim('Daily bonus', acct.bonuses.daily.claim)} />
            <BonusCard title="Monthly Bonus" amount={acct.bonuses.monthly.amount} desc="Claim once per month" disabled={acct.bonuses.monthly.claimed} disabledText="Claimed this month" onClaim={() => claim('Monthly bonus', acct.bonuses.monthly.claim)} />
            <BonusCard title="Deposit Bonus" amount={acct.bonuses.deposit.amount} desc="50% of your last deposit · unlocks after each deposit" disabled={!acct.bonuses.deposit.available} disabledText="Deposit to unlock" onClaim={() => claim('Deposit bonus', acct.bonuses.deposit.claim)} />
          </div>
        )}

        {tab === 'referral' && (
          <WesternFrame className="p-5 flex flex-col items-center gap-4">
            <Users className="w-10 h-10 text-amber-400" />
            <div className="text-center">
              <h2 className="font-black italic text-amber-200 text-lg" style={{ fontFamily: 'Georgia, serif' }}>Refer & Earn</h2>
              <p className="text-sm text-amber-100/70 mt-1">Share your link. When friends sign up, you both get a bonus.</p>
            </div>
            <div className="w-full flex items-center gap-2 bg-black/40 border border-amber-700/40 rounded-lg px-3 py-2">
              <span className="flex-1 text-xs text-amber-100/80 truncate">{refLink}</span>
              <button onClick={copyRef} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-bold italic border ${copied ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-amber-400 text-stone-900 border-amber-300'}`} style={{ fontFamily: 'Georgia, serif' }}>
                {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
              </button>
            </div>
            <p className="text-[11px] text-amber-100/50 italic">Your code: <span className="font-bold text-amber-200">{refCode}</span></p>
          </WesternFrame>
        )}
      </main>
    </div>
  );
}