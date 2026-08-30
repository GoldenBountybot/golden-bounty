import React from 'react';
import { BadgeCheck, User } from 'lucide-react';
import FadeImage from '@/components/FadeImage';

// Floating suggestion card shown while typing a UID / username in the agent
// withdraw form. Tapping it locks that agent in.
export default function AgentMatchCard({ agent, selected, onSelect, badge = 'Agent' }) {
  const name = agent.full_name || agent.name || agent.username;
  const avatar = agent.avatar_url || agent.avatar || agent.photo_url || '';
  return (
    <button
      onClick={() => onSelect(agent)}
      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-[0.98]"
      style={{
        border: `1px solid ${selected ? 'rgba(52,211,153,0.55)' : 'rgba(212,175,55,0.35)'}`,
        background: selected ? 'rgba(52,211,153,0.10)' : 'rgba(255,255,255,0.04)',
      }}
    >
      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
        style={{ border: '1px solid rgba(212,175,55,0.45)', background: 'rgba(0,0,0,0.4)' }}>
        {avatar
          ? <FadeImage src={avatar} alt={name} className="w-full h-full object-cover" />
          : <User className="w-5 h-5" style={{ color: 'rgba(212,175,55,0.8)' }} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: '#fff' }}>{name}</p>
        <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
          @{agent.username} · ID {agent.uid || agent.id}
        </p>
      </div>
      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
        style={{ color: selected ? '#34d399' : '#D4AF37', background: 'rgba(0,0,0,0.35)' }}>
        <BadgeCheck className="w-3.5 h-3.5" /> {selected ? 'Selected' : badge}
      </span>
    </button>
  );
}