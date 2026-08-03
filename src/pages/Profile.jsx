import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  User as UserIcon, Phone, Hash, LogOut, Loader2, Check,
  Wallet, ArrowDownToLine, ArrowUpFromLine, Crown, Gamepad2, Copy, Coins, History,
  Menu, Pencil, Ticket, Gift, Users, Sparkles,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useCasinoBalance } from '@/lib/useCasinoBalance';
import { getVipLevel, getNextVipLevel, BASE_RATE } from '@/lib/vipLevels';
import AnimatedNumber from '@/components/AnimatedNumber';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/lib/LanguageContext';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

const genUid = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '');

const GAME_NAMES = {
  'wild-bounty': 'Wild Bounty',
  'lucky-wheel': 'Lucky Wheel',
  'hi-lo': 'High or Low',
  plinko: 'Plinko',
  mines: 'Mines',
  fullhouse: 'Super ACE',
  'rocket-crash': 'Rocket Crash',
};

const TX_META = {
  deposit: { icon: ArrowDownToLine, color: '#34d399', bg: 'rgba(52,211,153,0.12)', sign: '+' },
  bonus: { icon: Crown, color: '#D4AF37', bg: 'rgba(212,175,55,0.12)', sign: '+' },
  withdraw: { icon: ArrowUpFromLine, color: '#f87171', bg: 'rgba(248,113,113,0.12)', sign: '-' },
  adjustment: { icon: ArrowUpFromLine, color: '#cbd5e1', bg: 'rgba(203,213,225,0.08)', sign: '-' },
};

const STATUS_META = {
  completed: { color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)' },
  approved: { color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)' },
  pending: { color: '#fb923c', bg: 'rgba(251,146,60,0.14)', border: 'rgba(251,146,60,0.4)' },
  rejected: { color: '#f87171', bg: 'rgba(248,113,113,0.14)', border: 'rgba(248,113,113,0.4)' },
};

const OUTCOME_META = {
  win: { color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)' },
  loss: { color: '#f87171', bg: 'rgba(248,113,113,0.14)', border: 'rgba(248,113,113,0.4)' },
  push: { color: '#fb923c', bg: 'rgba(251,146,60,0.14)', border: 'rgba(251,146,60,0.4)' },
};

const TABS = [
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'games', label: 'Games', icon: Gamepad2 },
];

