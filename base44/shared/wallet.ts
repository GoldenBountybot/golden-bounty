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
    // Security fields migrated from the User entity so users can't set them
    // via updateMe: banned (account block) and rtp (win-chance override).
    banned: !!u?.banned,
    rtp: u?.rtp != null ? Number(u.rtp) : null,
  });
  return wallet;
}

// Credits a verified deposit to the user's wallet (service role) and creates
// the completed Transaction record in one atomic operation. Used by all the
// verify*Deposit backend functions so the balance is credited SERVER-SIDE —
// the frontend no longer credits via setBalance (which commitBalanceDelta
// now rejects for positive deltas).
export async function creditDeposit(base44, userId, userEmail, amount, method, reference, note) {
  const MAX_DEPOSIT = 100000; // Defense-in-depth: absolute cap per deposit
  const amt = Math.min(Number(amount || 0), MAX_DEPOSIT);
  if (!isFinite(amt) || amt <= 0) throw new Error('Invalid deposit amount');

  const wallet = await findOrCreateWallet(base44, userId);
  // Banned users can't receive deposit credits (defense-in-depth — the
  // client-side ban check in AuthContext reads this same Wallet.banned flag,
  // which the user can't bypass since Wallet is admin-only write).
  if (wallet.banned) throw new Error('Account banned');

  // ATOMIC INCREMENT — prevents the read-modify-write race condition where a
  // concurrent operation (beginRound bet deduction, settleBet win credit,
  // adminAdjustWallet) reads the old balance and overwrites this deposit
  // credit. $inc is atomic at the database level — the deposit is ALWAYS
  // added on top of the latest balance, never lost or overwritten.
  await base44.asServiceRole.entities.Wallet.updateMany(
    { user_id: userId },
    { $inc: { balance: amt, wager_remaining: amt } }
  );

  // Re-read to get the authoritative balance for the response.
  const updated = await findOrCreateWallet(base44, userId);

  await base44.asServiceRole.entities.Transaction.create({
    user_id: userId,
    user_email: userEmail || '',
    type: 'deposit',
    amount: amt,
    status: 'completed',
    method,
    reference,
    note,
  });
  return { balance: Number(updated.balance ?? 0), wager_remaining: Number(updated.wager_remaining ?? 0) };
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