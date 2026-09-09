// JILI → /sessionBet (§4.2.7). Card/casino games send bet (type 1) and
// settle (type 2) separately; `round` is the transaction id, `sessionId` the round.
// No preserve:   bet  → -betAmount            settle → +winloseAmount
// With preserve: bet  → -preserve             settle → +preserve - betAmount + winloseAmount
import { JILI_ERR, num, preflight, readBody, replyError } from '../_shared/jili.ts';
import { applyMove, resolvePlayer } from '../_shared/jiliBet.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const p = await readBody(req);
    const round = String(p.round || '');
    const type = Number(p.type) || 0;
    if (!round || (type !== 1 && type !== 2)) return replyError(JILI_ERR.INVALID_PARAMETER, 'round/type is invalid');

    const player = await resolvePlayer(String(p.token || ''), String(p.userId || ''));
    if (!player) return replyError(JILI_ERR.TOKEN_EXPIRED, 'Token expired');
    if (player.wallet.banned) return replyError(JILI_ERR.OTHER, 'Player not available');

    const betAmount = num(p.betAmount);
    const winloseAmount = num(p.winloseAmount);
    const preserve = num(p.preserve);

    const delta = type === 1
      ? -(preserve > 0 ? preserve : betAmount)
      : (preserve > 0 ? preserve - betAmount + winloseAmount : winloseAmount);

    if (delta < 0 && Number(player.wallet.balance || 0) < -delta) {
      return replyError(JILI_ERR.NOT_ENOUGH_BALANCE, 'Not enough balance');
    }

    return await applyMove({
      key: `session:${round}`,
      kind: type === 1 ? 'session_bet' : 'session_settle',
      userId: player.userId,
      game: Number(p.game) || 0,
      betAmount: type === 1 ? betAmount : 0,
      winloseAmount: type === 2 ? winloseAmount : 0,
      delta,
      logActivity: type === 2,
    });
  } catch (e) {
    return replyError(JILI_ERR.OTHER, String(e?.message || e));
  }
});