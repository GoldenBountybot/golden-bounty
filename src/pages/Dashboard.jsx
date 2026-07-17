import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wallet, Gift, Layers, ArrowDownToLine, ArrowUpFromLine, Shield, Lock, Coins, Sparkles } from 'lucide-react';
import { useCasinoAccount } from '@/lib/useCasinoAccount';
import { useStake, LOCK_DAYS, DAILY_RATE } from '@/lib/useStake';
import BackButton from '@/components/BackButton';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';

const TABS = [
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'bonus', label: 'Bonuses', icon: Gift },
  { id: 'stack', label: 'Stack', icon: Layers },
];

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
  const stake = useStake();
  const { user } = useAuth();
  const { toast } = useToast();
  const [depAmt, setDepAmt] = useState('');
  const [wdAmt, setWdAmt] = useState('');
  const [stkAmt, setStkAmt] = useState('');

  const goTab = (id) => {
    setTab(id);
    if (id === 'wallet') setParams({}, { replace: true });
    else setParams({ tab: id }, { replace: true });
  };

  const doDeposit = async (amount) => {
    const n = Number(amount);
    if (!n || n <= 0) { toast({ title: 'Enter a valid amount' }); return; }
    await acct.deposit(n);
    toast({ title: 'Deposit request submitted', description: 'Pending admin approval. Your balance will be updated once approved.' });
    setDepAmt('');
  };

  const doWithdraw = () => {
    const n = Number(wdAmt);
    if (!n || n <= 0) { toast({ title: 'Enter a valid amount' }); return; }
    const ok = acct.withdraw(n);
    if (ok) { toast({ title: 'Withdrawal requested', description: `$${n.toFixed(2)} deducted` }); setWdAmt(''); }
    else toast({ title: 'Insufficient balance' });
  };

  const claim = (name, fn) => {
    const res = fn();
    if (res === false) toast({ title: `${name} not available yet` });
    else if (typeof res === 'number') toast({ title: `${name} claimed!`, description: `+$${res.toFixed(2)} added to balance` });
    else toast({ title: `${name} claimed!`, description: 'Bonus added to your balance' });
  };

  const doStake = async (amount) => {
    const n = Number(amount);
    if (!n || n <= 0) { toast({ title: 'Enter a valid amount' }); return; }
    const ok = await stake.stake(n);
    if (ok) { toast({ title: 'Stacked!', description: `$${n.toFixed(2)} locked · earning ${(DAILY_RATE * 100)}% daily` }); setStkAmt(''); }
    else toast({ title: 'Insufficient balance' });
  };

  const doClaimProfit = async () => {
    const p = await stake.claimProfit();
    if (p > 0) toast({ title: 'Profit claimed!', description: `+$${p.toFixed(2)} added to balance` });
    else toast({ title: 'No profit to claim yet' });
  };

  const doUnlock = async () => {
    const ok = await stake.unlockNow();
    if (ok) toast({ title: 'Unlocked!', description: 'Staked balance returned to your wallet' });
    else toast({ title: 'Not unlocked yet', description: `${LOCK_DAYS} days lock not over` });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-green-950 to-stone-950 pb-10">
      <header className="sticky top-0 z-20 bg-emerald-950/90 backdrop-blur-xl border-b border-amber-600/30">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton />
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
            <BonusCard title="Signup Bonus" amount={acct.bonuses.signup.amount} desc="Claim once after sign-up" disabled={!acct.bonuses.signup.active || acct.bonuses.signup.claimed} disabledText={!acct.bonuses.signup.active ? 'Inactive' : 'Claimed'} onClaim={() => claim('Signup bonus', acct.bonuses.signup.claim)} />
            <BonusCard title="Daily Bonus" amount={acct.bonuses.daily.amount} desc="Claim once every day" disabled={!acct.bonuses.daily.active || acct.bonuses.daily.claimed} disabledText={!acct.bonuses.daily.active ? 'Inactive' : 'Claimed today'} onClaim={() => claim('Daily bonus', acct.bonuses.daily.claim)} />
            <BonusCard title="Weekly Bonus" amount={acct.bonuses.weekly.amount} desc="Claim once every week" disabled={!acct.bonuses.weekly.active || acct.bonuses.weekly.claimed} disabledText={!acct.bonuses.weekly.active ? 'Inactive' : 'Claimed this week'} onClaim={() => claim('Weekly bonus', acct.bonuses.weekly.claim)} />
            <BonusCard title="Monthly Bonus" amount={acct.bonuses.monthly.amount} desc="Claim once per month" disabled={!acct.bonuses.monthly.active || acct.bonuses.monthly.claimed} disabledText={!acct.bonuses.monthly.active ? 'Inactive' : 'Claimed this month'} onClaim={() => claim('Monthly bonus', acct.bonuses.monthly.claim)} />
            <BonusCard title="Deposit Bonus" amount={acct.bonuses.deposit.amount} desc={`${acct.bonuses.deposit.percent || 0}% of your last deposit · unlocks after each deposit`} disabled={!acct.bonuses.deposit.active || !acct.bonuses.deposit.available} disabledText={!acct.bonuses.deposit.active ? 'Inactive' : 'Deposit to unlock'} onClaim={() => claim('Deposit bonus', acct.bonuses.deposit.claim)} />
          </div>
        )}

        {tab === 'stack' && (
          <div className="flex flex-col gap-4">
            <WesternFrame glow className="p-5 flex flex-col items-center gap-3 text-center">
              <Layers className="w-10 h-10 text-amber-400" />
              <div>
                <h2 className="font-black italic text-amber-200 text-lg" style={{ fontFamily: 'Georgia, serif' }}>Stack Balance</h2>
                <p className="text-sm text-amber-100/70 mt-1">Lock your balance to earn <span className="font-bold text-amber-200">{DAILY_RATE * 100}% daily profit</span>. Locked for {LOCK_DAYS} days — you cannot use or withdraw it until it unlocks.</p>
              </div>
            </WesternFrame>

            {/* Stack stats */}
            <div className="grid grid-cols-2 gap-2">
              <WesternFrame className="flex flex-col items-center py-3">
                <Lock className="w-4 h-4 text-amber-300/70 mb-1" />
                <span className="text-[9px] text-amber-300/70 tracking-widest uppercase">Staked</span>
                <span className="text-sm font-bold italic text-yellow-100 tabular-nums">${stake.staked.toFixed(2)}</span>
              </WesternFrame>
              <WesternFrame className="flex flex-col items-center py-3">
                <Sparkles className="w-4 h-4 text-amber-300/70 mb-1" />
                <span className="text-[9px] text-amber-300/70 tracking-widest uppercase">Pending Profit</span>
                <span className="text-sm font-bold italic text-yellow-100 tabular-nums">${stake.pendingProfit.toFixed(2)}</span>
              </WesternFrame>
              <WesternFrame className="flex flex-col items-center py-3">
                <span className="text-[9px] text-amber-300/70 tracking-widest uppercase">Days Locked</span>
                <span className="text-sm font-bold italic text-yellow-100 tabular-nums">{stake.daysLocked}/{LOCK_DAYS}</span>
              </WesternFrame>
              <WesternFrame className="flex flex-col items-center py-3">
                <span className="text-[9px] text-amber-300/70 tracking-widest uppercase">Unlocks In</span>
                <span className="text-sm font-bold italic text-yellow-100 tabular-nums">{stake.unlocked ? 'Ready' : `${stake.daysRemaining}d`}</span>
              </WesternFrame>
            </div>

            {/* Claim profit */}
            <button
              onClick={doClaimProfit}
              disabled={stake.pendingProfit <= 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-700 text-white text-base font-black italic shadow-lg hover:from-emerald-400 hover:to-green-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <Coins className="w-4 h-4" /> CLAIM PROFIT ${stake.pendingProfit.toFixed(2)}
            </button>

            {/* Unlock (after 15 days) */}
            {stake.unlocked && (
              <button
                onClick={doUnlock}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 text-base font-black italic shadow-lg hover:from-amber-300 hover:to-orange-400 transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <Lock className="w-4 h-4" /> UNLOCK · RETURN ${stake.staked.toFixed(2)}
              </button>
            )}

            {/* Stake form */}
            <WesternFrame className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-200">
                <Layers className="w-5 h-5" />
                <h2 className="font-black italic" style={{ fontFamily: 'Georgia, serif' }}>Stack More</h2>
              </div>
              <p className="text-[11px] text-amber-100/50 italic">Available balance: ${acct.balance.toFixed(2)}</p>
              <div className="flex gap-2 flex-wrap">
                {[50, 100, 500, 1000].map(a => (
                  <button key={a} onClick={() => doStake(a)} disabled={a > acct.balance} className="px-3 py-1.5 rounded-md text-sm font-bold italic border bg-black/30 text-amber-100/80 border-amber-700/40 hover:bg-black/50 disabled:opacity-40" style={{ fontFamily: 'Georgia, serif' }}>${a}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="number" value={stkAmt} onChange={e => setStkAmt(e.target.value)} placeholder="Amount to stack" className="flex-1 px-3 py-2 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 placeholder-amber-100/40 outline-none" />
                <button onClick={() => doStake(stkAmt)} className="px-4 py-2 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 font-bold italic" style={{ fontFamily: 'Georgia, serif' }}>Stack</button>
              </div>
              <p className="text-[10px] text-amber-100/40 italic">Stacking again restarts your {LOCK_DAYS}-day lock and profit timer on the total.</p>
            </WesternFrame>
          </div>
        )}
      </main>
    </div>
  );
}