import React, { useEffect, useState } from 'react';
import { agentOps } from '@/lib/agentApi';
import AgentMatchCard from '@/components/agent/AgentMatchCard';

// Binance-Pay style live lookup: type a username / UID / email and the matched
// player's avatar, name, username and ID appear right below the input.
export default function PlayerLookup({ query, onPick, picked }) {
  const [user, setUser] = useState(null);
  const [state, setState] = useState('idle'); // idle | searching | none

  useEffect(() => {
    const q = (query || '').trim();
    if (q.length < 2) { setUser(null); setState('idle'); return; }
    setState('searching');
    // Very short debounce so the profile card appears almost the instant the
    // correct username / ID is typed.
    const t = setTimeout(async () => {
      const res = await agentOps('lookup', { q });
      if (res.user) { setUser(res.user); setState('idle'); }
      else { setUser(null); setState('none'); }
    }, 120);
    return () => clearTimeout(t);
  }, [query]);

  if (state === 'searching' && !user) {
    return <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Searching…</p>;
  }
  if (state === 'none') {
    return <p className="text-[11px]" style={{ color: '#f87171' }}>No user found with that username or ID.</p>;
  }
  if (!user) return null;

  return (
    <AgentMatchCard
      agent={user}
      badge={user.role === 'agent' || user.role === 'admin' ? 'Agent' : 'Player'}
      selected={picked?.id === user.id}
      onSelect={onPick}
    />
  );
}