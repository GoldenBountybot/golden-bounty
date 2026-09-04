import React from 'react';
import { UserRound } from 'lucide-react';
import { countryFlag } from '@/lib/agentCountries';

// One agent row shown to players: name, username and player ID.
export default function AgentCard({ agent }) {
  return (
    <div className="dash-card p-3 flex items-center gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
        style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)' }}
      >
        <UserRound className="w-5 h-5" style={{ color: '#D4AF37' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: '#fff' }}>
          {agent.full_name || agent.username || 'Agent'}
        </p>
        <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
          @{agent.username || '—'}
        </p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>ID: {agent.uid || '—'}</p>
      </div>
      <span className="text-xl shrink-0" title={agent.country_name}>{countryFlag(agent.country_code)}</span>
    </div>
  );
}