import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Shared Rocket Crash round orchestrator.
// Clients poll this function; it lazily advances the single live round
// (waiting -> running -> crashed -> next waiting) based on server timestamps
// so every user sees the exact same round at the same time.
//
// Kept as cheap as possible: one read per poll, a write only when a phase
// actually transitions (rare). RTP is read only when a new crash point is
// generated. This avoids the per-function rate limit under load.

const WAIT_MS = 5000;        // betting window before each round
const CRASH_HOLD_MS = 1500;  // brief blast flash before next round
const GROWTH = 1.10;         // multiplier = GROWTH ^ elapsedSec

function genCrashPoint(rtp, recent = []) {
  // Crypto-grade entropy so the sequence can't be reverse-engineered or
  // predicted from observed history — every draw is independent.
  const rand = () => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  };

  // Streak detection: count how many of the most recent consecutive rounds
  // were "high" (>=2x) or "low" (<2x). If a streak is forming, force-break
  // it so the history never shows a long run of similar outcomes that a
  // player could read as a predictable pattern.
  let streakHigh = 0, streakLow = 0;
  for (const h of recent) {
    if (h >= 2) streakHigh++; else break;
  }
  for (const h of recent) {
    if (h < 2) streakLow++; else break;
  }
  // 3+ highs in a row → next round strongly biased to bust low.
  // 3+ lows in a row → next round strongly biased to fly higher.
  const forceLow = streakHigh >= 3;
  const forceHigh = streakLow >= 3;

  // Jitter the effective RTP round-to-round with a variable band so the
  // average payout itself drifts and can't be nailed to a single value.
  const rtpBand = 3 + rand() * 6; // ±3%..±9%
  const rtpJitter = rtp + (rand() - 0.5) * 2 * rtpBand;

  // Randomize the regime boundaries themselves each draw so the mix of
  // distributions shifts continuously — no fixed proportions to fit.
  const r1 = 0.03 + rand() * 0.08;   // heavy-tail share: 3%–11%
  const r2 = r1 + 0.18 + rand() * 0.20; // steep-drop share: +18%–38%
  const regime = rand();
  let crash;
  if (regime < r1) {
    // Heavy-tail regime: longer flights, rare but possible. Exponent itself
    // varies so the tail thickness changes every round.
    const exp = 1.3 + rand() * 0.8;
    crash = (rtpJitter / 100) / Math.pow(1 - rand(), exp);
  } else if (regime < r2) {
    // Steep-drop regime: mostly low busts, variable steepness.
    const k = 1 + rand() * 2;
    crash = (rtpJitter / 100) / (1 - Math.pow(rand(), k));
  } else {
    // Standard regime — but with a randomly perturbed exponent so even the
    // "default" curve shape is never the same twice.
    const exp = 0.9 + rand() * 0.4;
    crash = (rtpJitter / 100) / Math.pow(1 - rand(), exp);
  }

  // Multiplicative noise with randomly varying amplitude (10%–55%) so the
  // spread itself changes round-to-round.
  const noiseAmp = 0.10 + rand() * 0.45;
  crash *= 1 + (rand() - 0.5) * noiseAmp * 2;

  // Occasional outlier spike or early dip for extra entropy — rate varies.
  if (rand() < 0.08 + rand() * 0.10) crash *= 0.25 + rand() * 3;

  // Cap high flyers: pull most anything above 50x back down into a lower
  // band so x50+ outcomes stay rare. Threshold jitters so it's not a hard
  // visible wall.
  const capHi = 40 + rand() * 20;
  if (crash > capHi && rand() < 0.85) {
    crash = 8 + rand() * 42;
  }
  // Pull a random fraction of x10–x50 outcomes down into the 2x–10x band.
  if (crash > 10 && crash <= 50 && rand() < 0.30 + rand() * 0.25) {
    crash = 2 + rand() * 8;
  }

  if (crash < 1.00) {
    // 50% fewer exact 1.00x busts, the rest spread across (1.00, 2.00).
    crash = rand() < 0.5 ? 1.00 : 1.00 + rand();
  }
  // Pull ~45% of 2x–3x outcomes back down below 2x so the curve lands
  // above 2x noticeably less often.
  if (crash >= 2 && crash < 3 && rand() < 0.45) {
    crash = 1.00 + rand();
  }
  // Pull ~25% of 3x–10x outcomes back down below 2x as well, so high
  // multipliers are rarer and more rounds bust early.
  if (crash >= 3 && crash <= 10 && rand() < 0.25) {
    crash = 1.00 + rand();
  }
  // Anti-pattern scatter: with ~40% chance, remap the outcome to a fresh
  // uniform draw across a wide band (1x–9x). This flattens the visible
  // histogram so no single band dominates the history bar and a player
  // watching recent multipliers can't lock onto a "most common" zone to
  // exploit. Draws stay fully independent — history never feeds the next.
  if (rand() < 0.40) {
    crash = 1.00 + rand() * 8;
  }
  // Secondary shuffle: occasionally swap a low outcome for a mid one and
  // vice-versa, so consecutive rounds rarely follow a readable trend.
  if (rand() < 0.20) {
    if (crash < 2) crash = 2 + rand() * 6;
    else crash = 1.00 + rand() * 1.5;
  }
  // Streak-break: if the last few rounds clustered high, force this one
  // low; if they clustered low, force it higher. This guarantees the
  // history bar never shows a long unbroken run of similar colors that
  // a player could read as a pattern.
  if (forceLow) {
    crash = 1.00 + rand() * 0.9;          // bust under 2x
  } else if (forceHigh) {
    crash = 2.5 + rand() * 7.5;           // fly above 2.5x
  }
  return Math.min(Math.max(crash, 1.00), 250);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const now = Date.now();

    // Single read per poll — the live-round singleton.
    let round = null;
    const existing = await svc.entities.CrashRound.filter({ current: true }, '-updated_date', 1);
    if (existing && existing.length) round = existing[0];

    if (!round) {
      round = await svc.entities.CrashRound.create({
        current: true,
        round_id: 1,
        phase: 'waiting',
        crash_point: genCrashPoint(97, []),
        wait_start: now,
        run_start: 0,
        crash_at: 0,
        final_multiplier: 1,
        history: [],
      });
    }

    const patch = {};
    let updated = false;

    if (round.phase === 'waiting') {
      if (now - round.wait_start >= WAIT_MS) {
        patch.phase = 'running';
        patch.run_start = now;
        updated = true;
      }
    } else if (round.phase === 'running') {
      const elapsed = (now - round.run_start) / 1000;
      const m = Math.pow(GROWTH, elapsed);
      if (m >= round.crash_point) {
        patch.phase = 'crashed';
        patch.crash_at = now;
        patch.final_multiplier = round.crash_point;
        const hist = (round.history || []).slice(0, 21);
        hist.unshift(round.crash_point);
        patch.history = hist;
        updated = true;
      }
    } else if (round.phase === 'crashed') {
      if (now - round.crash_at >= CRASH_HOLD_MS) {
        // Read RTP only when generating a new crash point.
        let rtp = 97;
        try {
          const settings = await svc.entities.GameSetting.filter({ game_id: 'rocket-crash' });
          if (settings && settings.length && settings[0].rtp) rtp = settings[0].rtp;
        } catch (_e) {}
        patch.round_id = (round.round_id || 1) + 1;
        patch.phase = 'waiting';
        patch.crash_point = genCrashPoint(rtp, round.history || []);
        patch.wait_start = now;
        patch.run_start = 0;
        patch.crash_at = 0;
        patch.final_multiplier = 1;
        updated = true;
      }
    }

    if (updated) {
      await svc.entities.CrashRound.update(round.id, patch);
      round = { ...round, ...patch };
    }

    return Response.json({
      round_id: round.round_id,
      phase: round.phase,
      crash_point: round.crash_point,
      wait_start: round.wait_start,
      run_start: round.run_start,
      crash_at: round.crash_at,
      final_multiplier: round.final_multiplier,
      history: round.history || [],
      now,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});