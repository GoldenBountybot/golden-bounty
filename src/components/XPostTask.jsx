import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/LanguageContext';
import { Loader2, Check, Gift, ExternalLink, Clock, CheckCircle2, Send, ChevronDown, ChevronUp } from 'lucide-react';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";
const BOUNTY_LOGO = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/11d70dbce_file_000000007ca8820782fc88a9cf61d873.png';
const REWARD = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const APP_X_HANDLE = '@golden_bounty_x'; // our official X account users must tag

const XLogo = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.215-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.91l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const fmtRemain = (ms) => {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Pre-filled post text about the app — opens directly in X compose window.
const POST_TEXT = `🤠 I'm playing on Golden Bounty — the ultimate Wild West gaming platform! Stake, play, and earn real rewards. Tag ${APP_X_HANDLE} to join the bounty hunt! 🪙✨ #GoldenBounty`;

const composeUrl = () => `https://x.com/compose/post?text=${encodeURIComponent(POST_TEXT)}`;

export default function XPostTask({ profile, onClaimed }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [xUsername, setXUsername] = useState('');
  const [postLink, setPostLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [now, setNow] = useState(Date.now());

  const loadSubmission = useCallback(async () => {
    if (!profile) return;
    try {
      const list = await base44.entities.XPostSubmission.filter(
        { user_id: profile.id },
        '-created_date',
        20
      );
      setSubmission(list[0] || null);
    } catch { /* ignore */ }
    setLoading(false);
  }, [profile]);

  useEffect(() => { loadSubmission(); }, [loadSubmission]);

  // Live countdown tick — only when expanded & pending/approved
  useEffect(() => {
    if (!expanded) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expanded]);

  const deadline = submission ? new Date(submission.created_date).getTime() + WINDOW_MS : 0;
  const remaining = deadline - now;
  const isExpired = submission && submission.status === 'pending' && remaining <= 0;
  const canClaim = submission && submission.status === 'approved' && !submission.claimed && remaining > 0;
  const isClaimed = submission && submission.claimed;
  const isPending = submission && submission.status === 'pending' && remaining > 0;
  const isRejected = submission && submission.status === 'rejected';
  const showForm = !submission || isExpired || isRejected;

  // Compact status badge for collapsed card
  const statusBadge = () => {
    if (loading) return null;
    if (isClaimed) return { text: t('Claimed'), color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.35)', icon: Check };
    if (canClaim) return { text: t('Claim'), color: '#FFD700', bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.4)', icon: Gift };
    if (isPending) return { text: fmtRemain(remaining), color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.4)', icon: Clock };
    if (isRejected) return { text: t('Rejected'), color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.4)', icon: Clock };
    return { text: t('Open'), color: '#D4AF37', bg: 'rgba(212,175,55,0.12)', border: 'rgba(212,175,55,0.35)', icon: Send };
  };
  const badge = statusBadge();

  const submit = async () => {
    const handle = xUsername.trim().replace(/^@/, '');
    const link = postLink.trim();
    if (!handle) { toast({ title: t('Enter your X username') }); return; }
    if (!link || !/^https?:\/\/.+/i.test(link)) { toast({ title: t('Enter a valid post link') }); return; }
    setSubmitting(true);
    try {
      if (submission && (isExpired || isRejected)) {
        try {
          await base44.entities.XPostSubmission.update(submission.id, {
            status: isExpired ? 'expired' : submission.status,
          });
        } catch { /* best-effort */ }
      }
      const created = await base44.entities.XPostSubmission.create({
        user_id: profile.id,
        user_email: profile.email || '',
        x_username: handle,
        post_link: link,
        status: 'pending',
        reward: REWARD,
        claimed: false,
      });
      setSubmission(created);
      setXUsername('');
      setPostLink('');
      toast({ title: t('Submitted!'), description: t('Awaiting admin approval within 24h') });
    } catch (e) {
      toast({ title: t('Submit failed'), description: e.message });
    }
    setSubmitting(false);
  };

  const claim = async () => {
    if (!canClaim) return;
    setClaiming(true);
    try {
      await base44.entities.XPostSubmission.update(submission.id, { claimed: true });
      const newBounty = Number(profile?.task_bounty ?? 0) + REWARD;
      await base44.auth.updateMe({ task_bounty: newBounty });
      setSubmission((s) => ({ ...s, claimed: true }));
      onClaimed?.(newBounty);
      try {
        await base44.entities.UserNotification.create({
          user_id: profile.id,
          type: 'token_claimed',
          title: t('X Post Reward Claimed!'),
          body: `+${REWARD} BOUNTY`,
          amount: REWARD,
          link: '/profile',
        });
      } catch { /* best-effort */ }
      toast({ title: t('Claimed!'), description: `+${REWARD} BOUNTY` });
    } catch (e) {
      toast({ title: t('Claim failed'), description: e.message });
    }
    setClaiming(false);
  };

  const openCompose = () => {
    window.open(composeUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col gap-2" style={{ animation: 'dashFadeIn 400ms ease both' }}>
      {/* Compact card — same style as other tasks */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="dash-card p-4 flex items-center gap-3 w-full text-left transition-all active:scale-[0.98]"
        style={isClaimed ? { opacity: 0.65 } : undefined}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0" style={{ background: '#000' }}>
          <XLogo className="w-4 h-4" style={{ color: '#fff' }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: '#fff' }}>{t('Post on X')}</p>
          <p className="text-[11px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <img src={BOUNTY_LOGO} alt="Bounty" className="w-3.5 h-3.5" style={{ mixBlendMode: 'screen' }} />
            +{REWARD} BOUNTY
          </p>
        </div>

        {badge && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0" style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}>
            <badge.icon className="w-3.5 h-3.5" />
            <span className="tabular-nums">{badge.text}</span>
          </div>
        )}

        {expanded
          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'rgba(212,175,55,0.6)' }} />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'rgba(212,175,55,0.6)' }} />}
      </button>

      {/* Expanded full view */}
      {expanded && (
        <div className="dash-card p-4 flex flex-col gap-3" style={{ animation: 'dashFadeIn 300ms ease both' }}>
          {/* Reward header */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: '#000' }}>
              <XLogo className="w-4 h-4" style={{ color: '#fff' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#fff' }}>{t('Share Golden Bounty on X')}</p>
              <p className="text-[11px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <img src={BOUNTY_LOGO} alt="Bounty" className="w-3.5 h-3.5" style={{ mixBlendMode: 'screen' }} />
                +{REWARD} BOUNTY
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#D4AF37' }} />
            </div>
          ) : (
            <>
              {/* Submission form */}
              {showForm && (
                <>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {t('Post about Golden Bounty on X, then submit your X username and the post link. Admin will review within 24 hours. If approved, claim your BOUNTY tokens.')}
                  </p>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.35)' }}>
                    <XLogo className="w-4 h-4 shrink-0" style={{ color: '#fff' }} />
                    <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {t('You must tag our official X account')} <span className="font-bold" style={{ color: '#FFD700' }}>{APP_X_HANDLE}</span> {t('in your post for it to be valid.')}
                    </p>
                  </div>

                  {/* Direct post button — opens X compose with pre-filled text */}
                  <button
                    onClick={openCompose}
                    className="w-full py-3 text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{ border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(255,255,255,0.04)', color: '#D4AF37', borderRadius: '14px', fontWeight: 700 }}
                  >
                    <ExternalLink className="w-4 h-4" /> {t('Post on X Now')}
                  </button>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t('X Username')}</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>@</span>
                      <input
                        value={xUsername}
                        onChange={(e) => setXUsername(e.target.value)}
                        placeholder="your_username"
                        className="dash-input w-full pl-8 pr-4 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'rgba(212,175,55,0.8)' }}>{t('Post Link')}</label>
                    <input
                      value={postLink}
                      onChange={(e) => setPostLink(e.target.value)}
                      placeholder="https://x.com/your_username/status/..."
                      className="dash-input w-full px-4 py-2.5 text-sm"
                    />
                  </div>
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="dash-btn-gold w-full py-3 text-sm flex items-center justify-center gap-2"
                  >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('Submitting...')}</> : <><CheckCircle2 className="w-4 h-4" /> {t('Submit')}</>}
                  </button>
                  {(isExpired || isRejected) && (
                    <p className="text-[11px] text-center" style={{ color: isRejected ? '#f87171' : '#fb923c' }}>
                      {isRejected ? t('Your previous submission was rejected. Please try again.') : t('Your previous submission expired (no approval within 24h). Please try again.')}
                    </p>
                  )}
                </>
              )}

              {/* Pending — awaiting approval, countdown */}
              {isPending && (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.4)' }}>
                    <Clock className="w-4 h-4" style={{ color: '#fb923c' }} />
                    <span className="text-[12px] font-bold" style={{ color: '#fb923c' }}>{t('Awaiting Admin Approval')}</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('Time remaining for approval')}</p>
                  <p className="text-2xl font-extrabold tabular-nums" style={{ color: '#FFD700', fontFamily: SANS }}>{fmtRemain(remaining)}</p>
                  <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl mt-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.25)' }}>
                    <XLogo className="w-3.5 h-3.5 shrink-0" style={{ color: '#fff' }} />
                    <span className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>@{submission.x_username}</span>
                    <a href={submission.post_link} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" style={{ color: '#D4AF37' }} />
                    </a>
                  </div>
                </div>
              )}

              {/* Approved — claim */}
              {canClaim && (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.4)' }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: '#34d399' }} />
                    <span className="text-[12px] font-bold" style={{ color: '#34d399' }}>{t('Approved! Claim your reward')}</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('Claim before timer expires')}</p>
                  <p className="text-lg font-extrabold tabular-nums" style={{ color: '#FFD700' }}>{fmtRemain(remaining)}</p>
                  <button
                    onClick={claim}
                    disabled={claiming}
                    className="dash-btn-gold w-full py-3 text-sm flex items-center justify-center gap-2"
                  >
                    {claiming ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('Claiming...')}</> : <><Gift className="w-4 h-4" /> {t('Claim')} {REWARD} BOUNTY</>}
                  </button>
                </div>
              )}

              {/* Claimed */}
              {isClaimed && (
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl" style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.35)' }}>
                  <Check className="w-5 h-5" style={{ color: '#34d399' }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#34d399' }}>{t('Reward Claimed')}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>+{REWARD} BOUNTY</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}