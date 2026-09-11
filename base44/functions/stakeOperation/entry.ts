import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { findOrCreateWallet, mirrorToUser } from '../../shared/wallet.ts';

// Secure staking operations — the ONLY way staking fields (staked_amount,
// staked_at, last_profit_claim) and the balance changes they imply can be
// applied. The Wallet entity's RLS blocks users from updating it directly,
// so a user can't inflate staked_amount via the console and then unlock it
// for free balance.
//
// Actions:
//   stake       — lock `amount` from balance into the Stack (restarts timer)
//   claimProfit — credit accrued profit into balance, advance last_profit_claim
//   autoUnlock  — if the 15-day lock elapsed, return staked + profit to balance
//
// All operations are atomic: the wallet is read, validated, updated, and
// mirrored to the User entity in one call. Profit is computed server-side
// from the VIP rate (based on total approved deposits) so a client can't
// fake the profit amount.

const DAY = 24 * 60 * 60 * 1000;
const LOCK_DAYS = 15;
const BASE_RATE = 0.0222;
const VIP_LEVELS = [
  { minDeposit: 50000, rate: 0.04 },
  { minDeposit: 10000, rate: 0.0366 },
  { minDeposit: 1000, rate: 0.0333 },
  { minDeposit: 500, rate: 0.03 },
  { minDeposit: 100, rate: 0.0255 },
];

function rateForDeposits(total) {
  for (const lv of VIP_LEVELS) {
    if (total >= lv.minDeposit) return lv.rate;
  }
  return BASE_RATE;
}

function computeProfit(staked, stakedAt, lastClaim, rate) {
  if (!staked || !stakedAt) return 0;
  const start = new Date(stakedAt).getTime();
  if (isNaN(start)) return 0;
  const lc = lastClaim ? new Date(lastClaim).getTime() : start;
  const capMs = LOCK_DAYS * DAY;
  const elapsedMs = Math.min(Math.max(0, Date.now() - start), capMs);
  const claimedMs = Math.min(Math.max(0, lc - start), capMs);
  const pendingMs = Math.max(0, elapsedMs - claimedMs);
  const profit = staked * rate * (pendingMs / DAY);
  return Math.floor(profit * 100) / 100;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');

    const wallet = await findOrCreateWallet(base44, user.id);
    if (wallet.banned) return Response.json({ error: 'Account banned' }, { status: 403 });
    let balance = Number(wallet.balance ?? 0);
    let staked = Number(wallet.staked_amount ?? 0);
    let stakedAt = wallet.staked_at || null;
    let lastClaim = wallet.last_profit_claim || null;
    let wager = Number(wallet.wager_remaining ?? 0);
    let credited = 0;

    // Fetch total approved deposits to determine the VIP profit rate.
    let totalDeposits = 0;
    try {
      const txs = await base44.asServiceRole.entities.Transaction.filter({ user_id: user.id, type: 'deposit' }, '-created_date', 500);
      totalDeposits = (txs || [])
        .filter((t) => t.status === 'approved' || t.status === 'completed')
        .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    } catch { /* default rate */ }
    const rate = rateForDeposits(totalDeposits);

    // ── ATOMIC OPERATIONS ──
    // Each action uses updateMany with $inc/$set (atomic at the DB level) to
    // prevent the read-modify-write race condition where two concurrent
    // operations both read the same balance and both succeed — overdrawing
    // or double-crediting. The `stake` action uses a conditional filter
    // (balance >= amount) so the deduction only happens if sufficient.
    if (action === 'stake') {
      const amount = Number(body.amount ?? 0);
      if (!isFinite(amount) || amount <= 0) {
        return Response.json({ error: 'invalid-amount' }, { status: 400 });
      }
      const wagerDec = Math.min(amount, wager);
      const now = new Date().toISOString();
      // Atomic check-and-deduct: only deduct if balance >= amount.
      // Prevents the double-spend race where two concurrent stakes (or a
      // stake + beginRound) both read the same balance and both succeed.
      const res = await base44.asServiceRole.entities.Wallet.updateMany(
        { user_id: user.id, balance: { $gte: amount } },
        { $inc: { balance: -amount, staked_amount: amount, wager_remaining: -wagerDec }, $set: { staked_at: now, last_profit_claim: now } }
      );
      if (!res || Number(res.updated || 0) === 0) {
        return Response.json({ error: 'insufficient-balance' }, { status: 400 });
      }
      const updated = await findOrCreateWallet(base44, user.id);
      balance = Number(updated.balance ?? 0);
      staked = Number(updated.staked_amount ?? 0);
      stakedAt = updated.staked_at;
      lastClaim = updated.last_profit_claim;
      wager = Math.max(0, Number(updated.wager_remaining ?? 0));
    } else if (action === 'claimProfit') {
      const profit = computeProfit(staked, stakedAt, lastClaim, rate);
      if (profit <= 0) {
        return Response.json({ error: 'no-profit' }, { status: 400 });
      }
      const now = new Date().toISOString();
      await base44.asServiceRole.entities.Wallet.updateMany(
        { user_id: user.id },
        { $inc: { balance: profit }, $set: { last_profit_claim: now } }
      );
      credited = profit;
      balance += profit;
      lastClaim = now;
    } else if (action === 'autoUnlock') {
      if (!staked || !stakedAt) {
        return Response.json({ error: 'nothing-staked' }, { status: 400 });
      }
      const elapsed = (Date.now() - new Date(stakedAt).getTime()) / DAY;
      if (elapsed < LOCK_DAYS) {
        return Response.json({ error: 'still-locked' }, { status: 400 });
      }
      const profit = computeProfit(staked, stakedAt, lastClaim, rate);
      const total = staked + profit;
      // Atomic check-and-credit: the credit only lands if staked_amount is
      // STILL the value we just read. Several parts of the app load the
      // stake state at once (Dashboard + Stack page + the 1s tick), so
      // concurrent autoUnlock calls all passed the elapsed check and each
      // credited the balance — the stacked amount got added 2-3 times.
      // The first winner sets staked_amount to 0; every other caller's
      // filter then matches nothing, so no extra credit can happen.
      const res = await base44.asServiceRole.entities.Wallet.updateMany(
        { user_id: user.id, staked_amount: staked },
        { $inc: { balance: total }, $set: { staked_amount: 0, staked_at: null, last_profit_claim: null } }
      );
      if (!res || Number(res.updated || 0) === 0) {
        // Another call already unlocked — return the wallet as it is now.
        const updated = await findOrCreateWallet(base44, user.id);
        return Response.json({
          balance: Number(updated.balance ?? 0),
          wager_remaining: Math.max(0, Number(updated.wager_remaining ?? 0)),
          staked_amount: Number(updated.staked_amount ?? 0) || 0,
          staked_at: updated.staked_at || null,
          last_profit_claim: updated.last_profit_claim || null,
          credited: 0,
        });
      }
      credited = total;
      balance += total;
      staked = 0;
      stakedAt = null;
      lastClaim = null;
    } else {
      return Response.json({ error: 'invalid-action' }, { status: 400 });
    }

    await mirrorToUser(base44, user.id, { staked_amount: staked, staked_at: stakedAt, last_profit_claim: lastClaim, wager_remaining: wager });

    return Response.json({
      balance,
      wager_remaining: wager,
      staked_amount: staked,
      staked_at: stakedAt,
      last_profit_claim: lastClaim,
      credited,
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}