import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Coins, Loader2, Check, Sparkles, ArrowDownToLine } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/LanguageContext';
import AnimatedNumber from '@/components/AnimatedNumber';
import StylishNotify from '@/components/StylishNotify';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";
const BOUNTY_LOGO = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/11d70dbce_file_000000007ca8820782fc88a9cf61d873.png';

// Airdrop page — Bounty token allocation.
// Allocation = total approved USDT deposits (1:1). Claiming persists the
// allocation on the user's profile so it shows in Profile above VIP/Promo.
export default function Airdrop() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [claimed, setClaimed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [notify, setNotify] = useState(null);
  const showNotify = (title, description) => setNotify({ title, description });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!active) return;
        setClaimed(Number(me?.bounty_allocation ?? 0));
        const txs = await base44.entities.Transaction.filter({ user_id: me.id, type: 'deposit' }, '-created_date', 500);
        const td = txs
          .filter(tx => tx.status === 'approved' || tx.status === 'completed')
          .reduce((s, tx) => s + (Number(tx.amount) || 0), 0);
        if (active) setTotalDeposits(td);
      } catch { /* ignore */ }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const allocation = totalDeposits; // 1 Bounty per 1 USDT deposited
  const alreadyClaimed = claimed > 0;

  const claim = async () => {
    if (allocation <= 0) {
      toast({ title: t("No allocation available"), description: t("Deposit USDT to earn Bounty tokens.") });
      return;
    }
    setClaiming(true);
    try {
      await base44.auth.updateMe({ bounty_allocation: allocation, bounty_claimed_at: new Date().toISOString() });
      setClaimed(allocation);
      showNotify(t("Airdrop Claimed!"), `${allocation.toFixed(2)} BOUNTY tokens added to your account`);
    } catch (e) {
      toast({ title: t("Claim failed"), description: e.message });
    } finally {
      setClaiming(false);
    }
  };

  const heading = { fontFamily: SANS, fontWeight: 700, letterSpacing: '-0.01em' };

  return (
    <div className="relative min-h-screen pb-24" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.06), transparent 60%), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat' }} />

      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{ background: 'rgba(13,13,13,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            title="Back"
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <img src={BOUNTY_LOGO} alt="Bounty" className="w-9 h-9" style={{ mixBlendMode: 'screen' }} />
            <span className="text-lg font-extrabold tracking-tight" style={{ ...heading, color: '#D4AF37' }}>{t("Airdrop")}</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="relative z-10 max-w-md mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Hero — Bounty token */}
        <div
          className="dash-card relative overflow-hidden p-6 flex flex-col items-center gap-3"
          style={{ animation: 'dashFadeIn 400ms ease both', background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(255,255,255,0.03))', border: '1px solid rgba(212,175,55,0.4)' }}
        >
          <div className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.22), transparent 70%)' }} />
          <div className="relative">
            <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 22px rgba(212,175,55,0.4)', transform: 'scale(1.15)' }} />
            <img src={BOUNTY_LOGO} alt="Bounty Token" className="w-20 h-20 relative" />
          </div>
          <h2 className="text-2xl font-extrabold" style={{ ...heading, color: '#D4AF37' }}>BOUNTY</h2>
          <p className="text-[12px] text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {t("The Golden Bounty platform token. Earn 1 BOUNTY for every 1 USDT you deposit.")}
          </p>
        </div>

        {/* Allocation card */}
        <div className="dash-card p-5 flex flex-col gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
          <div className="flex items-center gap-2">
            <img src={BOUNTY_LOGO} alt="Bounty" className="w-9 h-9" style={{ mixBlendMode: 'screen' }} />
            <h3 className="text-base font-bold" style={{ ...heading, color: '#D4AF37' }}>{t("Your Allocation")}</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{t("Total USDT Deposited")}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: '#fff' }}>${totalDeposits.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{t("Allocation Rate")}</span>
                  <span className="text-sm font-bold" style={{ color: '#D4AF37' }}>1 USDT = 1 BOUNTY</span>
                </div>
                <div className="h-px my-1" style={{ background: 'rgba(212,175,55,0.2)' }} />
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold" style={{ color: 'rgba(212,175,55,0.85)' }}>{t("Your BOUNTY Allocation")}</span>
                  <span className="text-xl font-extrabold tabular-nums" style={{ color: '#34d399' }}>
                    <AnimatedNumber value={allocation} duration={900} decimals={2} /> BOUNTY
                  </span>
                </div>
              </div>

              {alreadyClaimed && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.35)' }}>
                  <Check className="w-4 h-4" style={{ color: '#34d399' }} />
                  <p className="text-[12px]" style={{ color: '#34d399' }}>
                    {t("Already claimed")}: <span className="font-bold">{claimed.toFixed(2)} BOUNTY</span>
                  </p>
                </div>
              )}

              <button
                onClick={claim}
                disabled={claiming || allocation <= 0 || alreadyClaimed}
                className="dash-btn-gold w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                {claiming ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t("Claiming...")}</>
                ) : alreadyClaimed ? (
                  <><Check className="w-4 h-4" /> {t("Already Claimed")}</>
                ) : (
                  <><Gift className="w-4 h-4" /> {t("Claim Airdrop")}</>
                )}
              </button>

              {allocation <= 0 && (
                <button
                  onClick={() => navigate('/pay')}
                  className="w-full py-2.5 text-[12px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  style={{ border: '1px solid rgba(52,211,153,0.35)', background: 'rgba(52,211,153,0.08)', color: '#34d399' }}
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" /> {t("Deposit USDT to earn BOUNTY")}
                </button>
              )}
            </>
          )}
        </div>

        {/* Info */}
        <div className="dash-card p-4 flex flex-col gap-2" style={{ animation: 'dashFadeIn 400ms ease both' }}>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t("How it works")}</h4>
          <ul className="flex flex-col gap-1.5 text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <li>• {t("Deposit USDT into your account.")}</li>
            <li>• {t("Earn 1 BOUNTY token for every 1 USDT deposited.")}</li>
            <li>• {t("Claim your allocation anytime — it stays in your profile.")}</li>
          </ul>
        </div>
      </main>
      <StylishNotify data={notify} onDone={() => setNotify(null)} />
    </div>
  );
}