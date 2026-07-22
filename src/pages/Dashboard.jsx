import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wallet, Crown, Layers, ArrowDownToLine, ArrowUpFromLine, Shield, Lock, Coins, Sparkles, History, Menu } from 'lucide-react';
import { useCasinoAccount } from '@/lib/useCasinoAccount';
import { useStake, LOCK_DAYS } from '@/lib/useStake';
import StackMining from '@/components/StackMining';
import VipLevels from '@/components/VipLevels';
import BackButton from '@/components/BackButton';
import WesternTitleBadge from '@/components/WesternTitleBadge';
import WesternFrame from '@/components/wildbounty/WesternFrame';
import WesternBackdrop from '@/components/WesternBackdrop';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

const TABS = [
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'vip', label: 'VIP', icon: Crown },
  { id: 'stack', label: 'Stack', icon: Layers },
];

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
  const [history, setHistory] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stackBanner, setStackBanner] = useState('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/ce2101293_InShot_20260718_173817740.jpg');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await base44.auth.me().catch(() => null);
        if (!me || !active) return;
        const rows = await base44.entities.Transaction.filter({ user_id: me.id }, '-created_date', 50);
        if (active) setHistory(rows.filter(t => t.type === 'deposit' || t.type === 'withdraw'));
      } catch { /* ignore */ }
      try {
        const list = await base44.entities.SiteSetting.filter({ name: 'stack_banner', active: true });
        if (active && list[0]?.image_url) setStackBanner(list[0].image_url);
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, [tab]);

  const goTab = (id) => {
    setTab(id);
    if (id === 'wallet') setParams({}, { replace: true });
    else setParams({ tab: id }, { replace: true });
  };

  const doDeposit = async (amount) => {
    const n = Number(amount);
    if (!n || n <= 0) { toast({ title: 'Enter a valid amount' }); return; }
    if (n < 1) { toast({ title: 'Minimum deposit is $1.00' }); return; }
    window.location.href = `/pay?amount=${encodeURIComponent(n)}`;
    setDepAmt('');
  };

  const doWithdraw = () => {
    const n = Number(wdAmt);
    if (!n || n <= 0) { toast({ title: 'Enter a valid amount' }); return; }
    if (n > acct.balance) { toast({ title: 'Insufficient balance' }); return; }
    window.location.href = `/withdraw?amount=${encodeURIComponent(n)}`;
    setWdAmt('');
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
    if (ok) { toast({ title: 'Stacked!', description: `$${n.toFixed(2)} locked · earning ${(stake.rate * 100).toFixed(2)}% daily` }); setStkAmt(''); }
    else toast({ title: 'Insufficient balance' });
  };

  const doClaimProfit = async () => {
    const p = await stake.claimProfit();
    if (p > 0) toast({ title: 'Profit claimed!', description: `+$${p.toFixed(2)} added to balance` });
    else toast({ title: 'No profit to claim yet' });
  };

  return (
    <div className="relative min-h-screen bg-[#0b0b0d] pb-10">
      <WesternBackdrop />
      <header className="sticky top-0 z-20 backdrop-blur-xl" style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(214,178,98,0.22)' }}>
        <div className="max-w-md mx-auto px-4 py-2 flex items-center gap-2">
          <BackButton />
          <div className="flex-1 text-center">
            <WesternTitleBadge fullWidth>{tab === 'stack' ? 'Stack' : tab === 'vip' ? 'VIP' : 'Dashboard'}</WesternTitleBadge>
          </div>
          <button
            onClick={() => setMenuOpen(o => !o)}
            title="Menu"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-amber-200 hover:text-amber-100 hover:bg-black/40 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        {menuOpen && (
          <div className="max-w-md mx-auto px-4 pb-2 flex items-center gap-1.5">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { goTab(t.id); setMenuOpen(false); }}
                  title={t.label}
                  className={`flex items-center justify-center w-9 h-9 rounded-md border transition-colors ${active ? 'bg-amber-400 text-stone-900 border-amber-300' : 'bg-black/30 text-amber-100/80 border-amber-700/40 hover:bg-black/50'}`}
                  style={{ fontFamily: 'Rye, Georgia, serif' }}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
            {user?.role === 'admin' && (
              <button
                onClick={() => { window.location.href = '/admin'; }}
                title="Admin Panel"
                className="flex items-center justify-center w-9 h-9 rounded-md border bg-black/30 text-amber-200 border-amber-700/40 hover:bg-black/50 transition-colors"
                style={{ fontFamily: 'Rye, Georgia, serif' }}
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 py-3 flex flex-col gap-3">
        {/* Balance */}
        <WesternFrame glow variant="glass" className="p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[8px] tracking-widest uppercase text-amber-300/70" style={{ fontFamily: 'Rye, Georgia, serif' }}>Balance</p>
            <p className="text-xl font-black italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>${acct.balance.toFixed(2)}</p>
          </div>
          <Wallet className="w-5 h-5 text-amber-400/60" />
        </WesternFrame>

        {tab === 'wallet' && (
          <div className="flex flex-col gap-2.5">
            <WesternFrame variant="glass" className="p-2.5 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-amber-200">
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <h2 className="text-[11px] font-black italic" style={{ fontFamily: 'Rye, Georgia, serif' }}>Deposit</h2>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[50, 100, 500, 1000].map(a => (
                  <button key={a} onClick={() => doDeposit(a)} className="px-3 py-1.5 rounded-md text-[11px] font-bold italic border bg-black/30 text-amber-100/80 border-amber-700/40 hover:bg-black/50" style={{ fontFamily: 'Georgia, serif' }}>${a}</button>
                ))}
              </div>
              <div className="flex gap-1.5 justify-center">
                <input type="number" value={depAmt} onChange={e => setDepAmt(e.target.value)} placeholder="Custom amount" className="w-32 px-3 py-1.5 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 text-xs placeholder-amber-100/40 outline-none" />
                <button onClick={() => doDeposit(depAmt)} className="px-3 py-1.5 rounded-md text-xs font-bold italic" style={{ border: '1px solid rgba(245,210,120,0.9)', background: 'linear-gradient(to bottom, #f5c542, #c8881e)', color: '#2a1a06', fontFamily: 'Rye, Georgia, serif' }}>Deposit</button>
              </div>
            </WesternFrame>

            <WesternFrame variant="glass" className="p-2.5 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-amber-200">
                <ArrowUpFromLine className="w-3.5 h-3.5" />
                <h2 className="text-[11px] font-black italic" style={{ fontFamily: 'Rye, Georgia, serif' }}>Withdraw</h2>
              </div>
              <div className="flex gap-1.5 justify-center">
                <input type="number" value={wdAmt} onChange={e => setWdAmt(e.target.value)} placeholder="Amount to withdraw" className="w-32 px-3 py-1.5 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 text-xs placeholder-amber-100/40 outline-none" />
                <button onClick={doWithdraw} className="px-3 py-1.5 rounded-md text-xs font-bold italic" style={{ border: '1px solid rgba(245,210,120,0.9)', background: 'linear-gradient(to bottom, #e0556a, #a02338)', color: '#fff', fontFamily: 'Rye, Georgia, serif' }}>Withdraw</button>
              </div>
              <p className="text-[9px] text-amber-100/40 italic">Withdraw creates a request — funds sent after admin approval.</p>
            </WesternFrame>

            {/* Deposit & Withdraw history */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-amber-200 px-0.5">
                <History className="w-3 h-3" />
                <h2 className="text-[11px] font-black italic" style={{ fontFamily: 'Rye, Georgia, serif' }}>Deposit & Withdraw History</h2>
              </div>
              {history.length === 0 ? (
                <p className="text-amber-100/50 text-[10px] italic px-0.5">No transactions yet.</p>
              ) : history.map(t => {
                const credit = t.type === 'deposit';
                const statusColor = t.status === 'completed' ? 'text-emerald-300' : t.status === 'pending' ? 'text-amber-300' : 'text-rose-400';
                return (
                  <WesternFrame key={t.id} variant="glass" className="p-2 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold italic text-amber-100" style={{ fontFamily: 'Georgia, serif' }}>
                        {credit ? 'Deposit' : 'Withdraw'} · <span className={credit ? 'text-emerald-300' : 'text-rose-300'}>{credit ? '+' : '−'}${Number(t.amount).toFixed(2)}</span>
                      </p>
                      <p className="text-[9px] text-amber-100/50 italic">{t.method} · {t.reference ? `${t.reference.slice(0, 16)}` : '—'}</p>
                      {t.created_date && (
                        <p className="text-[9px] text-amber-100/45 italic">
                          {new Date(t.created_date).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {t.note && <p className="text-[8px] text-amber-100/35 italic truncate">{t.note}</p>}
                    </div>
                    <span className={`text-[9px] font-bold italic capitalize ${statusColor}`} style={{ fontFamily: 'Georgia, serif' }}>{t.status}</span>
                  </WesternFrame>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'vip' && (
          <div className="relative -mx-4 -my-3 px-4 py-4 min-h-[calc(100vh-64px)]">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
              style={{ backgroundImage: 'url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/64820b41c_MuchaTseBle.jpg)' }}
            />
            <div className="relative z-10">
              <VipLevels totalDeposits={stake.totalDeposits} />
            </div>
          </div>
        )}

        {tab === 'stack' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl overflow-hidden border border-amber-700/40 shadow-lg">
              <img
                src={stackBanner}
                alt={`Stack Balance — Lock your balance to earn ${(stake.rate * 100).toFixed(2)}% daily profit for ${LOCK_DAYS} days`}
                className="w-full h-auto block"
              />
            </div>

            {/* USDT mining animation */}
            <StackMining staked={stake.staked} pendingProfit={stake.pendingProfit} daysLocked={stake.daysLocked} unlocked={stake.unlocked} rate={stake.rate} />

            {/* Stack stats */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { icon: Lock, label: 'Staked', value: `$${stake.staked.toFixed(2)}` },
                { icon: Sparkles, label: 'Pending Profit', value: `$${stake.pendingProfit.toFixed(2)}` },
                { icon: null, label: 'Days Locked', value: `${stake.daysLocked}/${LOCK_DAYS}` },
                { icon: null, label: 'Unlocks In', value: stake.unlocked ? 'Ready' : `${stake.daysRemaining}d` },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <WesternFrame key={i} variant="glass" className="flex flex-col items-center py-1.5 px-1">
                    {Icon && <Icon className="w-3 h-3 text-amber-300/70 mb-0.5" />}
                    <span className="text-[8px] text-amber-300/70 tracking-widest uppercase" style={{ fontFamily: 'Rye, Georgia, serif' }}>{s.label}</span>
                    <span className="text-[11px] font-bold italic text-yellow-100 tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>{s.value}</span>
                  </WesternFrame>
                );
              })}
            </div>

            {/* Claim profit */}
            <button
              onClick={doClaimProfit}
              disabled={stake.pendingProfit <= 0}
              className="w-auto mx-auto px-3 py-1.5 rounded-md text-xs font-black italic shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              style={{
                border: '1px solid rgba(245,210,120,0.9)',
                background: 'linear-gradient(to bottom, #f5c542, #c8881e)',
                boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 3px 8px rgba(200,136,30,0.45)',
                color: '#2a1a06',
                fontFamily: 'Rye, Georgia, serif',
                textShadow: '0 1px 1px rgba(255,240,200,0.4)',
              }}
            >
              <Coins className="w-4 h-4" /> CLAIM PROFIT ${stake.pendingProfit.toFixed(2)}
            </button>

            {/* Stake form */}
            <WesternFrame variant="glass" className="p-2 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-amber-200">
                <Layers className="w-3.5 h-3.5" />
                <h2 className="text-sm font-black italic" style={{ fontFamily: 'Rye, Georgia, serif' }}>Stack More</h2>
              </div>
              <p className="text-[10px] text-amber-100/50 italic">Available balance: ${acct.balance.toFixed(2)}</p>
              <div className="flex gap-1.5 flex-wrap">
                {[50, 100, 500, 1000].map(a => (
                  <button
                    key={a}
                    onClick={() => doStake(a)}
                    disabled={a > acct.balance}
                    className="px-3 py-1.5 rounded-md text-[11px] font-bold italic border disabled:opacity-40"
                    style={{
                      border: '1px solid rgba(190,140,55,0.7)',
                      background: 'linear-gradient(to bottom, rgba(74,52,24,0.95), rgba(40,27,12,0.95))',
                      boxShadow: 'inset 0 1px 0 rgba(255,210,120,0.25), 0 1px 3px rgba(0,0,0,0.5)',
                      color: '#d9b97a',
                      fontFamily: 'Rye, Georgia, serif',
                    }}
                  >${a}</button>
                ))}
              </div>
              <div className="flex gap-1.5 justify-center">
                <input type="number" value={stkAmt} onChange={e => setStkAmt(e.target.value)} placeholder="Amount to stack" className="w-32 px-3 py-1.5 rounded-md bg-black/40 border border-amber-700/40 text-amber-100 placeholder-amber-100/40 outline-none text-xs" />
                <button
                  onClick={() => doStake(stkAmt)}
                  className="px-3 py-1.5 rounded-md text-xs font-bold italic"
                  style={{
                    border: '1px solid rgba(245,210,120,0.9)',
                    background: 'linear-gradient(to bottom, #f5c542, #c8881e)',
                    boxShadow: 'inset 0 1px 0 rgba(255,240,180,0.5), 0 2px 6px rgba(200,136,30,0.45)',
                    color: '#2a1a06',
                    fontFamily: 'Rye, Georgia, serif',
                  }}
                >Stack</button>
              </div>
              <p className="text-[9px] text-amber-100/40 italic">Stacking again restarts your {LOCK_DAYS}-day lock and profit timer on the total.</p>
            </WesternFrame>
          </div>
        )}
      </main>
    </div>
  );
}