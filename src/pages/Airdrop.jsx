import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Coins, Loader2, Check, Sparkles, ArrowDownToLine, Map, X } from 'lucide-react';

const PDF_URL = 'https://media.base44.com/files/public/6a5698edffaa42a5b6637776/cf7fd6d28_Golden_Bounty_Roadmap_2026_2027_Updated.pdf';
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
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [claimed, setClaimed] = useState(0);
  const [referralBounty, setReferralBounty] = useState(0);
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
        setReferralBounty(Number(me?.referral_bounty ?? 0));
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

  const allocation = totalDeposits * 2 + referralBounty; // 2 Bounty per USDT deposited + referral bounty
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
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.06), transparent 60%), url(https://media.base44.com/images/public/6a5698edffaa42a5b6637776/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat', backgroundAttachment: 'fixed' }} />

      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{ background: 'rgba(13,13,13,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div className="max-w-md lg:max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
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

      {/* Roadmap PDF Modal */}
      {roadmapOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(212,175,55,0.25)' }}>
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5" style={{ color: '#D4AF37' }} />
              <span className="font-bold text-base" style={{ color: '#D4AF37' }}>Roadmap 2026–2027</span>
            </div>
            <button onClick={() => setRoadmapOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-95" style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.05)', color: '#D4AF37' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(PDF_URL)}&embedded=true`}
              className="w-full h-full"
              title="Golden Bounty Roadmap"
              style={{ border: 'none' }}
            />
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-md lg:max-w-5xl mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Roadmap button */}
        <button
          onClick={() => setRoadmapOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all active:scale-[0.98]"
          style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(212,175,55,0.35)', boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.08))', border: '1px solid rgba(212,175,55,0.4)' }}>
              <Map className="w-4 h-4" style={{ color: '#D4AF37' }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold" style={{ color: '#fff' }}>Roadmap</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>2026 – 2027 Platform Vision</p>
            </div>
          </div>
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(212,175,55,0.7)' }}><path d="M9 18l6-6-6-6" /></svg>
        </button>
        {/* Hero — Bounty token banner — scaled up + clipped so the black
            border falls outside the visible area. */}
        <div className="relative overflow-hidden" style={{ animation: 'dashFadeIn 400ms ease both' }}>
          <img
            src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/6b0feb46f_file_00000000a2c082079005efbe99d662d8.png"
            alt="BOUNTY — The Golden Bounty platform token. Earn 2 BOUNTY for every 1 USDT you deposit."
            className="block select-none w-full"
            draggable={false}
            style={{ transform: 'scale(1.22) translateY(8px)', transformOrigin: 'center center' }}
          />
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
                  <span className="text-sm font-bold" style={{ color: '#D4AF37' }}>1 USDT = 2 BOUNTY</span>
                </div>
                {referralBounty > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{t("Referral Bounty")}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: '#34d399' }}>+{referralBounty.toFixed(2)} BOUNTY</span>
                  </div>
                )}
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
                className="w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', color: '#06281f', border: 'none', borderRadius: '14px', fontWeight: 800, boxShadow: '0 4px 14px rgba(52,211,153,0.35), inset 0 1px 0 rgba(255,255,255,0.45)' }}
              >
                {claiming ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t("Claiming...")}</>
                ) : alreadyClaimed ? (
                  <><Check className="w-4 h-4" /> {t("Already Claimed")}</>
                ) : (
                  <><Gift className="w-4 h-4" /> {t("Claim Bounty")}</>
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
            <li>• {t("Earn 2 BOUNTY tokens for every 1 USDT deposited.")}</li>
            <li>• {t("Earn 2 BOUNTY for every 1 USDT of referral commission too.")}</li>
            <li>• {t("Claim your allocation anytime — it stays in your profile.")}</li>
          </ul>
        </div>
      </main>

      {/* Listing notice */}
      <div className="relative z-10 max-w-md lg:max-w-5xl mx-auto px-4 pb-6">
       <div
         className="dash-card p-4 flex items-center gap-3"
         style={{ animation: 'dashFadeIn 400ms ease both', background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.02))', border: '1px solid rgba(212,175,55,0.3)' }}
       >
         <img src={BOUNTY_LOGO} alt="Bounty" className="w-9 h-9 shrink-0" style={{ mixBlendMode: 'screen' }} />
         <p className="text-[12px] font-semibold leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>
           {t("Token Will Be Listed In Quarter 4 2026 On Top-Tier Exchanges")}
         </p>
       </div>
      </div>

      <StylishNotify data={notify} onDone={() => setNotify(null)} />
    </div>
  );
}