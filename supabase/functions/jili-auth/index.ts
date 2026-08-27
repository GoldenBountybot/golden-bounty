// JILI → /auth (§4.2.2). Validates the player token we issued at launch and
// returns the account, currency and balance.
import { CURRENCY, JILI_ERR, ensureWallet, preflight, readBody, reply, replyError, svc } from '../_shared/jili.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const p = await readBody(req);
    const token = String(p.token || '');
    if (!token) return replyError(JILI_ERR.TOKEN_EXPIRED, 'Token expired');

    const { data: session } = await svc
      .from('jili_sessions')
      .select('user_id, status, expires_at')
      .eq('session_token', token)
      .maybeSingle();
    if (!session || session.status !== 'active') return replyError(JILI_ERR.TOKEN_EXPIRED, 'Token expired');
    if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
      await svc.from('jili_sessions').update({ status: 'expired' }).eq('session_token', token);
      return replyError(JILI_ERR.TOKEN_EXPIRED, 'Token expired');
    }

    const wallet = await ensureWallet(session.user_id);
    if (!wallet || wallet.banned) return replyError(JILI_ERR.OTHER, 'Player not available');

    return reply({
      username: session.user_id,
      currency: CURRENCY,
      balance: Number(wallet.balance || 0),
    });
  } catch (e) {
    return replyError(JILI_ERR.OTHER, String(e?.message || e));
  }
});