// PG SOFT → Cash/Rollback (Rollback a Transaction)
// Reverses a previously applied bet/payout transaction and responds with
// `true`. Idempotent on rollback_transaction_id, so PG SOFT retries never
// refund twice.
import { ERR, applyDelta, fail, ok, preflight, readParams, checkOperatorToken, checkSecretKey, svc } from '../_shared/pgsoft.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const p = await readParams(req);
    if (!checkOperatorToken(p) || !checkSecretKey(p)) return fail(ERR.INVALID_TOKEN);

    const txId = p.transaction_id || '';
    const rollbackId = p.rollback_transaction_id || `${txId}-rollback`;
    if (!txId) return fail(ERR.TRANSACTION_NOT_FOUND);

    const { data: tx } = await svc.from('pgsoft_transactions')
      .select('user_id, transfer_amount, status').eq('transaction_id', txId).maybeSingle();

    // Nothing applied on our side — nothing to reverse, so the rollback is
    // already effectively done.
    if (!tx || tx.status !== 'success') return ok(true);

    // Claim the rollback id first — the unique index is the idempotency lock.
    const claim = await svc.from('pgsoft_transactions').insert({
      transaction_id: rollbackId,
      user_id: tx.user_id,
      kind: 'adjustment',
      transfer_amount: -Number(tx.transfer_amount || 0),
      updated_time: Date.now(),
      status: 'success',
    }).select('id').single();

    if (claim.error) return ok(true); // already rolled back

    let balance: number;
    try {
      balance = await applyDelta(tx.user_id, -Number(tx.transfer_amount || 0));
    } catch (e) {
      await svc.from('pgsoft_transactions').update({ status: 'failed' }).eq('transaction_id', rollbackId);
      return fail({ code: ERR.INTERNAL.code, message: String(e?.message || e) });
    }

    await svc.from('pgsoft_transactions')
      .update({ balance_after: balance, updated_time: Date.now() })
      .eq('transaction_id', rollbackId);
    await svc.from('pgsoft_transactions')
      .update({ status: 'failed' })
      .eq('transaction_id', txId);

    return ok(true);
  } catch (e) {
    return fail({ code: ERR.INTERNAL.code, message: String(e?.message || e) });
  }
});