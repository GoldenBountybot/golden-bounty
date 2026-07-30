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

function genCrashPoint(rtp) {
  // Crypto-grade entropy so the sequence can't be reverse-engineered or
  // predicted from observed history — every draw is independent.
  const rand = () => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  };

  // Jitter the effective RTP round-to-round.
  const rtpJitter = rtp + (rand() - 0.5) * 6; // ±3% band around configured RTP

  // Randomly switch between generation regimes so no single distribution
  // shape fits the observed data — an analyst can't pin down "the curve".
  const regime = rand();
  let crash;
  if (regime < 0.15) {
    // Heavy-tail regime: longer flights, rare but possible.
    crash = (rtpJitter / 100) / Math.pow(1 - rand(), 1.6);
  } else if (regime < 0.30) {
    // Steep-drop regime: mostly low busts.
    crash = (rtpJitter / 100) / (1 - rand() * rand());
  } else {
    // Standard regime.
    crash = (rtpJitter / 100) / (1 - rand());
  }

  // Multiplicative noise with randomly varying amplitude (15%–40%) so the
  // spread itself changes round-to-round.
  const noiseAmp = 0.15 + rand() * 0.25;
  crash *= 1 + (rand() - 0.5) * noiseAmp * 2;

  // Occasional outlier spike or early dip for extra entropy.
  if (rand() < 0.10) crash *= 0.3 + rand() * 2.5;

  if (crash < 1.00) {
    // 50% fewer exact 1.00x busts, the rest spread across (1.00, 2.00).
    crash = rand() < 0.5 ? 1.00 : 1.00 + rand();
  }
  // Redistribute ~20% of sub-2x busts up into the 2x–3x band so the
  // curve crashes below 2x slightly less often than before.
  if (crash < 2 && rand() < 0.20) {
    crash = 2 + rand();
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
        crash_point: genCrashPoint(97),
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
        patch.crash_point = genCrashPoint(rtp);
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