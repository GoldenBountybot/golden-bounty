// PG SOFT Seamless Wallet callback — VerifySession (spec 5.1.2)
// PG SOFT calls this to validate the operator_player_session created at launch.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  readPgRequest, credentialsValid, hashAuthValid, pgOk, PG_ERRORS, PG_CURRENCY,
} from '../../shared/pgsoft.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { params, rawBody } = await readPgRequest(req);

    if (!(await hashAuthValid(req, rawBody))) return PG_ERRORS.invalidRequest();
    if (!credentialsValid(params)) return PG_ERRORS.invalidRequest();

    const token = params.operator_player_session;
    if (!token) return PG_ERRORS.invalidRequest();

    const sessions = await base44.asServiceRole.entities.PgSoftSession.filter(
      { session_token: token }, '-created_date', 1
    );
    const session = sessions && sessions.length ? sessions[0] : null;
    if (!session || session.status !== 'active') return PG_ERRORS.invalidRequest();
    if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
      return PG_ERRORS.invalidRequest();
    }

    const user = await base44.asServiceRole.entities.User.get(session.user_id).catch(() => null);
    if (!user) return PG_ERRORS.playerMissing();

    return pgOk({
      player_name: session.user_id,
      nickname: String(user.full_name || 'Player').slice(0, 50),
      currency: PG_CURRENCY,
    });
  } catch (error) {
    console.error('pgsoftVerifySession error', error);
    return PG_ERRORS.internal();
  }
}