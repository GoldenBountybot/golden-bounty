// Shared wallet helpers — find or create a user's wallet, migrating all
// financial fields from the legacy User entity on first access. Used by
// getWallet, commitBalanceDelta, adminAdjustWallet, stakeOperation, and
// pollSolanaPayDeposits so wallet logic is never duplicated across functions.

export async function findOrCreateWallet(base44, userId) {
  const wallets = await base44.asServiceRole.entities.Wallet.filter({ user_id: userId }, 'created_date', 10);
  if (wallets && wallets.length > 0) return wallets[0];
  // No wallet yet — one-time migration from the legacy User fields.
  const u = await base44.asServiceRole.entities.User.get(userId).catch(() => null);
  const wallet = await base44.asServiceRole.entities.Wallet.create({
    user_id: userId,
    balance: Number(u?.balance ?? 0) || 0,
    wager_remaining: Number(u?.wager_remaining ?? 0) || 0,
    staked_amount: Number(u?.staked_amount ?? 0) || 0,
    staked_at: u?.staked_at || null,
    last_profit_claim: u?.last_profit_claim || null,
    cashback_claimed_loss: Number(u?.cashback_claimed_loss ?? 0) || 0,
  });
  return wallet;
}

// Mirror wallet financial fields back to the User entity for display
// compatibility (admin panels, profile, etc.). Best-effort — never throws.
//
// SECURITY: balance, wager_remaining, and cashback_claimed_loss are NO LONGER
// on the User entity (removed to prevent users from setting them via
// updateMe). They are stripped here so existing callers don't break, but the
// authoritative source is always the Wallet entity. Only staking display
// mirrors (staked_amount, staked_at, last_profit_claim) are still written.
export async function mirrorToUser(base44, userId, fields) {
  try {
    const { balance, wager_remaining, cashback_claimed_loss, ...safe } = fields;
    await base44.asServiceRole.entities.User.update(userId, safe);
  } catch { /* mirror is best-effort */ }
}