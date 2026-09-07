import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Wallet, Crown, Layers, ArrowDownToLine, ArrowUpFromLine, Shield, Lock, Coins, Sparkles, History, Menu, CheckCircle2, Clock, XCircle, Gift, ArrowLeftRight } from 'lucide-react';
import { useCasinoAccount } from '@/lib/useCasinoAccount';
import { getBalance, getMaxWithdrawable } from '@/lib/useCasinoBalance';
import { useStake, LOCK_DAYS } from '@/lib/useStake';
import StackMining from '@/components/StackMining';
import FadeImage from '@/components/FadeImage';
import TotalFundsPanel from '@/components/TotalFundsPanel';
import PendingDepositCard from '@/components/wallet/PendingDepositCard';
import DepositBonusOfferCard from '@/components/wallet/DepositBonusOfferCard';
import DepositBonusChips from '@/components/bonus/DepositBonusChips';
import StackFaq from '@/components/StackFaq';
import StackHistoryModal from '@/components/StackHistoryModal';
import PayPinCard from '@/components/PayPinCard';
import VipLevels from '@/components/VipLevels';
import BackButton from '@/components/BackButton';
import StylishNotify from '@/components/StylishNotify';
import AnimatedNumber from '@/components/AnimatedNumber';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { formatDateTime } from '@/lib/dateFormat';
import { hasTelegramBackButton } from '@/lib/telegram';
import { getProfileCache, updateProfileCache } from '@/lib/profileCache';
import { getCurrentUserIdSync } from '@/lib/currentUserId';

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
  const navigate = useNavigate();
  const [tab, setTab] = useState(params.get('tab') || 'wallet');
  const acct = useCasinoAccount();
  const stake = useStake();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [depAmt, setDepAmt] = useState('');
  const [wdAmt, setWdAmt] = useState('');
  const [stkAmt, setStkAmt] = useState('');
  // Seeded from the warm account cache so the transaction list is on screen
  // immediately when the dashboard opens.
  const [history, setHistory] = useState(() =>
    (getProfileCache().txs || []).filter(t => t.type === 'deposit' || t.type === 'withdraw'));
  const [menuOpen, setMenuOpen] = useState(false);
  // Remember the resolved Stack banner so it paints from the very first render
  // (it's already preloaded on app start — without this the admin override URL
  // only arrives after the SiteSetting fetch, so the image visibly swaps in).
  const [stackBanner, setStackBanner] = useState(() =>
    localStorage.getItem('gb_stack_banner') ||
    'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/e4a14a054_file_0000000014cc821197a44e24a1a46272.png');
  const [notify, setNotify] = useState(null);
  const [stackHistOpen, setStackHistOpen] = useState(false);
  const showNotify = (title, description) => setNotify({ title, description });

  // Keep the active tab in sync with the URL query param so navigation from the
  // bottom bar (e.g. clicking Dashboard while on ?tab=stack) updates the view.
  useEffect(() => {
    setTab(params.get('tab') || 'wallet');
  }, [params]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Start immediately with the id from the stored session — no profile
        // round-trip before the query.
        const uid = getCurrentUserIdSync() || (await base44.auth.me().catch(() => null))?.id;
        if (!uid || !active) return;
        const rows = await base44.entities.Transaction.filter({ user_id: uid }, '-created_date', 50);
        updateProfileCache({ txs: rows });
        if (active) setHistory(rows.filter(t => t.type === 'deposit' || t.type === 'withdraw'));
      } catch { /* ignore */ }
      try {
        const list = await base44.entities.SiteSetting.filter({ name: 'stack_banner', active: true });
        if (list[0]?.image_url) {
          localStorage.setItem('gb_stack_banner', list[0].image_url);
          if (active) setStackBanner(list[0].image_url);
        }
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
    if (!n || n <= 0) { toast({ title: t("Enter a valid amount") }); return; }
    if (n < 3) { toast({ title: t("Minimum deposit is $3.00") }); return; }
    navigate(`/pay?amount=${encodeURIComponent(n)}`);
    setDepAmt('');
  };

  const doWithdraw = () => {
    const n = Number(wdAmt);
    if (!n || n <= 0) { showNotify(t("Enter a valid amount")); return; }
    if (n < 3) { showNotify(t("Minimum withdrawal is $3.00")); return; }
    // Purely local, synchronous checks so the button responds instantly —
    // never wait on the server here. The server re-validates on submit.
    const cents = Math.round(n * 100);
    const bal = getBalance();
    const max = getMaxWithdrawable();
    if (cents > Math.round(bal * 100)) { showNotify(t("Insufficient balance")); return; }
    if (cents > Math.round(max * 100)) {
      showNotify(
        t("Wagering requirement not met"),
        bal - max > 0
          ? `Play through or stack $${(bal - max).toFixed(2)} of your deposit before withdrawing.`
          : t("Only winnings above your locked deposit can be withdrawn.")
      );
      return;
    }
    setWdAmt('');
    navigate(`/withdraw?amount=${encodeURIComponent(n)}`);
  };

  const doStake = async (amount) => {
    if (acct.demoMode) { toast({ title: t("Stacking is not available in Demo mode"), description: t("Turn off Demo balance to lock real funds and earn profit.") }); return; }
    const n = Number(amount);
    if (!n || n <= 0) { toast({ title: t("Enter a valid amount") }); return; }
    const res = await stake.stake(n);
    if (res?.ok) { showNotify(t("Stacked!"), `$${n.toFixed(2)} locked · earning ${(stake.rate * 100).toFixed(2)}% daily`); setStkAmt(''); }
    else if (String(res?.reason || '').toLowerCase().includes('bonus')) {
      toast({
        title: t("Bonus funds can't be stacked"),
        description: t("Finish your bonus turnover first — only your own real balance can be locked in the Stack."),
      });
    }
    else toast({ title: t("Insufficient balance") });
  };

  const [claiming, setClaiming] = useState(false);

  const doClaimProfit = async () => {
    if (claiming) return;
    setClaiming(true);
    const p = await stake.claimProfit();
    setClaiming(false);
    if (p > 0) showNotify(t("Profit claimed!"), `+$${p.toFixed(2)} added to balance`);
    else toast({ title: t("No profit to claim yet") });
  };

  const goldText = { color: '#D4AF37' };
  const heading = { fontFamily: SANS, fontWeight: 700, letterSpacing: '-0.01em' };

  return (
    <div className="relative min-h-screen pb-24 lg:pb-6" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      {/* soft gold glow backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.06), transparent 60%), url(https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat', backgroundAttachment: 'fixed' }} />

      {/* Sticky top navigation */}
      <header
        className="sticky top-0 z-30"
        style={{ background: 'rgba(13,13,13,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div
          className="relative max-w-none mx-auto px-4 py-3 flex items-center gap-3"
          style={hasTelegramBackButton() ? { paddingTop: 'calc(var(--tg-content-safe-area-inset-top, 2.25rem) + 0.25rem)' } : undefined}
        >
          {!hasTelegramBackButton() && (
            <button
              onClick={() => window.history.back()}
              title="Back"
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
              style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 pointer-events-none">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'linear-gradient(135deg,#FFD700,#C89B3C)', boxShadow: '0 0 14px rgba(212,175,55,0.45)' }}>
              <Wallet className="w-5 h-5" style={{ color: '#1a1408' }} />
            </div>
            <span className="text-lg font-extrabold tracking-tight whitespace-nowrap" style={{ ...heading, color: '#D4AF37' }}>
              {tab === 'stack' ? t("Stack") : tab === 'vip' ? t("VIP") : tab === 'paypin' ? t("Pay Pin") : t("Dashboard")}
            </span>
          </div>
          <div className="flex-1" />

          {tab !== 'stack' && tab !== 'vip' && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              title="Menu"
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95 shrink-0"
              /* Nudged left so Telegram's own top-right controls don't cover it */
              style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37', marginRight: hasTelegramBackButton() ? 'calc(2.75rem + 20px)' : '8px' }}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {menuOpen && tab !== 'stack' && tab !== 'vip' && (
          <div className="max-w-none mx-auto px-4 pb-3 flex items-center gap-2 overflow-x-auto" style={{ animation: 'dashFadeIn 250ms ease both', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {TABS.map(tb => {
              const Icon = tb.icon;
              const active = tab === tb.id;
              return (
                <button
                  key={tb.id}
                  onClick={() => { goTab(tb.id); setMenuOpen(false); }}
                  title={t(tb.label)}
                  className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 whitespace-nowrap"
                  style={{
                    border: active ? '1px solid rgba(212,175,55,0.6)' : '1px solid rgba(212,175,55,0.22)',
                    background: active ? 'linear-gradient(135deg,#FFD700,#C89B3C)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#1a1408' : '#D4AF37',
                  }}
                >
                  <Icon className="w-4 h-4" /> {t(tb.label)}
                </button>
              );
            })}
            <button
              onClick={() => { goTab('paypin'); setMenuOpen(false); }}
              title={t("Pay Pin")}
              className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 whitespace-nowrap"
              style={{
                border: tab === 'paypin' ? '1px solid rgba(212,175,55,0.6)' : '1px solid rgba(212,175,55,0.22)',
                background: tab === 'paypin' ? 'linear-gradient(135deg,#FFD700,#C89B3C)' : 'rgba(255,255,255,0.03)',
                color: tab === 'paypin' ? '#1a1408' : '#D4AF37',
              }}
            >
              <Lock className="w-4 h-4" /> {t("Pay Pin")}
            </button>
            <button
              onClick={() => navigate('/swap')}
              title={t("Swap")}
              className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 whitespace-nowrap"
              style={{ border: '1px solid rgba(212,175,55,0.22)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
            >
              <ArrowLeftRight className="w-4 h-4" /> {t("Swap")}
            </button>
            {user?.role !== 'agent' && user?.role !== 'admin' && (
              <button
                onClick={() => navigate('/agents')}
                title={t("Agents")}
                className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 whitespace-nowrap"
                style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
              >
                <Shield className="w-4 h-4" /> {t("Agents")}
              </button>
            )}
            {(user?.role === 'agent' || user?.role === 'admin') && (
              <button
                onClick={() => navigate('/agent')}
                title={t("Agent Panel")}
                className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 whitespace-nowrap"
                style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
              >
                <Shield className="w-4 h-4" /> {t("Agent")}
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                title={t("Admin Panel")}
                className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 whitespace-nowrap"
                style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
              >
                <Shield className="w-4 h-4" /> {t("Admin")}
              </button>
            )}
          </div>
        )}
      </header>

      <main className="relative z-10 max-w-none mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Large balance card */}
        <div
          className="dash-card relative overflow-hidden p-5"
          style={{ animation: 'dashFadeIn 400ms ease both', background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.35)' }}
        >
          <div className="pointer-events-none absolute -top-10 -right-8 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.22), transparent 70%)' }} />
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.85)' }}>{t("Total Balance")}</p>
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
            <span>{t("Withdrawable:")} <span style={{ color: '#D4AF37', fontWeight: 700 }}>${acct.maxWithdrawable.toFixed(2)}</span></span>
          </div>
        </div>

        {tab === 'wallet' && (
          <div className="flex flex-col gap-4" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            <PendingDepositCard />
            <DepositBonusOfferCard />
            {/* Deposit & Withdraw cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="dash-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.35)' }}>
                    <ArrowDownToLine className="w-4 h-4" style={{ color: '#34d399' }} />
                  </div>
                  <h2 className="text-base font-bold" style={{ ...heading, color: '#D4AF37' }}>{t("Deposit")}</h2>
                </div>
                <DepositBonusChips />
                <div className="flex gap-2 flex-wrap mb-3">
                  {[50, 100, 500, 1000].map(a => (
                    <button key={a} onClick={() => doDeposit(a)} className="px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95" style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}>
                      ${a}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="number" value={depAmt} onChange={e => setDepAmt(e.target.value)} placeholder={t("Custom amount")} className="dash-input flex-1 px-4 py-3 text-sm" />
                  <button onClick={() => doDeposit(depAmt)} className="dash-btn-gold px-6 py-3 text-sm">{t("Deposit")}</button>
                </div>
              </div>

              <div className="dash-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(248,113,113,0.14)', border: '1px solid rgba(248,113,113,0.35)' }}>
                    <ArrowUpFromLine className="w-4 h-4" style={{ color: '#f87171' }} />
                  </div>
                  <h2 className="text-base font-bold" style={{ ...heading, color: '#D4AF37' }}>{t("Withdraw")}</h2>
                </div>
                <div className="flex gap-2 mb-2">
                  <input type="number" value={wdAmt} onChange={e => setWdAmt(e.target.value)} placeholder={t("Amount to withdraw")} className="dash-input flex-1 px-4 py-3 text-sm" />
                  <button
                    onClick={doWithdraw}
                    className="px-6 py-3 text-sm rounded-2xl font-extrabold transition-all active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #34d399, #059669)',
                      color: '#062018',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(52,211,153,0.35), inset 0 1px 0 rgba(255,255,255,0.45)',
                    }}
                  >{t("Withdraw")}</button>
                </div>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{t("Withdraw creates a request — funds sent after admin approval.")}</p>
              </div>
            </div>

            {/* History */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 px-1">
                <History className="w-4 h-4" style={{ color: '#D4AF37' }} />
                <h2 className="text-sm font-bold" style={{ ...heading, color: '#D4AF37' }}>{t("Transaction History")}</h2>
              </div>
              {history.length === 0 ? (
                <p className="text-[12px] px-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{t("No transactions yet.")}</p>
              ) : history.map(tx => {
                const credit = tx.type === 'deposit';
                const sm = STATUS_META[tx.status] || STATUS_META.pending;
                const SIcon = sm.icon;
                return (
                  <div key={tx.id} className="dash-card p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: credit ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', border: `1px solid ${credit ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
                        {credit ? <ArrowDownToLine className="w-4 h-4" style={{ color: '#34d399' }} /> : <ArrowUpFromLine className="w-4 h-4" style={{ color: '#f87171' }} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold" style={{ color: '#fff' }}>
                          {credit ? t("Deposit") : t("Withdraw")} · <span style={{ color: credit ? '#34d399' : '#f87171' }}>{credit ? '+' : '−'}${Number(tx.amount).toFixed(2)}</span>
                        </p>
                        <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{tx.method}{tx.reference ? ` · ${tx.reference.slice(0, 16)}` : ''}</p>
                        {tx.created_date && (
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {formatDateTime(tx.created_date, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
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

        {tab === 'paypin' && <PayPinCard />}

        {tab === 'vip' && (
          <div className="relative -mx-4 -my-4 px-4 py-4 min-h-[calc(100vh-72px)]" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            <div className="relative z-10 flex flex-col gap-4">
              <VipLevels totalDeposits={stake.totalDeposits} />
              <button
                onClick={() => navigate('/airdrop')}
                className="w-full py-3.5 text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#06281f', border: 'none', borderRadius: '14px', fontWeight: 800, boxShadow: '0 4px 14px rgba(52,211,153,0.35), inset 0 1px 0 rgba(255,255,255,0.45)' }}
              >
                <Gift className="w-4 h-4" /> {t("Claim Airdrop")}
              </button>
            </div>
          </div>
        )}

        {tab === 'stack' && (
          <div className="flex flex-col gap-4" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            <div className="rounded-2xl overflow-hidden border shadow-lg" style={{ borderColor: 'rgba(212,175,55,0.3)' }}>
              <FadeImage
                src={stackBanner}
                alt={`Stack Balance — Lock your balance to earn ${(stake.rate * 100).toFixed(2)}% daily profit for ${LOCK_DAYS} days`}
                className="w-full h-auto block"
              />
            </div>

            <StackMining staked={stake.staked} pendingProfit={stake.pendingProfit} daysLocked={stake.daysLocked} unlocked={stake.unlocked} rate={stake.rate} />

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3">
              {[
                { icon: Lock, label: t("Staked"), value: `$${stake.staked.toFixed(2)}` },
                { icon: Sparkles, label: t("Pending Profit"), value: `$${stake.pendingProfit.toFixed(2)}` },
                { icon: null, label: t("Days Locked"), value: `${stake.daysLocked}/${LOCK_DAYS}` },
                { icon: null, label: t("Unlocks In"), value: stake.unlocked ? t("Ready") : `${stake.daysRemaining}d` },
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

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={doClaimProfit}
                disabled={claiming || stake.pendingProfit <= 0}
                className="px-6 py-3 text-sm flex items-center gap-2 rounded-2xl font-extrabold transition-all active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #34d399, #059669)',
                  color: '#062018',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(52,211,153,0.35), inset 0 1px 0 rgba(255,255,255,0.45)',
                }}
              >
                <Coins className="w-4 h-4" /> {t("CLAIM PROFIT")} ${stake.pendingProfit.toFixed(2)}
              </button>
              <button
                onClick={() => setStackHistOpen(true)}
                className="px-4 py-3 text-sm flex items-center gap-2 rounded-2xl font-extrabold transition-all active:scale-95"
                style={{ border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
              >
                <History className="w-4 h-4" /> {t("History")}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="dash-card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)' }}>
                    <Layers className="w-4 h-4" style={{ color: '#D4AF37' }} />
                  </div>
                  <h2 className="text-base font-bold" style={{ ...heading, color: '#D4AF37' }}>{t("Stack More")}</h2>
                </div>
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{t("Available balance:")} ${acct.balance.toFixed(2)}</p>
                {acct.demoMode && (
                  <p className="text-[12px]" style={{ color: '#f87171' }}>{t("Demo balance cannot be stacked — turn off Demo mode to lock real funds.")}</p>
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
                  <input type="number" value={stkAmt} onChange={e => setStkAmt(e.target.value)} placeholder={t("Amount to stack")} disabled={acct.demoMode} className="dash-input flex-1 px-4 py-3 text-sm disabled:opacity-40" />
                  <button onClick={() => doStake(stkAmt)} disabled={acct.demoMode} className="dash-btn-gold px-6 py-3 text-sm disabled:opacity-40">{t("Stack")}</button>
                </div>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Stacking again restarts your {LOCK_DAYS}-day lock and profit timer on the total.</p>
              </div>

              <TotalFundsPanel />
            </div>

            <StackFaq />
          </div>
        )}
      </main>
      <StylishNotify data={notify} onDone={() => setNotify(null)} />
      <StackHistoryModal open={stackHistOpen} onClose={() => setStackHistOpen(false)} />
    </div>
  );
}