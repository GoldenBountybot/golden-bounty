import { useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// Best-effort logger: records one PlayerActivity row per settled bet so the
// player can review their betting & win/loss history from the profile.
export function useLogActivity() {
  const { user } = useAuth();
  return useCallback(async (game_id, bet, win, outcome, multiplier = 0) => {
    if (!user) return;
    // Record rounds where the player placed a bet (bet > 0) OR won without a
    // bet (free spin wins: bet = 0, win > 0). Skip no-bet no-win entries.
    if (!(Number(bet) > 0) && !(Number(win) > 0)) return;
    try {
      await base44.entities.PlayerActivity.create({
        user_id: user.id,
        user_email: user.email,
        game_id,
        bet: Number(bet) || 0,
        win: Number(win) || 0,
        outcome,
        multiplier: Number(multiplier) || 0,
      });
    } catch {
      /* logging is best-effort — never block gameplay */
    }
  }, [user]);
}