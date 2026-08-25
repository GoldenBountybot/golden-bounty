// PG SOFT → Cash/Adjustment (Balance Adjustment)
// Applies a manual correction from PG SOFT. Idempotent on
// adjustment_transaction_id. Response shape follows the Balance Adjustment doc:
// adjust_amount / balance_before / balance_after / updated_time.
import { ERR, applyDelta, ensureWallet, fail, num, ok, preflight, readParams, checkOperatorToken, checkSecretKey, svc } from '../_shared/pgsoft.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const p = await readParams(req);
    if (!checkOperatorToken(p) || !checkSecretKey(p)) return fail(ERR.INVALID_TOKEN);

    const userId = p.player_name || '';
    const txId = p.adjustment_transaction_id || p.transaction_id || '';
    if (!userId || !txId) return fail(ERR.PLAYER_NOT_EXIST);

    const amount = p.adjustment_amount !== undefined ? num(p.adjustment_amount) : num(p.transfer_amount);

    const wallet = await ensureWallet(userId);
    if (!wallet) return fail(ERR.WALLET_NOT_EXIST);
    const balanceBefore = Number(wallet.balance || 0);

    const claim = await svc.from('pgsoft_transactions').insert({
      transaction_id: txId,
      user_id: userId,
      kind: 'adjustment',
      game_id: p.game_id || '',
      transfer_amount: amount,
      updated_time: Date.now(),
      status: 'success',
    }).select('id').single();

    if (claim.error) {
      // Duplicate request — replay the stored result, no wallet movement.
      const { data: prev } = await svc.from('pgsoft_transactions')
        .select('transfer_amount, balance_after, updated_time, status').eq('transaction_id', txId).maybeSingle();
      if (!prev) return fail({ code: ERR.INTERNAL.code, message: claim.error.message });
      if (prev.status !== 'success') return fail(ERR.INSUFFICIENT);
      const after = Number(prev.balance_after || 0);
      return ok({
        adjust_amount: Number(prev.transfer_amount || 0),
        balance_before: after - Number(prev.transfer_amount || 0),
        balance_after: after,
        updated_time: Number(prev.updated_time || Date.now()),
      });
    }

    let balance: number;
    try {
      balance = await applyDelta(userId, amount);
    } catch {
      await svc.from('pgsoft_transactions').update({ status: 'failed' }).eq('transaction_id', txId);
      return fail(ERR.INSUFFICIENT);
    }

    const updatedTime = Date.now();
    await svc.from('pgsoft_transactions')
      .update({ balance_after: balance, updated_time: updatedTime })
      .eq('transaction_id', txId);

    return ok({
      adjust_amount: amount,
      balance_before: balanceBefore,
      balance_after: balance,
      updated_time: updatedTime,
    });
  } catch (e) {
    return fail({ code: ERR.INTERNAL.code, message: String(e?.message || e) });
  }
});