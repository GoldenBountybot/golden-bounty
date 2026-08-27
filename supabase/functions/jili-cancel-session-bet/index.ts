// JILI → /cancelSessionBet (§4.2.8). Rolls back a single sessional bet
// transaction (identified by `round`) and returns the money to the player.
import { JILI_ERR, num, preflight, readBody, replyError, svc } from '../_shared/jili.ts';
import { applyMove, resolvePlayer } from '../_shared/jiliBet.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const p = await readBody(req);
    const round = String(p.round || '');
    if (!round) return replyError(JILI_ERR.INVALID_PARAMETER, 'round is required');

    const { data: original } = await svc.from('jili_transactions')
      .select('user_id, delta, status').eq('tx_key', `session:${round}`).maybeSingle();
    if (!original) return replyError(2, 'Round not found');

    const player = await resolvePlayer(String(p.token || ''), String(p.userId || original.user_id));
    if (!player) return replyError(JILI_ERR.TOKEN_EXPIRED, 'Token expired');

    // Reverse exactly what was applied, so the rollback can never drift.
    const delta = -Number(original.delta || 0);

    return await applyMove({
      key: `session-cancel:${round}`,
      kind: 'session_cancel',
      userId: player.userId,
      game: Number(p.game) || 0,
      betAmount: 0,
      winloseAmount: 0,
      delta: isFinite(delta) ? delta : num(p.betAmount),
    });
  } catch (e) {
    return replyError(JILI_ERR.OTHER, String(e?.message || e));
  }
});