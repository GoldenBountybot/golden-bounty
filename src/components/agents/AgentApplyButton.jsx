import React, { useState } from 'react';
import { Loader2, UserPlus, CheckCircle2, Headphones } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';

// "Apply to become an agent" button shown at the bottom of the Agents page.
// Sends a message into the user's support thread so the admin sees it in the
// support chat, then shows a success state telling the user to contact support.
export default function AgentApplyButton() {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');

  const apply = async () => {
    setSending(true);
    setError('');
    try {
      const me = await base44.auth.me();
      await base44.entities.SupportMessage.create({
        user_id: me.id,
        user_email: me.email || '',
        sender: 'user',
        text: `🧑‍💼 Agent Application — ${me.full_name || me.email || me.id} wants to become an agent.`,
        kind: 'agent_request',
      });
      setApplied(true);
    } catch (e) {
      setError(e?.message || 'Failed to apply');
    }
    setSending(false);
  };

  if (applied) {
    return (
      <div className="dash-card p-4 flex flex-col items-center gap-2 text-center">
        <CheckCircle2 className="w-7 h-7" style={{ color: '#34d399' }} />
        <p className="text-sm font-bold" style={{ color: '#34d399' }}>{t('Successfully Applied')}</p>
        <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {t('Please contact support to complete your agent application.')}
        </p>
        <a
          href="https://t.me/golden_bounty_tg"
          target="_blank"
          rel="noopener noreferrer"
          className="dash-btn-gold px-4 py-2.5 text-sm flex items-center justify-center gap-2 mt-1"
        >
          <Headphones className="w-4 h-4" /> {t('Contact Support')}
        </a>
      </div>
    );
  }

  return (
    <div className="dash-card p-4 flex flex-col gap-2">
      <p className="text-sm font-bold" style={{ color: '#fff' }}>{t('Become an Agent')}</p>
      <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {t('Apply to become an official Golden Bounty agent and earn from deposits & withdrawals.')}
      </p>
      <button onClick={apply} disabled={sending} className="dash-btn-gold w-full py-3 text-sm flex items-center justify-center gap-2">
        {sending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('Applying...')}</>
          : <><UserPlus className="w-4 h-4" /> {t('Apply to be an Agent')}</>}
      </button>
      {error && <p className="text-[11px] text-center" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  );
}