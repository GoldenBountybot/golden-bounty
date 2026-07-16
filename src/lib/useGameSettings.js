import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Effective winning-chance (RTP%) for a game.
// Priority: per-player RTP override > per-game override > global '*' default.
// Games are behind auth, but me() is wrapped so public contexts degrade gracefully.
export function useGameSettings(gameId) {
  const [settings, setSettings] = useState({ rtp: 50, enabled: true, minBet: 1, maxBet: 500, loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rows, me] = await Promise.all([
          base44.entities.GameSetting.list(),
          base44.auth.me().catch(() => null),
        ]);
        if (cancelled) return;
        const per = rows.find(r => r.game_id === gameId);
        const global = rows.find(r => r.game_id === '*');
        const active = per && per.enabled !== false ? per : (global && global.enabled !== false ? global : null);
        let rtp = active ? Number(active.rtp ?? 50) : 50;
        // Per-player override wins over game/global RTP for all games.
        if (me && me.rtp !== undefined && me.rtp !== null) {
          const userRtp = Number(me.rtp);
          if (!Number.isNaN(userRtp)) rtp = userRtp;
        }
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