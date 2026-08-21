// PG SOFT Seamless Wallet callback — Get Player Wallet (spec 5.1.3.1)
// Returns the player's cash balance (staked funds are excluded — they are locked).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  readPgRequest, credentialsValid, hashAuthValid, pgOk, PG_ERRORS, PG_CURRENCY,
  walletForPlayer, trunc2,
} from '../../shared/pgsoft.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { params, rawBody } = await readPgRequest(req);

    if (!(await hashAuthValid(req, rawBody))) return PG_ERRORS.invalidRequest();
    if (!credentialsValid(params)) return PG_ERRORS.invalidRequest();
    if (!params.player_name) return PG_ERRORS.invalidRequest();

    const wallet = await walletForPlayer(base44, params.player_name);
    if (!wallet) return PG_ERRORS.walletMissing();
    if (wallet.banned) return PG_ERRORS.playerMissing();

    return pgOk({
      currency_code: PG_CURRENCY,
      balance_amount: Math.max(0, trunc2(wallet.balance)),
      updated_time: new Date(wallet.updated_date || Date.now()).getTime(),
    });
  } catch (error) {
    console.error('pgsoftCashGet error', error);
    return PG_ERRORS.internal();
  }
}