import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Effective winning-chance (RTP%) for a game.
// Per-game override wins; otherwise the global '*' default.
// Anonymous-safe: the GameSetting entity has public read (rls.read: true).
export function useGameSettings(gameId) {
  const [settings, setSettings] = useState({ rtp: 50, enabled: true, minBet: 1, maxBet: 500, loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await base44.entities.GameSetting.list();
        if (cancelled) return;
        const per = rows.find(r => r.game_id === gameId);
        const global = rows.find(r => r.game_id === '*');
        const active = per && per.enabled !== false ? per : (global && global.enabled !== false ? global : null);
        const rtp = active ? Number(active.rtp ?? 50) : 50;
        setSettings({
          rtp: Math.max(0, Math.min(100, rtp)),
          enabled: !!active,
          minBet: Number(per?.min_bet ?? global?.min_bet ?? 1),
          maxBet: Number(per?.max_bet ?? global?.max_bet ?? 500),
          loading: false,
        });
      } catch {
        if (!cancelled) setSettings(s => ({ ...s, loading: false }));
      }
    })();
    return () => { cancelled = true; };
  }, [gameId]);

  return settings;
}