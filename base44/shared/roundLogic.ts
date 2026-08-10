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
export function decideOutcome(rtp, betAmount, isFreeSpin, gameId) {
  const rtpFrac = Math.max(0, Math.min(1, rtp / 100));

  // ── Plinko: multiplier must match an actual bucket value ──
  // Buckets: [0.1, 2, 5, 10, 25, 50, 100]. The server picks one of these
  // (not a random float) so the ball always lands on a real bucket and the
  // displayed win matches the bucket multiplier exactly.
  if (gameId === 'plinko') {
    // Fixed probability distribution per bucket (owner-specified).
    // Weights are normalized internally, so they need not sum to 100.
    //   0.1x: 65  (massive loss zone) · 2x: 25 · 5x: 5 · 10x: 4
    //   25x: 0.8 · 50x: 0.5 · 100x: 0.1
    const BUCKETS = [0.1, 2, 5, 10, 25, 50, 100];
    const WEIGHTS = [65, 25, 5, 4, 0.8, 0.5, 0.1];
    const totalW = WEIGHTS.reduce((a, b) => a + b, 0);

    let r2 = Math.random() * totalW;
    let mult = BUCKETS[0];
    for (let i = 0; i < BUCKETS.length; i++) {
      r2 -= WEIGHTS[i];
      if (r2 <= 0) { mult = BUCKETS[i]; break; }
    }

    const maxMult = isFreeSpin
      ? (FREE_SPIN_MAX_WIN / Math.max(betAmount, 0.01))
      : MAX_WIN_MULT;
    mult = Math.min(mult, maxMult);
    let winAmount = mult * betAmount;
    if (isFreeSpin) winAmount = Math.min(winAmount, FREE_SPIN_MAX_WIN);
    winAmount = Math.round(winAmount * 100) / 100;
    return { isWin: mult > 1, winAmount, multiplier: mult };
  }

  // ── All other games: continuous multiplier distribution ──
  // Win frequency: ~15% of RTP as win chance (at 50% RTP → ~7.5% win chance).
  // Super Ace (fullhouse): reduced to ~8% of RTP so fewer spins land on the
  // win line and cascade multipliers chain less often.
  const winChanceMult = gameId === 'fullhouse' ? 0.11 : (gameId === 'wild-bounty' ? 0.16 : (gameId === 'argonauts' ? 0.07 : (gameId === 'thimbles' ? 0.75 : (gameId === 'hi-lo' ? 0.75 : (gameId === 'mines' ? 0.75 : 0.15)))));
  const winChance = rtpFrac * winChanceMult;
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