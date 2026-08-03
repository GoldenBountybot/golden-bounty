import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/LanguageContext';
import { Loader2, Check, Gift, ExternalLink, AtSign, Send } from 'lucide-react';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";
const BOUNTY_LOGO = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/11d70dbce_file_000000007ca8820782fc88a9cf61d873.png';

const TASK_ICON = {
  x: AtSign,
  telegram: Send,
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

      {tasks.map((task) => {
        const Icon = TASK_ICON[task.name] || Gift;
        const claimed = claimedSet.has(task.name);
        const isOpened = opened.has(task.name);
        const reward = Number(task.reward || 5);

        return (
          <div
            key={task.id}
            className="dash-card p-4 flex items-center gap-3"
            style={claimed ? { opacity: 0.65 } : undefined}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)' }}>
              <Icon className="w-4 h-4" style={{ color: '#D4AF37' }} />
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
  );
}