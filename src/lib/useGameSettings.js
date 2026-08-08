import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCasinoBalance } from '@/lib/useCasinoBalance';

// Effective winning-chance (RTP%) for a game.
// Real mode: per-player RTP override > per-game override > global '*' default.
// Demo mode: per-game demo_rtp > global demo_rtp > default 50 (per-player overrides ignored).
// Games are behind auth, but me() is wrapped so public contexts degrade gracefully.
export function useGameSettings(gameId) {
  const { demoMode } = useCasinoBalance();
  const [settings, setSettings] = useState({ rtp: 50, demoRtp: 50, enabled: true, minBet: 1, maxBet: 500, loading: true });

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

        // Real-mode RTP: per-player override wins over game/global.
        let rtp = active ? Number(active.rtp ?? 50) : 50;
        if (me && me.rtp !== undefined && me.rtp !== null) {
          const userRtp = Number(me.rtp);
          if (!Number.isNaN(userRtp)) rtp = userRtp;
        }

        // Demo-mode RTP: per-game demo_rtp (when enabled) > global demo_rtp > 50.
        let demoRtp = 50;
        const perDemo = per && per.enabled !== false && per.demo_rtp !== undefined && per.demo_rtp !== null ? Number(per.demo_rtp) : null;
        const globalDemo = global && global.demo_rtp !== undefined && global.demo_rtp !== null ? Number(global.demo_rtp) : null;
        if (perDemo !== null) demoRtp = perDemo;
        else if (globalDemo !== null) demoRtp = globalDemo;

        setSettings({
          rtp: Math.max(0, Math.min(100, rtp)),
          demoRtp: Math.max(0, Math.min(100, demoRtp)),
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

  // Demo mode DOUBLES the real RTP (capped at 100) so demo play is more
  // generous — winning chance and multiplier chance both double. Turning
  // demo off restores the real RTP instantly.
  return {
    ...settings,
    rtp: demoMode ? Math.min(100, settings.rtp * 2) : settings.rtp,
    demoMode,
  };
}