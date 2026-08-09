// Shared round logic — RTP reading and server-side outcome decision.
// Used by beginRound and settleBet so the logic is never duplicated.

const MAX_WIN_MULT = 5000;
const FREE_SPIN_MAX_WIN = 5000;

// Read the effective RTP for a user + game: per-player Wallet override >
// per-game GameSetting > global '*' default > 50.
export async function readRtp(base44, userId, gameId) {
  let rtp = 50;
  try {
    const settings = await base44.asServiceRole.entities.GameSetting.list();
    const per = settings.find(r => r.game_id === gameId);
    const global = settings.find(r => r.game_id === '*');
    const active = per && per.enabled !== false ? per : (global && global.enabled !== false ? global : null);
    if (active) rtp = Number(active.rtp ?? 50);
  } catch { /* best-effort */ }
  try {
    const wallets = await base44.asServiceRole.entities.Wallet.filter({ user_id: userId }, 'created_date', 1);
    const w = wallets && wallets[0];
    if (w && w.rtp !== undefined && w.rtp !== null) {
      const userRtp = Number(w.rtp);
      if (!Number.isNaN(userRtp)) rtp = userRtp;
    }
  } catch { /* best-effort */ }
  return Math.max(0, Math.min(100, rtp));
}

// Server-side outcome decision based on RTP. The win is decided HERE —
// the client can never override it. P(win) * mean_multiplier ≈ rtpFrac.
export function decideOutcome(rtp, betAmount, isFreeSpin) {
  const rtpFrac = Math.max(0, Math.min(1, rtp / 100));
  // Win frequency: ~15% of RTP as win chance (at 50% RTP → ~7.5% win chance).
  const winChance = rtpFrac * 0.15;
  const isWin = Math.random() < winChance;
  if (!isWin) return { isWin: false, winAmount: 0, multiplier: 0 };

  // Multiplier distribution: mostly small wins, rare big wins.
  // Mean ≈ 6.7 so that 0.15 * rtpFrac * 6.7 ≈ rtpFrac (expected return ≈ RTP).
  const r = Math.random();
  let multiplier;
  if (r < 0.85) multiplier = 1 + Math.random() * 3;         // 85%: 1-4x
  else if (r < 0.96) multiplier = 4 + Math.random() * 16;   // 11%: 4-20x
  else if (r < 0.995) multiplier = 20 + Math.random() * 80; // 3.5%: 20-100x
  else multiplier = 100 + Math.random() * 400;              // 0.5%: 100-500x

  const maxMult = isFreeSpin
    ? (FREE_SPIN_MAX_WIN / Math.max(betAmount, 0.01))
    : MAX_WIN_MULT;
  multiplier = Math.min(multiplier, maxMult);
  let winAmount = multiplier * betAmount;
  if (isFreeSpin) winAmount = Math.min(winAmount, FREE_SPIN_MAX_WIN);
  winAmount = Math.round(winAmount * 100) / 100;
  return { isWin: true, winAmount, multiplier };
}