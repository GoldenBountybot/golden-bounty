import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/LanguageContext';
import { Loader2, Check, Gift, ExternalLink } from 'lucide-react';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";
const BOUNTY_LOGO = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/11d70dbce_file_000000007ca8820782fc88a9cf61d873.png';

const XLogo = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.215-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.91l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TelegramLogo = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

// Real brand colors + badge style per task type
const TASK_BRAND = {
  x: { bg: '#000', color: '#fff', round: 'rounded-lg' },
  telegram: { bg: '#229ED9', color: '#fff', round: 'rounded-full' },
};

export default function TaskSystem({ profile, onClaimed }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [claimedSet, setClaimedSet] = useState(new Set());
  const [opened, setOpened] = useState(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await base44.entities.TaskLink.filter({ active: true }, 'order', 50);
        if (active) setTasks(list);
      } catch { /* ignore */ }
      if (active) setLoading(false);
    })();
    setClaimedSet(new Set((profile?.claimed_tasks || '').split(',').filter(Boolean)));
  }, [profile]);

  const openLink = (task) => {
    if (task.url) {
      window.open(task.url, '_blank', 'noopener,noreferrer');
      setOpened((prev) => new Set(prev).add(task.name));
    }
  };

  const claim = async (task) => {
    if (claimedSet.has(task.name)) return;
    setClaiming(task.name);
    try {
      const newClaimed = [...claimedSet, task.name];
      const newBounty = Number(profile?.task_bounty ?? 0) + Number(task.reward || 5);
      await base44.auth.updateMe({
        claimed_tasks: newClaimed.join(','),
        task_bounty: newBounty,
      });
      setClaimedSet(new Set(newClaimed));
      onClaimed?.(newBounty);
      // Create a notification so it shows in the Notifications list
      try {
        await base44.entities.UserNotification.create({
          user_id: profile.id,
          type: 'token_claimed',
          title: t('Task Claimed!'),
          body: `+${task.reward} BOUNTY`,
          amount: Number(task.reward || 5),
          link: '/profile',
        });
      } catch { /* notification is best-effort */ }
      toast({ title: t('Task Claimed!'), description: `+${task.reward} BOUNTY` });
    } catch (e) {
      toast({ title: t('Claim failed'), description: e.message });
    }
    setClaiming(null);
  };

  if (loading) {
    return (
      <div className="dash-card p-5 flex items-center justify-center" style={{ animation: 'dashFadeIn 400ms ease both' }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#D4AF37' }} />
      </div>
    );
  }

  if (tasks.length === 0) return null;

  return (
    <div className="flex flex-col gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
      <div className="flex items-center gap-2 px-1">
        <Gift className="w-4 h-4" style={{ color: '#D4AF37' }} />
        <h3 className="text-sm font-bold" style={{ color: '#D4AF37' }}>{t('Tasks · Earn BOUNTY')}</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {tasks.map((task) => {
        const Icon = (task.name === 'x' ? XLogo : task.name === 'telegram' ? TelegramLogo : Gift);
        const claimed = claimedSet.has(task.name);
        const isOpened = opened.has(task.name);
        const reward = Number(task.reward || 5);

        return (
          <div
            key={task.id}
            className="dash-card p-4 flex items-center gap-3"
            style={claimed ? { opacity: 0.65 } : undefined}
          >
            <div className={`flex items-center justify-center w-10 h-10 shrink-0 ${TASK_BRAND[task.name]?.round || 'rounded-xl'}`} style={{ background: TASK_BRAND[task.name]?.bg || 'rgba(212,175,55,0.12)', border: TASK_BRAND[task.name] ? 'none' : '1px solid rgba(212,175,55,0.35)' }}>
              <Icon className="w-4 h-4" style={{ color: TASK_BRAND[task.name]?.color || '#D4AF37' }} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: '#fff' }}>{task.label}</p>
              <p className="text-[11px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <img src={BOUNTY_LOGO} alt="Bounty" className="w-3.5 h-3.5" style={{ mixBlendMode: 'screen' }} />
                +{reward} BOUNTY
              </p>
            </div>

            {claimed ? (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold" style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }}>
                <Check className="w-4 h-4" /> {t('Claimed')}
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openLink(task)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95"
                  style={{ border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(255,255,255,0.04)', color: '#D4AF37' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> {t('Open')}
                </button>
                <button
                  onClick={() => claim(task)}
                  disabled={claiming === task.name || !isOpened}
                  className="dash-btn-gold px-3 py-2 text-[12px] flex items-center gap-1.5 disabled:opacity-45 disabled:cursor-not-allowed"
                  title={!isOpened ? t('Open the link first, then claim') : t('Claim reward')}
                >
                  {claiming === task.name ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gift className="w-3.5 h-3.5" />}
                  {t('Claim')}
                </button>
              </div>
            )}
          </div>
        );
      })}
      </div>

    </div>
  );
}