import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { findOrCreateWallet } from '../../shared/wallet.ts';

// Admin-only: adjusts any user's wallet by a delta (credit or debit). Used by
// the admin Transactions panel and the referral commission flow. Verifies the
// caller is an admin, then applies the change as the service role. Mirrors
// the result to User.balance for display compatibility.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const targetUserId = String(body.user_id || '');
    const delta = Number(body.delta ?? 0);
    const wagerDelta = Number(body.wager_delta ?? 0);

    if (!targetUserId || !isFinite(delta)) {
      return Response.json({ error: 'invalid-params' }, { status: 400 });
    }

    const wallet = await findOrCreateWallet(base44, targetUserId);
    // set_balance=true: set the balance to an absolute value (admin "Set
    // Balance" action from the Players panel). set_balance=false (default):
    // apply a delta (used by deposit/withdrawal approval & referral commission).
    const setBalance = !!body.set_balance;

    // Admin-only security fields: banned (block account) and rtp (per-player
    // winning-chance override). These live on the Wallet entity (admin-only
    // update RLS) so users can't set them on themselves via updateMe.
    const setFields = {};
    if (body.banned !== undefined) setFields.banned = !!body.banned;
    if (body.rtp !== undefined) {
      const rtpVal = Number(body.rtp);
      setFields.rtp = isFinite(rtpVal) && rtpVal >= 0 && rtpVal <= 100 ? rtpVal : null;
    }

    // ATOMIC UPDATE — delta mode uses $inc (prevents race condition where a
    // concurrent deposit credit is overwritten by the admin's read-modify-write).
    // set_balance mode uses $set for the absolute value.
    if (setBalance) {
      setFields.balance = Math.max(0, delta);
      setFields.wager_remaining = Math.max(0, Number(wallet.wager_remaining ?? 0) + wagerDelta);
      await base44.asServiceRole.entities.Wallet.updateMany(
        { user_id: targetUserId },
        { $set: setFields }
      );
    } else {
      await base44.asServiceRole.entities.Wallet.updateMany(
        { user_id: targetUserId },
        { $inc: { balance: delta, wager_remaining: wagerDelta }, $set: setFields }
      );
    }

    // Re-read for the authoritative balance to return.
    const updated = await findOrCreateWallet(base44, targetUserId);
    const newBal = Math.max(0, Number(updated.balance ?? 0));
    const newWager = Math.max(0, Number(updated.wager_remaining ?? 0));

    // Mirror banned/rtp to the User entity for admin display compatibility.
    try {
      const userUpdate = {};
      if (body.banned !== undefined) userUpdate.banned = !!body.banned;
      if (body.rtp !== undefined) userUpdate.rtp = setFields.rtp;
      if (Object.keys(userUpdate).length) {
        await base44.asServiceRole.entities.User.update(targetUserId, userUpdate);
      }
    } catch { /* best-effort mirror */ }

    return Response.json({ balance: newBal, wager_remaining: newWager });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}