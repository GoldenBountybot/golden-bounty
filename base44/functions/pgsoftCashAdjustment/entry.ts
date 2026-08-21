// PG SOFT Seamless Wallet callback — Balance Adjustment (spec 5.1.3.3)
// Mandatory for seamless wallet operators. Adds/deducts balance for tournaments
// and promotions. Idempotent on adjustment_transaction_id.
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
    const txId = params.adjustment_transaction_id;
    if (!playerName || !txId) return PG_ERRORS.invalidRequest();
    if (params.currency_code && params.currency_code !== PG_CURRENCY) return PG_ERRORS.invalidRequest();

    const transfer = numOf(params.transfer_amount);
    const realTransfer = numOf(params.real_transfer_amount);
    if (!isFinite(transfer)) return PG_ERRORS.invalidRequest();
    // USDT base unit is 1 → real_transfer_amount must equal transfer_amount.
    if (params.real_transfer_amount !== undefined && Math.abs(realTransfer - transfer) > 0.005) {
      return PG_ERRORS.invalidConfig();
    }

    const updatedTime = Number(params.adjustment_time) || Date.now();

    const existing = await base44.asServiceRole.entities.PgSoftTransaction.filter(
      { transaction_id: txId }, '-created_date', 1
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

    const available = trunc2(wallet.balance);
    if (transfer < 0 && available + transfer < -0.0001) return PG_ERRORS.insufficient();

    const balanceAfter = transfer === 0
      ? available
      : await applyDelta(base44, playerName, trunc2(transfer));

    await base44.asServiceRole.entities.PgSoftTransaction.create({
      transaction_id: txId,
      user_id: playerName,
      kind: 'adjustment',
      transfer_amount: trunc2(transfer),
      balance_after: balanceAfter,
      updated_time: updatedTime,
      status: 'success',
    });

    return pgOk({
      currency_code: PG_CURRENCY,
      balance_amount: Math.max(0, balanceAfter),
      updated_time: updatedTime,
      real_transfer_amount: trunc2(transfer),
    });
  } catch (error) {
    console.error('pgsoftCashAdjustment error', error);
    return PG_ERRORS.internal();
  }
}