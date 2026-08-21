// Game launch (HTML Scheme, spec 3.1.1). Creates the operator_player_session
// for the logged-in player, calls PG SOFT's GetLaunchURLHTML and returns the
// HTML code, which the frontend renders as-is (iframe / new window).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { pgConfig } from '../../shared/pgsoft.ts';
import { findOrCreateWallet } from '../../shared/wallet.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const gameId = String(body.game_id || '').trim();
    if (!gameId) return Response.json({ error: 'game_id is required' }, { status: 400 });

    const cfg = pgConfig();
    const pending = (v) => !v || String(v).trim().toUpperCase() === 'PENDING';
    if (pending(cfg.operatorToken) || pending(cfg.apiDomain)) {
      return Response.json({ error: 'PG SOFT credentials are not configured yet' }, { status: 503 });
    }

    const wallet = await findOrCreateWallet(base44, user.id);
    if (wallet.banned) return Response.json({ error: 'Account banned' }, { status: 403 });

    // One-time launch session token PG SOFT will validate via VerifySession.
    const sessionToken = crypto.randomUUID().replace(/-/g, '');
    await base44.asServiceRole.entities.PgSoftSession.create({
      user_id: user.id,
      session_token: sessionToken,
      game_id: gameId,
      status: 'active',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    const clientIp = (req.headers.get('cf-connecting-ip')
      || (req.headers.get('x-forwarded-for') || '').split(',')[0]
      || '').trim();

    const form = new URLSearchParams();
    form.set('operator_token', cfg.operatorToken);
    form.set('path', `/${gameId}/index.html`);
    form.set('extra_args', `btt=1&ops=${sessionToken}&l=${body.language || 'en'}`);
    form.set('url_type', 'game-entry');
    if (clientIp) form.set('client_ip', clientIp);

    const domain = cfg.apiDomain.replace(/\/+$/, '');
    const pgRes = await fetch(`${domain}/external-game-launcher/api/v1/GetLaunchURLHTML`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const html = await pgRes.text();
    if (!pgRes.ok) {
      return Response.json({ error: 'PG SOFT launch failed', detail: html.slice(0, 500) }, { status: 502 });
    }

    return Response.json({ html, session_token: sessionToken });
  } catch (error) {
    console.error('pgsoftLaunchGame error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}