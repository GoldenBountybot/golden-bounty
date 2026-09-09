// Shared bet bookkeeping for the JILI operator callbacks (/bet, /cancelBet,
// /sessionBet, /cancelSessionBet). Every money move is claimed in
// jili_transactions first, so a retry from JILI can never move money twice.
import { CURRENCY, JILI_ERR, applyDelta, ensureWallet, reply, replyError, svc } from './jili.ts';

export async function resolvePlayer(token: string, userId: string) {
  // A bare userId is not proof of anything, so it is only accepted when that
  // player actually has a JILI session (i.e. really launched a JILI game).
  if (userId) {
    const { data: seen } = await svc
      .from('jili_sessions').select('user_id').eq('user_id', userId).limit(1);
    if (!seen?.length) return null;
    const wallet = await ensureWallet(userId);
    return wallet ? { userId, wallet } : null;
  }
  if (!token) return null;
  const { data: session } = await svc
    .from('jili_sessions')
    .select('user_id, status')
    .eq('session_token', token)
    .maybeSingle();
  if (!session) return null;
  const wallet = await ensureWallet(session.user_id);
  return wallet ? { userId: session.user_id, wallet } : null;
}

// Applies one signed balance change under the given idempotency key.
// Returns a ready Response.
export async function applyMove(opts: {
  key: string;
  kind: string;
  userId: string;
  game: number;
  betAmount: number;
  winloseAmount: number;
  delta: number;
  logActivity?: boolean;
}) {
  const claim = await svc.from('jili_transactions').insert({
    tx_key: opts.key,
    kind: opts.kind,
    user_id: opts.userId,
    game: opts.game,
    bet_amount: opts.betAmount,
    winlose_amount: opts.winloseAmount,
    delta: opts.delta,
    status: 'success',
  }).select('id').single();

  if (claim.error) {
    // Already processed — replay the stored balance (errorCode 1 per §4.2.3).
    const { data: prev } = await svc.from('jili_transactions')
      .select('balance_after, status').eq('tx_key', opts.key).maybeSingle();
    if (!prev) return replyError(JILI_ERR.OTHER, claim.error.message);
    if (prev.status !== 'success') return replyError(JILI_ERR.NOT_ENOUGH_BALANCE, 'Not enough balance');
    return reply({
      username: opts.userId,
      currency: CURRENCY,
      balance: Number(prev.balance_after || 0),
    }, JILI_ERR.ALREADY_ACCEPTED, 'Already accepted');
  }

  let balance: number;
  try {
    balance = await applyDelta(opts.userId, opts.delta);
  } catch {
    await svc.from('jili_transactions').update({ status: 'failed' }).eq('tx_key', opts.key);
    return replyError(JILI_ERR.NOT_ENOUGH_BALANCE, 'Not enough balance');
  }

  await svc.from('jili_transactions').update({ balance_after: balance }).eq('tx_key', opts.key);

  if (opts.betAmount > 0) {
    const { data: w } = await svc.from('wallets').select('wager_remaining').eq('user_id', opts.userId).maybeSingle();
    await svc.from('wallets')
      .update({ wager_remaining: Math.max(0, Number(w?.wager_remaining || 0) - opts.betAmount) })
      .eq('user_id', opts.userId);
  }

  if (opts.logActivity && (opts.betAmount > 0 || opts.winloseAmount > 0)) {
    await svc.from('player_activity').insert({
      user_id: opts.userId,
      game_id: `jili:${opts.game}`,
      bet: opts.betAmount,
      win: opts.winloseAmount,
      outcome: opts.winloseAmount > opts.betAmount ? 'win' : opts.winloseAmount === opts.betAmount ? 'push' : 'loss',
      multiplier: opts.betAmount > 0 ? opts.winloseAmount / opts.betAmount : 0,
    });
  }

  return reply({ username: opts.userId, currency: CURRENCY, balance, txId: Number(claim.data.id) });
}