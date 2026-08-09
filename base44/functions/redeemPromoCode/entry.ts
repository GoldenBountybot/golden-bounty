import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findOrCreateWallet, mirrorToUser } from '../../shared/wallet.ts';

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

    // Ensure the current user's own promo_code is persisted so others can
    // redeem it later (some early users only have uid, not the promo_code field).
    if (!user.promo_code && user.uid) {
      try {
        await base44.asServiceRole.entities.User.update(user.id, { promo_code: 'GB' + user.uid });
      } catch { /* non-critical */ }
    }

    // Look up the referrer by their stored promo code (service role — regular
    // users cannot list other users). Pass sort + limit so the filter behaves
    // consistently across SDK versions (matching the working pattern in
    // getReferralStats).
    let matches = await base44.asServiceRole.entities.User.filter({ promo_code: code }, '-created_date', 50);
    // Fallback: some early users never had their promo_code field persisted
    // (it's displayed as "GB" + uid on the PromoWelcome page but not saved).
    // If the direct lookup misses, strip the "GB" prefix and look up by uid.
    if (!matches || !matches.length) {
      const uidPart = code.startsWith('GB') ? code.slice(2) : code;
      if (uidPart) {
        matches = await base44.asServiceRole.entities.User.filter({ uid: uidPart }, '-created_date', 50);
      }
    }
    const referrer = matches && matches[0];
    if (!referrer) return Response.json({ error: 'Invalid promo code' }, { status: 400 });
    // If the referrer's promo_code field is missing, persist it now so future
    // lookups hit the fast path.
    if (!referrer.promo_code) {
      try {
        await base44.asServiceRole.entities.User.update(referrer.id, { promo_code: 'GB' + (referrer.uid || '') });
      } catch { /* non-critical */ }
    }
    if (referrer.id === user.id) {
      return Response.json({ error: 'You cannot use your own promo code' }, { status: 400 });
    }

    const PROMO_BONUS = 1;
    const now = new Date().toISOString();
    // Credit the $1 bonus to the SECURE Wallet entity (source of truth for
    // staked_amount). The Wallet RLS blocks users from modifying it, so this
    // promo bonus can't be faked or inflated by the user.
    const wallet = await findOrCreateWallet(base44, user.id);
    if (wallet.banned) return Response.json({ error: 'Account banned' }, { status: 403 });
    const curStaked = Number(wallet.staked_amount ?? 0) || 0;
    const walletUpdate = {
      staked_amount: curStaked + PROMO_BONUS,
      staked_at: wallet.staked_at || now,
      last_profit_claim: wallet.last_profit_claim || now,
    };
    await base44.asServiceRole.entities.Wallet.update(wallet.id, walletUpdate);
    // Mirror to User for display compatibility + persist referral metadata.
    await mirrorToUser(base44, user.id, {
      referred_by: referrer.id,
      promo_claimed: true,
      ...walletUpdate,
    });

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