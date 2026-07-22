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
  const r = Math.random();
  let crash = (rtp / 100) / (1 - r);
  if (crash < 1.00) {
    // Rounds that previously clamped to an instant 1.00x bust are now
    // redistributed below 2.00x. 50% of them still bust at exactly 1.00x
    // (so the 1.00x rate is half of what it was) and the rest bust
    // somewhere in (1.00, 2.00).
    crash = Math.random() < 0.5 ? 1.00 : 1.00 + Math.random();
  }
  return Math.min(crash, 250);
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