import { useEffect } from 'react';
import { reloadBalance } from '@/lib/useCasinoBalance';

// Third-party provider games (PG SOFT / JILI / Endorphina) move money through
// server-to-server callbacks, so the local balance cache never hears about
// those bets. Re-read the authoritative wallet when the player leaves the game
// so the lobby shows the real balance right away.
export function useProviderBalanceSync() {
  useEffect(() => () => { reloadBalance(); }, []);
}