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

    if (action === 'stake') {
      const amount = Number(body.amount ?? 0);
      if (!isFinite(amount) || amount <= 0) {
        return Response.json({ error: 'invalid-amount' }, { status: 400 });
      }
      if (amount > balance) {
        return Response.json({ error: 'insufficient-balance' }, { status: 400 });
      }
      balance -= amount;
      staked += amount;
      const now = new Date().toISOString();
      stakedAt = now;
      lastClaim = now;
    } else if (action === 'claimProfit') {
      const profit = computeProfit(staked, stakedAt, lastClaim, rate);
      if (profit <= 0) {
        return Response.json({ error: 'no-profit' }, { status: 400 });
      }
      balance += profit;
      credited = profit;
      lastClaim = new Date().toISOString();
    } else if (action === 'autoUnlock') {
      if (!staked || !stakedAt) {
        return Response.json({ error: 'nothing-staked' }, { status: 400 });
      }
      const elapsed = (Date.now() - new Date(stakedAt).getTime()) / DAY;
      if (elapsed < LOCK_DAYS) {
        return Response.json({ error: 'still-locked' }, { status: 400 });
      }
      const profit = computeProfit(staked, stakedAt, lastClaim, rate);
      balance += staked + profit;
      credited = staked + profit;
      staked = 0;
      stakedAt = null;
      lastClaim = null;
    } else {
      return Response.json({ error: 'invalid-action' }, { status: 400 });
    }

    const update = {
      balance,
      staked_amount: staked,
      staked_at: stakedAt,
      last_profit_claim: lastClaim,
    };
    await base44.asServiceRole.entities.Wallet.update(wallet.id, update);
    await mirrorToUser(base44, user.id, { ...update, wager_remaining: wager });

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