
import { json, CORS, rpc, authUser } from '../_shared/engine.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const user = await authUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const roundToken = String(body.round_token || '');
    if (!roundToken) {
      return json({ error: 'round-token-required',
        detail: 'A valid round token from begin-round is required to settle.' }, 400);
    }

    const res = await rpc('settle_round_secure', {
      p_token: roundToken, p_user: user.id,
      p_client_win: Number(body.win_amount ?? 0), p_email: user.email || '',
    });
    if (!res.ok) {
      const code = res.error === 'round-not-found' ? 404 : (res.error === 'banned' || res.error === 'round-not-owned' ? 403 : 400);
      return json({ error: res.error }, code);
    }
    return json({ balance: Number(res.balance), win_amount: Number(res.win_amount), wager_remaining: Number(res.wager_remaining) });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
