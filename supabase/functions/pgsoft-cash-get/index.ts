// PG SOFT → Cash/Get (Get Player Wallet)
// Returns the player's authoritative wallet balance.
import { CURRENCY, ERR, ensureWallet, fail, ok, preflight, readParams, checkOperatorToken } from '../_shared/pgsoft.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const p = await readParams(req);
    if (!checkOperatorToken(p)) return fail(ERR.INVALID_TOKEN);

    const userId = p.player_name || '';
    if (!userId) return fail(ERR.PLAYER_NOT_FOUND);

    const wallet = await ensureWallet(userId);
    if (!wallet) return fail(ERR.PLAYER_NOT_FOUND);

    const balance = Number(wallet.balance || 0);
    return ok({
      currency: CURRENCY,
      balance_amount: balance,
      real_balance_amount: balance,
      updated_time: Date.now(),
    });
  } catch (e) {
    return fail({ code: ERR.INTERNAL.code, message: String(e?.message || e) });
  }
});