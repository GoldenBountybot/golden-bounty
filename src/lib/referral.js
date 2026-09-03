import { base44 } from '@/api/base44Client';

// 5% commission the referrer earns on every credited deposit.
//
// IMPORTANT: the MONEY is no longer paid from here. A database trigger
// (supabase/migrations/referral_commission_trigger.sql) pays the referrer's
// wallet, writes the commission transaction and sends the notification for
// EVERY deposit path — admin approval included. Paying here too would credit
// twice, so this helper now only mirrors the display-only referral stats.
const COMMISSION_RATE = 0.05;

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
    await base44.entities.User.update(referrer.id, {
      referral_earnings: Number(referrer.referral_earnings ?? 0) + commission,
      referral_bounty: Number(referrer.referral_bounty ?? 0) + commission * 2,
    });
    return commission;
  } catch {
    return null;
  }
}