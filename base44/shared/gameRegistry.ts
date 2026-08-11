// Server-side game registry — the AUTHORITATIVE source for game configuration.
// The client can NEVER override these values. beginRound validates all inputs
// against this registry so a hacker cannot:
//   1. Use a fake game_id to get a different RTP or game config.
//   2. Override settle_mode to switch from 'fixed' (server-decided win) to
//      'cap' (uncapped client win) — bypassing the server's win decision.
//   3. Send is_free_spin=true for a game that doesn't support free spins
//      (or for any game to avoid bet deduction).
//
// settle_mode:
//   'fixed' — the server decides the EXACT win (slot-style games). The client's
//             win_amount is IGNORED at settle time.
//   'cap'   — the server stores a MAX cap. The client sends the actual game win;
//             settle credits min(client_win, cap). Used by games where the player
//             chooses when to cash out (Mines, HiLo, Crash, etc.).

export const GAME_REGISTRY: Record<string, {
  settleMode: 'fixed' | 'cap';
  supportsFreeSpins: boolean;
}> = {
  'wild-bounty':      { settleMode: 'cap',   supportsFreeSpins: true },
  'fullhouse':        { settleMode: 'fixed', supportsFreeSpins: true },
  'gates-of-olympus': { settleMode: 'fixed', supportsFreeSpins: true },
  'big-brown':        { settleMode: 'fixed', supportsFreeSpins: true },
  'argonauts':        { settleMode: 'fixed', supportsFreeSpins: true },
  'crown-coins':      { settleMode: 'fixed', supportsFreeSpins: true },
  'plinko':           { settleMode: 'fixed', supportsFreeSpins: false },
  'mines':            { settleMode: 'cap',   supportsFreeSpins: false },
  'hi-lo':            { settleMode: 'cap',   supportsFreeSpins: false },
  'rocket-crash':     { settleMode: 'cap',   supportsFreeSpins: false },
  'thimbles':         { settleMode: 'cap',   supportsFreeSpins: false },
};

export function getGameConfig(gameId: string) {
  return GAME_REGISTRY[gameId] || null;
}

export function isValidGameId(gameId: string) {
  return !!GAME_REGISTRY[gameId];
}