import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Redeem a referral promo code for the current (newly-registered) player.
// Validates the code against another player's stored promo_code, credits a $1
// bonus directly into the player's Stack (staked_amount — stack-only, not
// playable), records the referrer, and notifies both players.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const code = String(body.promo_code || '').trim().toUpperCase();
    if (!code) return Response.json({ error: 'Enter a promo code' }, { status: 400 });

    if (user.promo_claimed) {
      return Response.json({ error: 'You already redeemed a promo code' }, { status: 400 });
    }

    // Look up the referrer by their stored promo code (service role — regular
    // users cannot list other users).
    const matches = await base44.asServiceRole.entities.User.filter({ promo_code: code });
    const referrer = matches && matches[0];
    if (!referrer) return Response.json({ error: 'Invalid promo code' }, { status: 400 });
    if (referrer.id === user.id) {
      return Response.json({ error: 'You cannot use your own promo code' }, { status: 400 });
    }

    const PROMO_BONUS = 1;
    const curStaked = Number(user.staked_amount ?? 0) || 0;
    const now = new Date().toISOString();
    const update = {
      referred_by: referrer.id,
      promo_claimed: true,
      staked_amount: curStaked + PROMO_BONUS,
    };
    // Start the stack timer if the player had nothing staked yet, so the $1
    // bonus begins earning profit immediately.
    if (!user.staked_at) update.staked_at = now;
    if (!user.last_profit_claim) update.last_profit_claim = now;
    await base44.asServiceRole.entities.User.update(user.id, update);

    // Notify the new player about the bonus.
    await base44.asServiceRole.entities.UserNotification.create({
      user_id: user.id,
      type: 'bonus_arrived',
      title: 'Promo bonus received',
      body: `$1.00 bonus added to your Stack for using promo code ${code}. Stack it to earn profit!`,
      amount: PROMO_BONUS,
      link: '/dashboard?tab=stack',
    });
    // Notify the referrer that their code was used.
    await base44.asServiceRole.entities.UserNotification.create({
      user_id: referrer.id,
      type: 'system',
      title: 'Your promo code was used',
      body: `${user.email || 'A new player'} used your promo code. You earn 5% commission on every deposit they make.`,
    });

    return Response.json({ ok: true, bonus: PROMO_BONUS, referrer: referrer.email || '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}