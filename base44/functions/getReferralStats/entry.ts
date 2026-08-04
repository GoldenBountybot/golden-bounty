import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Referral tracking + global ranking for the Profile page.
// Returns the current user's referrals (with per-referral deposits & commission),
// the user's own rank, and the top-50 referrers by referral count.
const COMMISSION_RATE = 0.05;
const PAGE = 500;
const RANK_SCAN_CAP = 20000; // safety cap on how many users we scan for the ranking

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const sr = base44.asServiceRole;

    // 1. Fetch every user referred by the current user.
    const referrals = [];
    let skip = 0;
    while (referrals.length < 5000) {
      const batch = await sr.entities.User.filter({ referred_by: user.id }, '-created_date', PAGE, skip);
      if (!batch.length) break;
      referrals.push(...batch);
      if (batch.length < PAGE) break;
      skip += PAGE;
    }

    // 2. For each referral, sum their approved/completed deposits to compute
    //    the commission earned from that specific referral.
    const referralStats = [];
    for (const r of referrals) {
      let totalDep = 0;
      let depSkip = 0;
      while (true) {
        const txs = await sr.entities.Transaction.filter({ user_id: r.id, type: 'deposit' }, '-created_date', PAGE, depSkip);
        if (!txs.length) break;
        for (const tx of txs) {
          if (tx.status === 'approved' || tx.status === 'completed') totalDep += Number(tx.amount) || 0;
        }
        if (txs.length < PAGE) break;
        depSkip += PAGE;
      }
      referralStats.push({
        id: r.id,
        username: r.username || r.full_name || 'Player',
        uid: r.uid || '',
        email: r.email || '',
        joinedAt: r.created_date,
        totalDeposits: Math.round(totalDep * 100) / 100,
        commission: Math.round(totalDep * COMMISSION_RATE * 100) / 100,
      });
    }

    // 3. Global ranking by referral count — scan all users (capped) and count
    //    how many have each user as their referrer.
    const countMap = new Map();
    let rankSkip = 0;
    let scanned = 0;
    while (scanned < RANK_SCAN_CAP) {
      const batch = await sr.entities.User.list('-created_date', PAGE, rankSkip);
      if (!batch.length) break;
      for (const u of batch) {
        if (u.referred_by) {
          countMap.set(u.referred_by, (countMap.get(u.referred_by) || 0) + 1);
        }
      }
      scanned += batch.length;
      if (batch.length < PAGE) break;
      rankSkip += PAGE;
    }

    const ranking = [];
    for (const [rid, cnt] of countMap.entries()) ranking.push({ referrerId: rid, count: cnt });
    ranking.sort((a, b) => b.count - a.count);

    const top = ranking.slice(0, 50);
    // Enrich the top referrers + the current user with display info.
    const idsToFetch = new Set(top.map(x => x.referrerId));
    idsToFetch.add(user.id);
    const enrichMap = new Map();
    for (const rid of idsToFetch) {
      try {
        const u = await sr.entities.User.get(rid);
        enrichMap.set(rid, {
          id: u.id,
          username: u.username || u.full_name || 'Player',
          uid: u.uid || '',
          count: countMap.get(rid) || 0,
          earnings: Math.round((Number(u.referral_earnings) || 0) * 100) / 100,
        });
      } catch { /* ignore missing */ }
    }
    const topRanking = top.map(x => enrichMap.get(x.referrerId)).filter(Boolean);

    const myCount = countMap.get(user.id) || 0;
    const myRankIndex = ranking.findIndex(x => x.referrerId === user.id);
    const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;

    return Response.json({
      referrals: referralStats,
      totalReferrals: referralStats.length,
      totalCommission: Math.round(referralStats.reduce((s, r) => s + r.commission, 0) * 100) / 100,
      ranking: topRanking,
      myRank,
      myCount,
      totalReferrers: ranking.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}