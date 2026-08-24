// PG SOFT → Cash/TransferInOut (Bet Payout)
// Applies the signed player win/loss to the wallet. Fully idempotent: a
// repeated transaction_id returns the stored result without moving money again.
import { CURRENCY, ERR, applyDelta, ensureWallet, fail, num, ok, preflight, readParams, checkOperatorToken, svc } from '../_shared/pgsoft.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const p = await readParams(req);
    if (!checkOperatorToken(p)) return fail(ERR.INVALID_TOKEN);

    const userId = p.player_name || '';
    const txId = p.transaction_id || '';
    if (!userId || !txId) return fail(ERR.PLAYER_NOT_FOUND);

    const betAmount = num(p.bet_amount);
    const winAmount = num(p.win_amount);
    const transfer = p.transfer_amount !== undefined ? num(p.transfer_amount) : winAmount - betAmount;

    const wallet = await ensureWallet(userId);
    if (!wallet) return fail(ERR.PLAYER_NOT_FOUND);
    if (wallet.banned) return fail(ERR.PLAYER_NOT_FOUND);

    // Claim the transaction id FIRST — the unique index makes this the
    // idempotency lock, so a PG retry can never double-apply the money.
    const claim = await svc.from('pgsoft_transactions').insert({
      transaction_id: txId,
      user_id: userId,
      kind: 'bet_payout',
      game_id: p.game_id || '',
      bet_id: p.bet_id || '',
      parent_bet_id: p.parent_bet_id || '',
      bet_amount: betAmount,
      win_amount: winAmount,
      transfer_amount: transfer,
      updated_time: Date.now(),
      status: 'success',
    }).select('id').single();

    if (claim.error) {
      // Already processed — replay the stored response.
      const { data: prev } = await svc.from('pgsoft_transactions')
        .select('balance_after, updated_time, status').eq('transaction_id', txId).maybeSingle();
      if (!prev) return fail({ code: ERR.INTERNAL.code, message: claim.error.message });
      if (prev.status !== 'success') return fail(ERR.INSUFFICIENT);
      return ok({
        currency: CURRENCY,
        balance_amount: Number(prev.balance_after || 0),
        real_balance_amount: Number(prev.balance_after || 0),
        updated_time: Number(prev.updated_time || Date.now()),
      });
    }

    let balance: number;
    try {
      balance = await applyDelta(userId, transfer);
    } catch {
      await svc.from('pgsoft_transactions').update({ status: 'failed' }).eq('transaction_id', txId);
      return fail(ERR.INSUFFICIENT);
    }

    // Deposited funds play-through progress, same rule as our in-house games.
    if (betAmount > 0) {
      await svc.from('wallets')
        .update({ wager_remaining: Math.max(0, Number(wallet.wager_remaining || 0) - betAmount) })
        .eq('user_id', userId);
    }

    const updatedTime = Date.now();
    await svc.from('pgsoft_transactions')
      .update({ balance_after: balance, updated_time: updatedTime })
      .eq('transaction_id', txId);

    if (betAmount > 0 || winAmount > 0) {
      await svc.from('player_activity').insert({
        user_id: userId,
        game_id: p.game_id ? `pgsoft:${p.game_id}` : 'pgsoft',
        bet: betAmount,
        win: winAmount,
        outcome: winAmount > betAmount ? 'win' : winAmount === betAmount ? 'push' : 'loss',
        multiplier: betAmount > 0 ? winAmount / betAmount : 0,
      });
    }

    return ok({
      currency: CURRENCY,
      balance_amount: balance,
      real_balance_amount: balance,
      updated_time: updatedTime,
    });
  } catch (e) {
    return fail({ code: ERR.INTERNAL.code, message: String(e?.message || e) });
  }
});