export default function Profile() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { balance } = useCasinoBalance();
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('wallet');
  const [txs, setTxs] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [view, setView] = useState('profile');
  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [bountyAllocation, setBountyAllocation] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let u = await base44.auth.me();
        if (!u.uid || !/^\d{10}$/.test(String(u.uid))) {
          const uid = genUid();
          try { await base44.auth.updateMe({ uid }); u = { ...u, uid }; } catch { /* ignore */ }
        }
        if (!active) return;
        setProfile(u);
        setUsername(u.username || '');
        setPhone(u.phone || '');
        setBountyAllocation(Number(u?.bounty_allocation ?? 0));
      } catch {
        /* ignore */
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (!e.target.closest('[data-menu]')) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const loadHistory = useCallback(async () => {
    if (!profile) return;
    setLoadingHist(true);
    try {
      const [t, a] = await Promise.all([
        base44.entities.Transaction.filter({ user_id: profile.id }, '-created_date', 50),
        base44.entities.PlayerActivity.filter({ user_id: profile.id }, '-created_date', 50),
      ]);
      setTxs(t);
      setActivity(a);
      const td = t
        .filter(x => x.type === 'deposit' && (x.status === 'approved' || x.status === 'completed'))
        .reduce((s, x) => s + (Number(x.amount) || 0), 0);
      setTotalDeposits(td);
    } catch {
      /* ignore */
    } finally {
      setLoadingHist(false);
    }
  }, [profile]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const loadRewards = useCallback(async () => {
    if (!profile) return;
    setLoadingRewards(true);
    try {
      const rows = await base44.entities.Transaction.filter({ user_id: profile.id, type: 'bonus' }, '-created_date', 50);
      setRewards(rows.filter(r => r.method === 'referral-commission'));
    } catch { /* ignore */ } finally { setLoadingRewards(false); }
  }, [profile]);

  useEffect(() => { if (view === 'rewards') loadRewards(); }, [view, loadRewards]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ username, phone });
      setProfile((p) => ({ ...p, username, phone }));
      toast({ title: t("Profile updated") });
    } catch (e) {
      toast({ title: t("Update failed"), description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const copy = async (text, label) => {
    try { await navigator.clipboard.writeText(text); toast({ title: `${label} copied` }); } catch { /* ignore */ }
  };

  const uid = profile?.uid || '';
  const promoCode = profile?.promo_code || (uid ? 'GB' + uid : '');
  const vip = getVipLevel(totalDeposits);
  const next = getNextVipLevel(totalDeposits);
  const vipRate = vip?.rate ?? BASE_RATE;
  const vipProgress = next ? Math.min(100, (totalDeposits / next.minDeposit) * 100) : 100;

  const goldActiveStyle = {
    background: 'linear-gradient(135deg, #FFD700, #C89B3C)',
    color: '#1a1408',
    boxShadow: '0 6px 18px rgba(212,175,55,0.4)',
  };
  const goldIdleStyle = {
    border: '1px solid rgba(212,175,55,0.25)',
    background: 'rgba(255,255,255,0.03)',
    color: '#D4AF37',
  };

  return (
    <div className="relative min-h-screen pb-24" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 55% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.06), transparent 60%), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat' }} />

      {/* Header — text unchanged */}
      <header
        className="sticky top-0 z-30"
        style={{ background: 'rgba(13,13,13,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3 relative" data-menu>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => window.history.back()}
            title="Back"
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="flex-1 text-center">
            <span className="text-lg font-extrabold tracking-tight" style={{ color: '#D4AF37' }}>{t("Profile")}</span>
          </div>
          <div className="w-10" />

          {menuOpen && (
            <div className="absolute left-4 top-14 z-40 w-48 rounded-2xl"
              style={{ border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(13,13,13,0.97)', boxShadow: '0 14px 40px rgba(0,0,0,0.7)', animation: 'dashFadeIn 200ms ease both' }}>
              <Link to="/pay" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-white text-sm font-semibold hover:bg-white/5 transition-colors"
                style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                <ArrowDownToLine className="w-4 h-4" style={{ color: '#34d399' }} /> {t("Deposit")}
              </Link>
              <Link to="/withdraw" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-white text-sm font-semibold hover:bg-white/5 transition-colors"
                style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                <ArrowUpFromLine className="w-4 h-4" style={{ color: '#f87171' }} /> {t("Withdraw")}
              </Link>
              <button onClick={() => { setTab('wallet'); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-white text-sm font-semibold hover:bg-white/5 transition-colors">
                <History className="w-4 h-4" style={{ color: '#D4AF37' }} /> {t("History")}
              </button>
              <button onClick={() => { setView('rewards'); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-white text-sm font-semibold hover:bg-white/5 transition-colors"
                style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                <Gift className="w-4 h-4" style={{ color: '#D4AF37' }} /> {t("Rewards")}
              </button>
              <div className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                <LanguageSwitcher />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Profile card */}
        <div className="dash-card p-5 flex flex-col items-center gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
          {/* Avatar with golden glow */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 14px rgba(212,175,55,0.25)', transform: 'scale(1.1)' }} />
            <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center relative" style={{ border: '2px solid rgba(212,175,55,0.6)', background: 'linear-gradient(135deg, #FFD700, #C89B3C)' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10" style={{ color: '#1a1408' }} />
              )}
            </div>
          </div>

          {/* Name + edit */}
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: '#fff' }}>
            {profile?.username || profile?.full_name || t("Player")}
            <button onClick={() => setEditOpen(o => !o)} style={{ color: '#D4AF37' }} className="hover:opacity-80 transition-opacity" title="Edit profile">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </h2>
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{profile?.email}</p>

          {/* User ID pill with copy */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <Hash className="w-3.5 h-3.5" style={{ color: 'rgba(212,175,55,0.8)' }} />
            <span className="text-[12px] font-mono tracking-wider select-all" style={{ color: 'rgba(255,255,255,0.85)' }}>{uid || '—'}</span>
            <button onClick={() => copy(uid, 'User ID')} style={{ color: 'rgba(212,175,55,0.7)' }} className="ml-0.5 hover:opacity-80 transition-opacity" title="Copy User ID">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Promo code card */}
          <button
            onClick={() => copy(promoCode, 'Promo code')}
            className="w-full px-4 py-3 rounded-2xl flex items-center justify-between gap-2 transition-all active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.35)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)' }}>
                <Ticket className="w-4 h-4" style={{ color: '#D4AF37' }} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t("Promo Code")}</p>
                <p className="text-[14px] font-bold mt-0.5" style={{ color: '#fff' }}>{promoCode || '—'}</p>
              </div>
            </div>
            <Copy className="w-4 h-4" style={{ color: 'rgba(212,175,55,0.7)' }} />
          </button>

          {/* Bounty token allocation — shown above VIP & Promo */}
          <button
            onClick={() => window.location.href = '/airdrop'}
            className="w-full px-4 py-3 rounded-2xl flex items-center justify-between gap-2 transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.4)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)' }}>
                <Sparkles className="w-4 h-4" style={{ color: '#D4AF37' }} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t("Bounty Token Allocation")}</p>
                <p className="text-[14px] font-bold mt-0.5 tabular-nums" style={{ color: bountyAllocation > 0 ? '#34d399' : 'rgba(255,255,255,0.5)' }}>
                  {bountyAllocation.toFixed(2)} BOUNTY
                </p>
              </div>
            </div>
            <Gift className="w-4 h-4" style={{ color: 'rgba(212,175,55,0.7)' }} />
          </button>

          {/* VIP Level + Stack Rate — two equal info cards */}
          <div className="w-full grid grid-cols-2 gap-3">
            <div className="dash-card p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4" style={{ color: vip?.color || '#8a7a5a' }} />
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t("VIP Level")}</p>
              </div>
              <p className="text-[13px] font-bold" style={{ color: vip?.color || '#D4AF37' }}>
                {vip ? `${vip.name} · L${vip.level}` : 'None'}
              </p>
            </div>
            <div className="dash-card p-3 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4" style={{ color: '#D4AF37' }} />
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t("Stack Rate")}</p>
              </div>
              <p className="text-[13px] font-bold tabular-nums" style={{ color: '#34d399' }}>{(vipRate * 100).toFixed(2)}%</p>
            </div>
          </div>

          {/* Upgrade progress bar */}
          {next ? (
            <div className="w-full flex flex-col gap-1.5">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: vipProgress + '%', background: 'linear-gradient(90deg, #FFD700, #C89B3C)', boxShadow: '0 0 10px rgba(212,175,55,0.6)' }} />
              </div>
              <p className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                ${(next.minDeposit - totalDeposits).toFixed(0)} more to {next.name}
              </p>
            </div>
          ) : (
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{t("Highest VIP reached · Diamond")}</p>
          )}
        </div>

        {/* Edit panel */}
        {editOpen && (
          <div className="dash-card p-5 flex flex-col gap-3" style={{ animation: 'dashFadeIn 300ms ease both' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: '#D4AF37' }}>{t("Edit Profile")}</h3>
              <button onClick={() => setEditOpen(false)} className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>{t("close")}</button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t("Name / Username")}</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("Set a username")}
                className="dash-input w-full px-4 py-2.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t("Mobile Number")}</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'rgba(212,175,55,0.6)' }} />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="dash-input w-full pl-9 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="dash-btn-gold mx-auto px-6 py-2.5 text-sm flex items-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("Saving...")}</> : <><Check className="w-4 h-4" /> {t("Save")}</>}
            </button>
          </div>
        )}

        {view === 'rewards' && (
          <div className="flex flex-col gap-4" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            <div className="flex items-center justify-between">
              <button onClick={() => setView('profile')} className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#D4AF37' }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                {t("Back")}
              </button>
              <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>{t("Rewards")}</h3>
              <div className="w-12" />
            </div>

            {/* Referral earnings card */}
            <div className="dash-card p-5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.35)' }}>
              <div className="flex items-center justify-center w-11 h-11 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)', boxShadow: '0 0 8px rgba(212,175,55,0.25)' }}>
                <Gift className="w-5 h-5" style={{ color: '#1a1408' }} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.85)' }}>{t("Referral Earnings")}</p>
                <p className="text-2xl font-extrabold tabular-nums mt-0.5" style={{ color: '#fff' }}>
                  $<AnimatedNumber value={Number(profile?.referral_earnings ?? 0)} duration={900} decimals={2} />
                </p>
              </div>
              <Users className="w-5 h-5" style={{ color: 'rgba(212,175,55,0.5)' }} />
            </div>

            {/* Promo code share card */}
            <button
              onClick={() => copy(promoCode, 'Promo code')}
              className="dash-card p-4 flex items-center justify-between gap-2 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)' }}>
                  <Ticket className="w-4 h-4" style={{ color: '#D4AF37' }} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t("Your Promo Code")}</p>
                  <p className="text-[14px] font-bold mt-0.5" style={{ color: '#fff' }}>{promoCode || '—'}</p>
                </div>
              </div>
              <Copy className="w-4 h-4" style={{ color: 'rgba(212,175,55,0.7)' }} />
            </button>
            <p className="text-[11px] px-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t("Share your code. New players get $1 in their Stack; you earn 5% commission on every deposit they make.")}
            </p>

            {/* Redeemed status */}
            <div className="dash-card p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: profile?.promo_claimed ? 'rgba(52,211,153,0.12)' : 'rgba(251,146,60,0.12)', border: `1px solid ${profile?.promo_claimed ? 'rgba(52,211,153,0.35)' : 'rgba(251,146,60,0.35)'}` }}>
                {profile?.promo_claimed ? <Check className="w-4 h-4" style={{ color: '#34d399' }} /> : <Ticket className="w-4 h-4" style={{ color: '#fb923c' }} />}
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-bold" style={{ color: '#fff' }}>{profile?.promo_claimed ? t("Promo code redeemed") : t("No promo code redeemed yet")}</p>
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{profile?.promo_claimed ? t("You received your $1 Stack bonus.") : t("Enter a promo code on signup to get $1 in your Stack.")}</p>
              </div>
            </div>

            {/* Commission history */}
            <div className="flex items-center gap-2 px-1">
              <Coins className="w-4 h-4" style={{ color: '#D4AF37' }} />
              <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>{t("Commission History")}</h3>
            </div>
            {loadingRewards ? (
              <p className="text-[12px] px-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{t("Loading...")}</p>
            ) : rewards.length === 0 ? (
              <p className="text-[12px] px-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{t("No commission earned yet. Share your promo code to start earning.")}</p>
            ) : rewards.map((r) => (
              <div key={r.id} className="dash-card p-4 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)' }}>
                  <Gift className="w-4 h-4" style={{ color: '#D4AF37' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: '#fff' }}>{t("Referral Commission")}</p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{fmtDate(r.created_date)}</p>
                  {r.note && <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.note}</p>}
                </div>
                <span className="font-bold tabular-nums text-sm shrink-0" style={{ color: '#34d399' }}>+${Number(r.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {view === 'profile' && (
        <>
        {/* Segmented tabs — Wallet & Games */}
        <div className="grid grid-cols-2 gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
          {TABS.map(tb => {
            const Icon = tb.icon;
            const active = tab === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-[14px] text-sm font-bold transition-all active:scale-95"
                style={active ? goldActiveStyle : goldIdleStyle}
              >
                <Icon className="w-4 h-4" /> {t(tb.label)}
              </button>
            );
          })}
        </div>

        {tab === 'wallet' && (
          <div className="flex flex-col gap-4" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            {/* Wallet balance card */}
            <div className="dash-card p-5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.35)' }}>
              <div className="flex items-center justify-center w-11 h-11 rounded-full shrink-0" style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)', boxShadow: '0 0 8px rgba(212,175,55,0.25)' }}>
                <Wallet className="w-5 h-5" style={{ color: '#1a1408' }} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(212,175,55,0.85)' }}>{t("Wallet Balance")}</p>
                <p className="text-2xl font-extrabold tabular-nums mt-0.5" style={{ color: '#fff' }}>
                  $<AnimatedNumber value={balance} duration={900} decimals={2} />
                </p>
              </div>
              <Coins className="w-5 h-5" style={{ color: 'rgba(212,175,55,0.5)' }} />
            </div>

            {/* History header */}
            <div className="flex items-center gap-2 px-1">
              <History className="w-4 h-4" style={{ color: '#D4AF37' }} />
              <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>{t("Deposit & Withdraw History")}</h3>
            </div>

            {loadingHist ? (
              <p className="text-[12px] px-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{t("Loading...")}</p>
            ) : txs.length === 0 ? (
              <p className="text-[12px] px-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{t("No transactions yet.")}</p>
            ) : (
              txs.map((t) => {
                const m = TX_META[t.type] || TX_META.adjustment;
                const Icon = m.icon;
                const sm = STATUS_META[t.status] || STATUS_META.pending;
                const borderStyle = '1px solid ' + sm.border;
                return (
                  <div key={t.id} className="dash-card p-4 flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: m.bg, border: borderStyle }}>
                      <Icon className="w-4 h-4" style={{ color: m.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold capitalize" style={{ color: '#fff' }}>{t.type}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{fmtDate(t.created_date)}</p>
                      {t.note && <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.note}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-bold tabular-nums text-sm" style={{ color: m.color }}>{m.sign}${Number(t.amount).toFixed(2)}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ color: sm.color, background: sm.bg, border: borderStyle }}>{t.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'games' && (
          <div className="flex flex-col gap-4" style={{ animation: 'dashFadeIn 400ms ease both' }}>
            <div className="flex items-center gap-2 px-1">
              <Gamepad2 className="w-4 h-4" style={{ color: '#D4AF37' }} />
              <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>{t("Betting & Win/Loss History")}</h3>
            </div>

            {loadingHist ? (
              <p className="text-[12px] px-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{t("Loading...")}</p>
            ) : activity.length === 0 ? (
              <p className="text-[12px] px-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{t("No games played yet.")}</p>
            ) : (
              activity.map((a) => {
                const om = OUTCOME_META[a.outcome] || OUTCOME_META.loss;
                const omBorder = '1px solid ' + om.border;
                return (
                  <div key={a.id} className="dash-card p-4 flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)' }}>
                      <Gamepad2 className="w-4 h-4" style={{ color: '#D4AF37' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: '#fff' }}>{GAME_NAMES[a.game_id] || a.game_id}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Bet ${Number(a.bet).toFixed(2)} · {fmtDate(a.created_date)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-bold tabular-nums text-sm" style={{ color: '#D4AF37' }}>${Number(a.win).toFixed(2)}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg" style={{ color: om.color, background: om.bg, border: omBorder }}>{a.outcome}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        </>
        )}

        {/* Log out */}
        <button
          onClick={() => logout()}
          className="mx-auto px-6 py-2.5 rounded-[14px] text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)', color: '#f87171' }}
        >
          <LogOut className="w-4 h-4" /> {t("Log Out")}
        </button>
      </main>
    </div>
  );
}