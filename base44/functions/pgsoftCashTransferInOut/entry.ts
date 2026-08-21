// PG SOFT Seamless Wallet callback — Bet Payout (spec 5.1.3.2.1)
// Single request carrying both the bet and the payout. Idempotent on
// transaction_id: a repeated request returns the previously stored result.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  readPgRequest, credentialsValid, hashAuthValid, pgOk, PG_ERRORS, PG_CURRENCY,
  walletForPlayer, applyDelta, trunc2, numOf,
} from '../../shared/pgsoft.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { params, rawBody } = await readPgRequest(req);

    if (!(await hashAuthValid(req, rawBody))) return PG_ERRORS.invalidRequest();
    if (!credentialsValid(params)) return PG_ERRORS.invalidRequest();

    const playerName = params.player_name;
    const transactionId = params.transaction_id;
    if (!playerName || !transactionId) return PG_ERRORS.invalidRequest();
    if (params.currency_code && params.currency_code !== PG_CURRENCY) return PG_ERRORS.invalidRequest();

    const bet = numOf(params.bet_amount);
    const win = numOf(params.win_amount);
    const transfer = numOf(params.transfer_amount);
    const realTransfer = numOf(params.real_transfer_amount);
    if (!isFinite(bet) || !isFinite(win) || !isFinite(transfer)) return PG_ERRORS.invalidRequest();

    // win_amount - bet_amount must equal transfer_amount (spec validation).
    if (Math.abs((win - bet) - transfer) > 0.005) return PG_ERRORS.amountMismatch();
    // USDT base unit is 1 → real_transfer_amount must equal transfer_amount.
    if (params.real_transfer_amount !== undefined && Math.abs(realTransfer - transfer) > 0.005) {
      return PG_ERRORS.invalidConfig();
    }

    const updatedTime = Number(params.updated_time) || Date.now();

    // Duplicate request → return the stored successful response, no money moved.
    const existing = await base44.asServiceRole.entities.PgSoftTransaction.filter(
      { transaction_id: transactionId }, '-created_date', 1
    );
    if (existing && existing.length && existing[0].status === 'success') {
      const prev = existing[0];
      return pgOk({
        currency_code: PG_CURRENCY,
        balance_amount: Math.max(0, trunc2(prev.balance_after)),
        updated_time: Number(prev.updated_time) || updatedTime,
        real_transfer_amount: trunc2(prev.transfer_amount),
      });
    }

    const wallet = await walletForPlayer(base44, playerName);
    if (!wallet) return PG_ERRORS.walletMissing();
    if (wallet.banned) return PG_ERRORS.playerMissing();

    const available = trunc2(wallet.balance);
    if (transfer < 0 && available + transfer < -0.0001) return PG_ERRORS.insufficient();

    const balanceAfter = transfer === 0
      ? available
      : await applyDelta(base44, playerName, trunc2(transfer));

    // Bets count toward the deposit play-through requirement.
    if (bet > 0) {
      const wagerLeft = Number(wallet.wager_remaining || 0);
      if (wagerLeft > 0) {
        await base44.asServiceRole.entities.Wallet.updateMany(
          { user_id: playerName },
          { $inc: { wager_remaining: -Math.min(wagerLeft, bet) } }
        );
      }
    }

    await base44.asServiceRole.entities.PgSoftTransaction.create({
      transaction_id: transactionId,
      user_id: playerName,
      kind: 'bet_payout',
      game_id: String(params.game_id || ''),
      bet_id: String(params.bet_id || ''),
      parent_bet_id: String(params.parent_bet_id || ''),
      bet_amount: trunc2(bet),
      win_amount: trunc2(win),
      transfer_amount: trunc2(transfer),
      balance_after: balanceAfter,
      updated_time: updatedTime,
      status: 'success',
    });

    // Mirror into the player's own history feed (best effort).
    if (bet > 0 || win > 0) {
      try {
        await base44.asServiceRole.entities.PlayerActivity.create({
          user_id: playerName,
          game_id: `pgsoft-${params.game_id || 'game'}`,
          bet: trunc2(bet),
          win: trunc2(win),
          outcome: win > bet ? 'win' : (win === bet ? 'push' : 'loss'),
          multiplier: bet > 0 ? trunc2(win / bet) : 0,
        });
      } catch { /* history mirror is best effort */ }
    }

    return pgOk({
      currency_code: PG_CURRENCY,
      balance_amount: Math.max(0, balanceAfter),
      updated_time: updatedTime,
      real_transfer_amount: trunc2(transfer),
    });
  } catch (error) {
    console.error('pgsoftCashTransferInOut error', error);
    return PG_ERRORS.betFailed();
  }
}