// Endorphina Seamless Wallet callbacks (API v1.8.1).
// One edge function serving every endpoint under
//   /functions/v1/endorphina/{session|balance|bet|refund|win|promoWin|endSession|check}
import {
  CURRENCY, NODE_ID, applyDelta, fail, findTx, getSession, json, makeSign, preflight,
  readParams, saveTx, sha1hex, svc, toThousandths, toUnits, validSign, walletBalance,
} from '../_shared/endorphina.ts';

const newTxId = () => crypto.randomUUID().replace(/-/g, '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  const path = new URL(req.url).pathname.split('/').filter(Boolean).pop() || '';
  const p = await readParams(req);

  try {
    // GET /check — connectivity + salt check, answered before signature checks.
    if (path === 'check') {
      const param = String(p.param || '');
      const expected = await sha1hex(NODE_ID + param + (Deno.env.get('ENDORPHINA_SALT') || ''));
      if (String(p.sign || '').toLowerCase() !== expected) return fail('ACCESS_DENIED');
      return json({ nodeId: Number(NODE_ID) || NODE_ID, param, sign: expected });
    }

    if (!(await validSign(p))) return fail('ACCESS_DENIED');

    const token = String(p.token || '');
    const session = token ? await getSession(token) : null;

    // GET /session — who is playing.
    if (path === 'session') {
      if (!session) return fail('TOKEN_NOT_FOUND');
      if (session.status !== 'active' || new Date(session.expires_at).getTime() < Date.now()) {
        return fail('TOKEN_EXPIRED');
      }
      const { data: prof } = await svc.from('profiles').select('username, telegram_username, full_name')
        .eq('id', session.user_id).maybeSingle();
      return json({
        player: session.user_id,
        currency: session.currency || CURRENCY,
        game: session.game || '',
        nickname: prof?.username || prof?.telegram_username || prof?.full_name || 'Player',
      });
    }

    // GET /balance
    if (path === 'balance') {
      if (!session) return fail('TOKEN_NOT_FOUND');
      return json({ balance: toThousandths(await walletBalance(session.user_id)) });
    }

    // POST /bet — debit. May fail with 402.
    if (path === 'bet') {
      if (!session) return fail('TOKEN_NOT_FOUND');
      if (session.status !== 'active' || new Date(session.expires_at).getTime() < Date.now()) {
        return fail('TOKEN_EXPIRED');
      }
      const id = String(p.id || '');
      const existing = await findTx(id, 'bet');
      if (existing) return json(existing.response);

      const amount = toUnits(p.amount);
      let balance: number;
      try {
        balance = await applyDelta(session.user_id, -amount);
      } catch {
        return fail('INSUFFICIENT_FUNDS');
      }
      const response = { transactionId: newTxId(), balance: toThousandths(balance) };
      await saveTx({
        provider_id: id, kind: 'bet', user_id: session.user_id, token,
        game: String(p.game || session.game || ''), game_id: String(p.gameId || ''),
        amount: -amount, balance_after: balance, status: 'ok', response,
      });
      // Bets count toward the deposit play-through requirement.
      if (amount > 0) {
        const { data: w } = await svc.from('wallets').select('wager_remaining').eq('user_id', session.user_id).maybeSingle();
        await svc.from('wallets')
          .update({ wager_remaining: Math.max(0, Number(w?.wager_remaining || 0) - amount) })
          .eq('user_id', session.user_id);
      }
      return json(response);
    }

    // POST /win — credit. Must never return an error (Endorphina retries).
    if (path === 'win') {
      const id = String(p.id || `zero-${p.betTransactionId || p.gameId || newTxId()}`);
      const existing = await findTx(id, 'win');
      if (existing) return json(existing.response);

      // A win may arrive for a bet from an earlier session (gameId=0); fall back
      // to the bet transaction's owner when the token no longer resolves.
      // Endorphina sends a win (possibly 0) for every bet, so the matching bet
      // row gives us the stake — this is where one full round is known.
      const bet = p.betTransactionId ? await findTx(String(p.betTransactionId), 'bet') : null;
      let userId = (session?.user_id || bet?.user_id) as string | undefined;
      if (!userId) return fail('TOKEN_NOT_FOUND');

      const amount = toUnits(p.amount);
      const balance = amount > 0 ? await applyDelta(userId, amount) : await walletBalance(userId);
      const response = { transactionId: newTxId(), balance: toThousandths(balance) };
      const game = String(p.game || session?.game || bet?.game || '');
      await saveTx({
        provider_id: id, kind: 'win', user_id: userId, token,
        game, game_id: String(p.gameId || ''),
        amount, balance_after: balance, status: 'ok', response,
      });

      // Player history entry for this round (same shape as our own games).
      const stake = Math.abs(Number(bet?.amount || 0));
      if (stake > 0 || amount > 0) {
        await svc.from('player_activity').insert({
          user_id: userId,
          game_id: `endorphina:${game}`,
          bet: stake,
          win: amount,
          outcome: amount > stake ? 'win' : amount === stake ? 'push' : 'loss',
          multiplier: stake > 0 ? amount / stake : 0,
        });
      }
      return json(response);
    }

    // POST /refund — cancel a bet. Never errors; unknown bets are stored as cancelled.
    if (path === 'refund') {
      const id = String(p.id || '');
      const done = await findTx(id, 'refund');
      if (done) return json(done.response);

      const bet = await findTx(id, 'bet');
      let userId = (bet?.user_id || session?.user_id) as string | undefined;
      let balance = userId ? await walletBalance(userId) : 0;

      if (bet && bet.status === 'ok') {
        balance = await applyDelta(userId!, Math.abs(Number(bet.amount)));
        await svc.from('endorphina_transactions').update({ status: 'cancelled' }).eq('id', bet.id);
      } else if (!bet) {
        // Bet never arrived: block it forever, balance untouched.
        await saveTx({
          provider_id: id, kind: 'bet', user_id: userId ?? null, token,
          game: String(p.game || ''), game_id: String(p.gameId || ''),
          amount: 0, balance_after: balance, status: 'cancelled',
          response: { transactionId: newTxId(), balance: toThousandths(balance) },
        });
      }

      const response = { transactionId: newTxId(), balance: toThousandths(balance) };
      await saveTx({
        provider_id: id, kind: 'refund', user_id: userId ?? null, token,
        game: String(p.game || ''), game_id: String(p.gameId || ''),
        amount: 0, balance_after: balance, status: 'ok', response,
      });
      return json(response);
    }

    // POST /promoWin — tournament / prize-drop credit (promo tools are enabled).
    if (path === 'promoWin') {
      const id = String(p.id || '');
      const existing = await findTx(id, 'promoWin');
      if (existing) return json(existing.response);

      const userId = (session?.user_id || String(p.player || '')) as string;
      if (!userId) return fail('TOKEN_NOT_FOUND');
      // We do not run Endorphina promo campaigns / tournaments, so promo wins are
      // acknowledged (the provider must not retry) but NEVER credited — otherwise
      // their promo tools can add money that no player actually won.
      const amount = toUnits(p.amount);
      const balance = await walletBalance(userId);
      const response = { transactionId: newTxId(), balance: toThousandths(balance) };
      await saveTx({
        provider_id: id, kind: 'promoWin', user_id: userId, token,
        game: String(p.game || ''), game_id: String(p.gameId || ''),
        amount: 0, balance_after: balance, status: 'ignored', response,
      });
      return json(response);
    }

    // POST /endSession — the game round finished; retire the launch token.
    if (path === 'endSession') {
      if (session) {
        await svc.from('endorphina_sessions').update({ status: 'closed' }).eq('token', token);
      }
      return json({ balance: toThousandths(session ? await walletBalance(session.user_id) : 0) });
    }

    return fail('NO_RETRY', 'unknown endpoint');
  } catch (e) {
    return json({ code: 'INTERNAL_ERROR', message: String(e?.message || e) }, 500);
  }
});