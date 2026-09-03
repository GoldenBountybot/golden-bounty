// Referral commission — 5% of every credited deposit goes to the depositor's
// referrer. Called server-side right after a deposit is credited, so it fires
// for BOTH auto-verified crypto deposits and any other server credit path.
//
// Idempotent: the commission transaction uses reference `refcom:<depositRef>`,
// so replaying the same deposit never pays twice.
// Best-effort: never throws — a commission failure must not break the deposit.

const COMMISSION_RATE = 0.05;

export async function applyReferralCommission(
  svc: any,
  depositorId: string,
  depositAmount: number,
  depositReference: string,
) {
  try {
    const amt = Number(depositAmount) || 0;
    if (!isFinite(amt) || amt <= 0 || !depositorId || !depositReference) return null;

    const commission = Math.round(amt * COMMISSION_RATE * 100) / 100;
    if (commission <= 0) return null;

    const reference = 'refcom:' + depositReference;
    const { data: seen } = await svc
      .from('transactions').select('id').eq('reference', reference).limit(1);
    if (seen?.length) return null;

    const { data: depositor } = await svc
      .from('profiles').select('*').eq('id', depositorId).maybeSingle();
    const referrerId = depositor?.referred_by;
    if (!referrerId) return null;

    const { data: referrer } = await svc
      .from('profiles').select('*').eq('id', referrerId).maybeSingle();
    if (!referrer) return null;

    const { data: wallet } = await svc
      .from('wallets').select('banned').eq('user_id', referrerId).maybeSingle();
    if (!wallet || wallet.banned) return null;

    // Credit the referrer's wallet atomically.
    const { error: walletErr } = await svc.rpc('wallet_apply_delta', {
      p_user: referrerId,
      p_delta: commission,
    });
    if (walletErr) return null;

    await svc.from('transactions').insert({
      user_id: referrerId,
      user_email: referrer.email || '',
      type: 'bonus',
      amount: commission,
      status: 'completed',
      method: 'referral-commission',
      reference,
      note: `5% commission on $${amt.toFixed(2)} deposit from ${depositor?.email || depositor?.uid || 'referral'}`,
    });

    // Display-only stats — the columns may not exist on older schemas, so a
    // failure here must not affect the money that was already credited.
    if ('referral_earnings' in referrer) {
      await svc.from('profiles').update({
        referral_earnings: (Number(referrer.referral_earnings) || 0) + commission,
        referral_bounty: (Number(referrer.referral_bounty) || 0) + commission * 2,
      }).eq('id', referrerId);
    }

    await svc.from('user_notifications').insert({
      user_id: referrerId,
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