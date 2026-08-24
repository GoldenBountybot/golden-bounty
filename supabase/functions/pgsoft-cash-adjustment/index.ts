// PG SOFT → Cash/Adjustment (Balance Adjustment)
// Applies a manual correction from PG SOFT. Idempotent on
// adjustment_transaction_id.
import { CURRENCY, ERR, applyDelta, ensureWallet, fail, num, ok, preflight, readParams, checkOperatorToken, svc } from '../_shared/pgsoft.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const p = await readParams(req);
    if (!checkOperatorToken(p)) return fail(ERR.INVALID_TOKEN);

    const userId = p.player_name || '';
    const txId = p.adjustment_transaction_id || p.transaction_id || '';
    if (!userId || !txId) return fail(ERR.PLAYER_NOT_FOUND);

    const amount = p.adjustment_amount !== undefined ? num(p.adjustment_amount) : num(p.transfer_amount);

    const wallet = await ensureWallet(userId);
    if (!wallet) return fail(ERR.PLAYER_NOT_FOUND);

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
      currency: CURRENCY,
      balance_amount: balance,
      real_balance_amount: balance,
      updated_time: updatedTime,
    });
  } catch (e) {
    return fail({ code: ERR.INTERNAL.code, message: String(e?.message || e) });
  }
});