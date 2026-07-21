import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Shared Rocket Crash round orchestrator.
// Clients poll this function; it lazily advances the single live round
// (waiting -> running -> crashed -> next waiting) based on server timestamps
// so every user sees the exact same round at the same time.

const WAIT_MS = 5000;        // betting window before each round
const CRASH_HOLD_MS = 3500;  // show crash result before next round
const GROWTH = 1.10;         // multiplier = GROWTH ^ elapsedSec

function genCrashPoint(rtp) {
  const r = Math.random();
  let crash = (rtp / 100) / (1 - r);
  if (crash < 1.00) crash = 1.00; // instant bust
  return Math.min(crash, 250);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;

    // Resolve RTP from game settings (fall back to 97).
    let rtp = 97;
    try {
      const settings = await svc.entities.GameSetting.filter({ game_id: 'rocket-crash' });
      if (settings && settings.length && settings[0].rtp) rtp = settings[0].rtp;
    } catch (_e) {}

    const now = Date.now();

    // Fetch the singleton live-round record.
    let round = null;
    const existing = await svc.entities.CrashRound.filter({ current: true }, '-updated_date', 1);
    if (existing && existing.length) round = existing[0];

    if (!round) {
      round = await svc.entities.CrashRound.create({
        current: true,
        round_id: 1,
        phase: 'waiting',
        crash_point: genCrashPoint(rtp),
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