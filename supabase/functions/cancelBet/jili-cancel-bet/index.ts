// JILI → /cancelBet (§4.2.5). Rolls back a /bet round:
// Balance after cancellation = balance + betAmount - winloseAmount
import { JILI_ERR, num, preflight, readBody, replyError, svc } from '../_shared/jili.ts';
import { applyMove, resolvePlayer } from '../_shared/jiliBet.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const p = await readBody(req);
    const round = String(p.round || '');
    if (!round) return replyError(JILI_ERR.INVALID_PARAMETER, 'round is required');

    const { data: original } = await svc.from('jili_transactions')
      .select('user_id, status').eq('tx_key', `bet:${round}`).maybeSingle();
    if (!original) return replyError(2, 'Round not found');

    const player = await resolvePlayer(String(p.token || ''), String(p.userId || original.user_id));
    if (!player) return replyError(JILI_ERR.TOKEN_EXPIRED, 'Token expired');

    const betAmount = num(p.betAmount);
    const winloseAmount = num(p.winloseAmount);

    return await applyMove({
      key: `cancel:${round}`,
      kind: 'cancel',
      userId: player.userId,
      game: Number(p.game) || 0,
      betAmount: 0,
      winloseAmount: 0,
      delta: betAmount - winloseAmount,
    });
  } catch (e) {
    return replyError(JILI_ERR.OTHER, String(e?.message || e));
  }
});