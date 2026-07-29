import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wallet, Crown, Layers, ArrowDownToLine, ArrowUpFromLine, Shield, Lock, Coins, Sparkles, History, Menu, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useCasinoAccount } from '@/lib/useCasinoAccount';
import { useStake, LOCK_DAYS } from '@/lib/useStake';
import StackMining from '@/components/StackMining';
import VipLevels from '@/components/VipLevels';
import BackButton from '@/components/BackButton';
import StylishNotify from '@/components/StylishNotify';
import AnimatedNumber from '@/components/AnimatedNumber';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

const TABS = [
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'vip', label: 'VIP', icon: Crown },
  { id: 'stack', label: 'Stack', icon: Layers },
];

const STATUS_META = {
  completed: { color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)', icon: CheckCircle2, label: 'Success' },
  approved:  { color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)', icon: CheckCircle2, label: 'Success' },
  pending:   { color: '#fb923c', bg: 'rgba(251,146,60,0.14)', border: 'rgba(251,146,60,0.4)', icon: Clock, label: 'Pending' },
  rejected:  { color: '#f87171', bg: 'rgba(248,113,113,0.14)', border: 'rgba(248,113,113,0.4)', icon: XCircle, label: 'Rejected' },
};

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
  const [notify, setNotify] = useState(null);
  const showNotify = (title, description) => setNotify({ title, description });

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
    if (n < 3) { toast({ title: 'Minimum deposit is $3.00' }); return; }
    window.location.href = `/pay?amount=${encodeURIComponent(n)}`;
    setDepAmt('');
  };

  const doWithdraw = () => {
    const n = Number(wdAmt);
    if (!n || n <= 0) { toast({ title: 'Enter a valid amount' }); return; }
    if (n > acct.balance) { toast({ title: 'Insufficient balance' }); return; }
    if (n > acct.maxWithdrawable) {
      toast({
        title: 'Wagering requirement not met',
        description: acct.wagerRemaining > 0
          ? `Play through or stack $${acct.wagerRemaining.toFixed(2)} of your deposit before withdrawing.`
          : 'Only winnings above your locked deposit can be withdrawn.',
      });
      return;
    }
    window.location.href = `/withdraw?amount=${encodeURIComponent(n)}`;
    setWdAmt('');
  };

  const doStake = async (amount) => {
    if (acct.demoMode) { toast({ title: 'Stacking is not available in Demo mode', description: 'Turn off Demo balance to lock real funds and earn profit.' }); return; }
    const n = Number(amount);
    if (!n || n <= 0) { toast({ title: 'Enter a valid amount' }); return; }
    const ok = await stake.stake(n);
    if (ok) { showNotify('Stacked!', `$${n.toFixed(2)} locked · earning ${(stake.rate * 100).toFixed(2)}% daily`); setStkAmt(''); }
    else toast({ title: 'Insufficient balance' });
  };

  const doClaimProfit = async () => {
    const p = await stake.claimProfit();
    if (p > 0) showNotify('Profit claimed!', `+$${p.toFixed(2)} added to balance`);
    else toast({ title: 'No profit to claim yet' });
  };

  const goldText = { color: '#D4AF37' };
  const heading = { fontFamily: SANS, fontWeight: 700, letterSpacing: '-0.01em' };

  return (
    <div className="relative min-h-screen pb-24" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      {/* soft gold glow backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.06), transparent 60%), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat' }} />

      {/* Sticky top navigation */}
      <header
        className="sticky top-0 z-30"
        style={{ background: 'rgba(13,13,13,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            title="Back"
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>

          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'linear-gradient(135deg,#FFD700,#C89B3C)', boxShadow: '0 0 14px rgba(212,175,55,0.45)' }}>
              <Wallet className="w-5 h-5" style={{ color: '#1a1408' }} />
            </div>
            <span className="text-lg font-extrabold tracking-tight" style={{ ...heading, color: '#D4AF37' }}>
              {tab === 'stack' ? 'Stack' : tab === 'vip' ? 'VIP' : 'Dashboard'}
            </span>
          </div>

          <button
            onClick={() => setMenuOpen(o => !o)}
            title="Menu"
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {menuOpen && (
          <div className="max-w-md mx-auto px-4 pb-3 flex items-center gap-2" style={{ animation: 'dashFadeIn 250ms ease both' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { goTab(t.id); setMenuOpen(false); }}
                  title={t.label}
                  className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{
                    border: active ? '1px solid rgba(212,175,55,0.6)' : '1px solid rgba(212,175,55,0.22)',
                    background: active ? 'linear-gradient(135deg,#FFD700,#C89B3C)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#1a1408' : '#D4AF37',
                  }}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
            {user?.role === 'admin' && (
              <button
                onClick={() => { window.location.href = '/admin'; }}
                title="Admin Panel"
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
                style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Large balance card */}
        <div
          className="dash-card relative overflow-hidden p-5"
          style={{ animation: 'dashFadeIn 400ms ease both', background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.35)' }}
        >
          <div className="pointer-events-none absolute -top-10 -right-8 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.22), transparent 70%)' }} />
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.85)' }}>Total Balance</p>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: 'linear-gradient(135deg,#FFD700,#C89B3C)', boxShadow: '0 0 18px rgba(212,175,55,0.5)' }}>
              <Wallet className="w-5 h-5" style={{ color: '#1a1408' }} />
            </div>
          </div>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-3xl font-extrabold tabular-nums" style={{ color: '#fff', ...heading }}>
              $<AnimatedNumber value={acct.balance} duration={900} decimals={2} />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <span>Withdrawable: <span style={{ color: '#D4AF37', fontWeight: 700 }}>${acct.maxWithdrawable.toFixed(2)}</span></span>
            {acct.wagerRemaining > 0 && <span>Locked: <span style={{ color: '#fb923c', fontWeight: 700 }}>${acct.wagerRemaining.toFixed(2)}</span></span>}
          </div>
        </div>

        {tab === 'wallet' && (
          <div className="flex flex-col gap-4" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            {/* Deposit & Withdraw cards */}
            <div className="grid grid-cols-1 gap-4">
              <div className="dash-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.35)' }}>
                    <ArrowDownToLine className="w-4 h-4" style={{ color: '#34d399' }} />
                  </div>
                  <h2 className="text-base font-bold" style={{ ...heading, color: '#D4AF37' }}>Deposit</h2>
                </div>
                <div className="flex gap-2 flex-wrap mb-3">
                  {[50, 100, 500, 1000].map(a => (
                    <button key={a} onClick={() => doDeposit(a)} className="px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95" style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
                      ${a}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="number" value={depAmt} onChange={e => setDepAmt(e.target.value)} placeholder="Custom amount" className="dash-input flex-1 px-4 py-3 text-sm" />
                  <button onClick={() => doDeposit(depAmt)} className="dash-btn-gold px-6 py-3 text-sm">Deposit</button>
                </div>
              </div>

              <div className="dash-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(248,113,113,0.14)', border: '1px solid rgba(248,113,113,0.35)' }}>
                    <ArrowUpFromLine className="w-4 h-4" style={{ color: '#f87171' }} />
                  </div>
                  <h2 className="text-base font-bold" style={{ ...heading, color: '#D4AF37' }}>Withdraw</h2>
                </div>
                <div className="flex gap-2 mb-2">
                  <input type="number" value={wdAmt} onChange={e => setWdAmt(e.target.value)} placeholder="Amount to withdraw" className="dash-input flex-1 px-4 py-3 text-sm" />
                  <button onClick={doWithdraw} className="dash-btn-gold px-6 py-3 text-sm">Withdraw</button>
                </div>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Withdraw creates a request — funds sent after admin approval.</p>
                {acct.wagerRemaining > 0 && (
                  <p className="text-[11px] mt-1" style={{ color: '#fb923c' }}>
                    Locked deposit: ${acct.wagerRemaining.toFixed(2)} — play through or stack before withdrawing. Withdrawable now: ${acct.maxWithdrawable.toFixed(2)}.
                  </p>
                )}
              </div>
            </div>

            {/* History */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 px-1">
                <History className="w-4 h-4" style={{ color: '#D4AF37' }} />
                <h2 className="text-sm font-bold" style={{ ...heading, color: '#D4AF37' }}>Transaction History</h2>
              </div>
              {history.length === 0 ? (
                <p className="text-[12px] px-1" style={{ color: 'rgba(255,255,255,0.45)' }}>No transactions yet.</p>
              ) : history.map(t => {
                const credit = t.type === 'deposit';
                const sm = STATUS_META[t.status] || STATUS_META.pending;
                const SIcon = sm.icon;
                return (
                  <div key={t.id} className="dash-card p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: credit ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', border: `1px solid ${credit ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
                        {credit ? <ArrowDownToLine className="w-4 h-4" style={{ color: '#34d399' }} /> : <ArrowUpFromLine className="w-4 h-4" style={{ color: '#f87171' }} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold" style={{ color: '#fff' }}>
                          {credit ? 'Deposit' : 'Withdraw'} · <span style={{ color: credit ? '#34d399' : '#f87171' }}>{credit ? '+' : '−'}${Number(t.amount).toFixed(2)}</span>
                        </p>
                        <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.method}{t.reference ? ` · ${t.reference.slice(0, 16)}` : ''}</p>
                        {t.created_date && (
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {new Date(t.created_date).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.border}` }}>
                      <SIcon className="w-3 h-3" /> {sm.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'vip' && (
          <div className="relative -mx-4 -my-4 px-4 py-4 min-h-[calc(100vh-72px)]" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            <div className="relative z-10">
              <VipLevels totalDeposits={stake.totalDeposits} />
            </div>
          </div>
        )}

        {tab === 'stack' && (
          <div className="flex flex-col gap-4" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            <div className="rounded-2xl overflow-hidden border shadow-lg" style={{ borderColor: 'rgba(212,175,55,0.3)' }}>
              <img
                src={stackBanner}
                alt={`Stack Balance — Lock your balance to earn ${(stake.rate * 100).toFixed(2)}% daily profit for ${LOCK_DAYS} days`}
                className="w-full h-auto block"
              />
            </div>

            <StackMining staked={stake.staked} pendingProfit={stake.pendingProfit} daysLocked={stake.daysLocked} unlocked={stake.unlocked} rate={stake.rate} />

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Lock, label: 'Staked', value: `$${stake.staked.toFixed(2)}` },
                { icon: Sparkles, label: 'Pending Profit', value: `$${stake.pendingProfit.toFixed(2)}` },
                { icon: null, label: 'Days Locked', value: `${stake.daysLocked}/${LOCK_DAYS}` },
                { icon: null, label: 'Unlocks In', value: stake.unlocked ? 'Ready' : `${stake.daysRemaining}d` },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="dash-card p-3 flex flex-col items-center gap-1">
                    {Icon && <Icon className="w-4 h-4" style={{ color: '#D4AF37' }} />}
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{s.label}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: '#fff' }}>{s.value}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={doClaimProfit}
              disabled={stake.pendingProfit <= 0}
              className="dash-btn-gold mx-auto px-6 py-3 text-sm flex items-center gap-2"
            >
              <Coins className="w-4 h-4" /> CLAIM PROFIT ${stake.pendingProfit.toFixed(2)}
            </button>

            <div className="dash-card p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)' }}>
                  <Layers className="w-4 h-4" style={{ color: '#D4AF37' }} />
                </div>
                <h2 className="text-base font-bold" style={{ ...heading, color: '#D4AF37' }}>Stack More</h2>
              </div>
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>Available balance: ${acct.balance.toFixed(2)}</p>
              {acct.demoMode && (
                <p className="text-[12px]" style={{ color: '#f87171' }}>Demo balance cannot be stacked — turn off Demo mode to lock real funds.</p>
              )}
              <div className="flex gap-2 flex-wrap">
                {[50, 100, 500, 1000].map(a => (
                  <button
                    key={a}
                    onClick={() => doStake(a)}
                    disabled={acct.demoMode || a > acct.balance}
                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
                    style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
                  >${a}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="number" value={stkAmt} onChange={e => setStkAmt(e.target.value)} placeholder="Amount to stack" disabled={acct.demoMode} className="dash-input flex-1 px-4 py-3 text-sm disabled:opacity-40" />
                <button onClick={() => doStake(stkAmt)} disabled={acct.demoMode} className="dash-btn-gold px-6 py-3 text-sm disabled:opacity-40">Stack</button>
              </div>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Stacking again restarts your {LOCK_DAYS}-day lock and profit timer on the total.</p>
            </div>
          </div>
        )}
      </main>
      <StylishNotify data={notify} onDone={() => setNotify(null)} />
    </div>
  );
}