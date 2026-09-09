// JILI → /bet (§4.2.3). Slot & fishing games: bet and settlement arrive together.
// Balance after bet = balance - betAmount + winloseAmount
import { JILI_ERR, num, preflight, readBody, replyError } from '../_shared/jili.ts';
import { applyMove, resolvePlayer } from '../_shared/jiliBet.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const p = await readBody(req);
    const round = String(p.round || '');
    if (!round) return replyError(JILI_ERR.INVALID_PARAMETER, 'round is required');

    const player = await resolvePlayer(String(p.token || ''), String(p.userId || ''));
    if (!player) return replyError(JILI_ERR.TOKEN_EXPIRED, 'Token expired');
    if (player.wallet.banned) return replyError(JILI_ERR.OTHER, 'Player not available');

    const betAmount = num(p.betAmount);
    const winloseAmount = num(p.winloseAmount);
    if (Number(player.wallet.balance || 0) < betAmount) {
      return replyError(JILI_ERR.NOT_ENOUGH_BALANCE, 'Not enough balance');
    }

    return await applyMove({
      key: `bet:${round}`,
      kind: 'bet',
      userId: player.userId,
      game: Number(p.game) || 0,
      betAmount,
      winloseAmount,
      delta: winloseAmount - betAmount,
      logActivity: true,
    });
  } catch (e) {
    return replyError(JILI_ERR.OTHER, String(e?.message || e));
  }
});