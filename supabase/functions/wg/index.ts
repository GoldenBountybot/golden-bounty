// WG Seamless Wallet — the single operator endpoint WG calls for every wallet
// operation. Register this URL as 运营商API域名 (callback domain):
//   https://<project>.supabase.co/functions/v1/wg
// The operation is chosen by `s` inside the encrypted param:
//   70 token verification · 71 get wallet · 72 query order
//   73 bet+payout · 74 cancel bet+payout · 75 bet · 76 payout · 77 cancel bet
import {
  CODES, applyDelta, balanceOf, consumeWager, err, findTx, getSession, json, logRound,
  money2, num, ok, preflight, readRequest, saveTx, svc, walletOf,
} from '../_shared/wg.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();

  const parsed = await readRequest(req);
  if (!parsed.ok) return err(parsed.code, parsed.msg);
  const p = parsed.p;
  const s = String(p.s || '');
  const account = String(p.account || '');
  const sessionToken = String(p.sessionId || '');

  try {
    // Session-based auth: 70 is the login check, the rest must belong to a live
    // session for the same player.
    if (s === '70') {
      const session = await getSession(sessionToken);
      if (!session || session.status !== 'active' || new Date(session.expires_at).getTime() < Date.now()) {
        return err(CODES.TOKEN_FAILED, 'token verification failed');
      }
      if (session.user_id !== account) return err(CODES.TOKEN_FAILED, 'account mismatch');
      const wallet = await walletOf(account);
      if (!wallet) return err(CODES.WALLET_MISSING, 'player wallet does not exist');
      if (wallet.banned) return err(CODES.TOKEN_FAILED, 'account frozen');
      return ok({ money: money2(Number(wallet.balance || 0)) });
    }

    const wallet = await walletOf(account);
    if (!wallet) return err(CODES.PLAYER_MISSING, 'player does not exist');

    // 71 — current balance.
    if (s === '71') return ok({ money: money2(Number(wallet.balance || 0)) });

    // 72 — order status lookup (used before a manual payout replenishment).
    if (s === '72') {
      const tx = await findTx(String(p.transferId || ''));
      if (!tx) return err(CODES.ORDER_MISSING, 'no such order', { status: '2' });
      return ok({ status: tx.status === 'ok' ? '1' : '2' });
    }

    // ---- Money operations. transferId is the idempotency key. ----
    const transferId = String(p.transferId || '');

    // 73 bet + payout in one call · 75 bet only · 76 payout only
    if (s === '73' || s === '75' || s === '76') {
      if (!transferId) return err(21, 'parameter error');
      const done = await findTx(transferId);
      if (done) return ok({ money: money2(Number(done.balance_after || 0)) });

      const betMoney = s === '75' ? num(p.amount) : num(p.betMoney);
      const win = s === '75' ? 0 : s === '76' ? num(p.amount) : num(p.win);
      const delta = money2(win - (s === '76' ? 0 : betMoney));

      if (delta < 0 && money2(Number(wallet.balance || 0)) < Math.abs(delta)) {
        return err(CODES.INSUFFICIENT, 'player balance is insufficient');
      }

      let balance: number;
      try {
        balance = money2(await applyDelta(account, delta));
      } catch {
        return err(s === '76' ? CODES.PAYOUT_FAILED : CODES.INSUFFICIENT, 'balance update failed');
      }

      const stake = s === '76' ? num(p.betMoney) : betMoney;
      await saveTx({
        transfer_id: transferId,
        kind: s === '73' ? 'bet_payout' : s === '75' ? 'bet' : 'payout',
        user_id: account,
        account,
        session_token: sessionToken,
        kind_id: String(p.kindId || ''),
        record_id: String(p.recordId || ''),
        porder_id: String(p.porderId || ''),
        bet_money: stake,
        valid_bet: num(p.validBet),
        win,
        delta,
        balance_after: balance,
        status: 'ok',
        response: { money: balance },
      });

      if (s !== '76' && betMoney > 0) await consumeWager(account, betMoney);
      // One history row per settled round: 73 settles immediately, 76 settles a
      // round whose bet arrived via 75.
      if (s === '73' || s === '76') await logRound(account, String(p.kindId || ''), stake, win);

      return ok({ money: balance });
    }

    // 74 cancel bet + payout · 77 cancel bet — reverse the referenced transfer.
    if (s === '74' || s === '77') {
      const refId = String(p.refTransferId || '');
      const cancelId = `cancel:${refId}`;
      const already = await findTx(cancelId);
      if (already) return ok({ status: '1', money: money2(Number(already.balance_after || 0)) });

      const original = await findTx(refId);
      if (!original) {
        return err(CODES.ORDER_MISSING, `no corresponding record: ${refId}`, { status: '4', money: await balanceOf(account) });
      }
      if (original.status !== 'ok') {
        return ok({ status: '1', money: await balanceOf(account) });
      }
      // Only reversible within 3 hours per the spec.
      if (Date.now() - new Date(original.created_at).getTime() > 3 * 60 * 60 * 1000) {
        return err(CODES.ORDER_MISSING, 'cancel window expired', { status: '5', money: await balanceOf(account) });
      }

      const balance = money2(await applyDelta(account, money2(-Number(original.delta || 0))));
      await svc.from('wg_transactions').update({ status: 'cancelled' }).eq('id', original.id);
      await saveTx({
        transfer_id: cancelId,
        kind: 'cancel',
        user_id: account,
        account,
        session_token: sessionToken,
        kind_id: original.kind_id,
        record_id: original.record_id,
        porder_id: original.porder_id,
        delta: money2(-Number(original.delta || 0)),
        balance_after: balance,
        status: 'ok',
        response: { status: '1', money: balance },
      });
      return ok({ status: '1', money: balance });
    }

    return err(16, 'non-existent request');
  } catch (e) {
    return json({ code: 10, msg: String(e?.message || e), data: null });
  }
});