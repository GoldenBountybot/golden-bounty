import { base44 } from '@/api/base44Client';
import { pushNotification } from '@/lib/notify';

// 5% commission the referrer earns on every approved deposit from a player
// who redeemed their promo code.
const COMMISSION_RATE = 0.05;

// Apply referral commission to the referrer of a depositor, after a deposit is
// approved/completed. Best-effort: never throws back to the caller — commission
// failure must not block the deposit approval.
export async function applyReferralCommission(depositorId, depositAmount) {
  try {
    const amt = Number(depositAmount) || 0;
    if (amt <= 0) return null;
    const depositor = await base44.entities.User.get(depositorId).catch(() => null);
    if (!depositor || !depositor.referred_by) return null;
    const referrer = await base44.entities.User.get(depositor.referred_by).catch(() => null);
    if (!referrer) return null;
    const commission = Math.round(amt * COMMISSION_RATE * 100) / 100;
    if (commission <= 0) return null;
    const nextBal = Number(referrer.balance ?? 0) + commission;
    const nextEarnings = Number(referrer.referral_earnings ?? 0) + commission;
    const nextReferralBounty = Number(referrer.referral_bounty ?? 0) + commission * 2;
    await base44.entities.User.update(referrer.id, {
      balance: nextBal,
      referral_earnings: nextEarnings,
      referral_bounty: nextReferralBounty,
    });
    await base44.entities.Transaction.create({
      user_id: referrer.id,
      user_email: referrer.email,
      type: 'bonus',
      amount: commission,
      status: 'completed',
      method: 'referral-commission',
      note: `5% commission on $${amt.toFixed(2)} deposit from ${depositor.email || depositor.uid || 'referral'}`,
    });
    await pushNotification({
      user_id: referrer.id,
      type: 'bonus_arrived',
      title: 'Referral commission earned',
      body: `+$${commission.toFixed(2)} commission from your referral's $${amt.toFixed(2)} deposit`,
      amount: commission,
    });
    return commission;
  } catch {
    return null;
  }
}