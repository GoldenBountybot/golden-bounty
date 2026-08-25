// PG SOFT → VerifySession
// Validates the operator_player_session token we generated at game launch and
// returns the player identity + currency.
import { ERR, ensureWallet, fail, ok, preflight, readParams, checkOperatorToken, svc, CURRENCY } from '../_shared/pgsoft.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const p = await readParams(req);
    if (!checkOperatorToken(p)) return fail(ERR.INVALID_TOKEN);

    // PG SOFT may name the launch token differently per API version, so accept
    // every documented alias; as a last resort pick any 32-char hex value in
    // the payload (our tokens are 32-char hex).
    let token =
      p.operator_player_session || p.operatorplayersession || p.player_session ||
      p.session || p.ops || p.token || '';
    if (!token) {
      token = Object.values(p).find((v) => /^[0-9a-f]{32}$/i.test(String(v))) || '';
    }
    if (!token) return fail(ERR.INVALID_SESSION);

    const { data: session } = await svc
      .from('pgsoft_sessions')
      .select('user_id, status, expires_at')
      .eq('session_token', token)
      .maybeSingle();

    if (!session || session.status !== 'active') return fail(ERR.INVALID_SESSION);
    if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
      await svc.from('pgsoft_sessions').update({ status: 'expired' }).eq('session_token', token);
      return fail(ERR.INVALID_SESSION);
    }

    const { data: profile } = await svc.from('profiles').select('full_name, email').eq('id', session.user_id).maybeSingle();
    const wallet = await ensureWallet(session.user_id);
    if (!wallet || wallet.banned) return fail(ERR.PLAYER_NOT_FOUND);

    // Per the Seamless Mode v2.4.12 spec (5.1.2) VerifySession must return
    // "currency" — NOT "currency_code" (that name belongs to the wallet APIs).
    return ok({
      player_name: session.user_id,
      nickname: (profile?.full_name || (profile?.email || '').split('@')[0] || 'Player').slice(0, 30),
      currency: CURRENCY,
    });
  } catch (e) {
    return fail({ code: ERR.INTERNAL.code, message: String(e?.message || e) });
  }
});