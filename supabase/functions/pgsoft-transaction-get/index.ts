// PG SOFT → Cash/Transaction/Get (Checking a Transaction)
// PG SOFT calls this when it never got a response for a bet (Transfer Out), to
// find out whether we actually processed it. If we have the transaction stored
// we return its details; otherwise we return an error so PG SOFT treats the
// deduction as never having happened.
import { CURRENCY, ERR, OPERATOR_TOKEN, ensureWallet, fail, ok, preflight, readParams, checkOperatorToken, checkSecretKey, svc } from '../_shared/pgsoft.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const p = await readParams(req);
    if (!checkOperatorToken(p) || !checkSecretKey(p)) return fail(ERR.INVALID_TOKEN);

    const txId = p.transaction_id || '';
    if (!txId) return fail(ERR.TRANSACTION_NOT_FOUND);

    const { data: tx } = await svc.from('pgsoft_transactions')
      .select('user_id, bet_amount, transfer_amount, balance_after, updated_time, status')
      .eq('transaction_id', txId)
      .maybeSingle();

    // Not stored, or stored as failed → the money never moved on our side.
    if (!tx || tx.status !== 'success') return fail(ERR.TRANSACTION_NOT_FOUND);

    const wallet = await ensureWallet(tx.user_id);
    if (!wallet) return fail(ERR.WALLET_NOT_EXIST);

    return ok({
      operator_token: OPERATOR_TOKEN,
      player_name: tx.user_id,
      currency_code: CURRENCY,
      transaction_amount: Number(tx.bet_amount || 0),
      balance_amount: Number(wallet.balance || 0),
      updated_time: Number(tx.updated_time || Date.now()),
    });
  } catch (e) {
    return fail({ code: ERR.INTERNAL.code, message: String(e?.message || e) });
  }
});