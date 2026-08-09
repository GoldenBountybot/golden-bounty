import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Aggregates a user's income sources and gaming behavior so the admin can
// assess withdrawal risk: where the balance came from, and whether gameplay
// shows suspicious patterns that may indicate hacking tools / scripts.
//
// Admin-only. Returns:
//   income: { deposits, referral, bonuses, adjustments, gameWins, total }
//   gaming: { rounds, totalBet, totalWin, netProfit, winRate, avgBet, maxBet,
//            avgMultiplier, maxMultiplier, biggestWin, gamesPlayed }
//   flags:  [{ level, label, detail }]
//   riskScore: number 0-100
//   summary: string

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const targetId = String(body.user_id || '');
    if (!targetId) return Response.json({ error: 'user_id required' }, { status: 400 });

    const admin = base44.asServiceRole;

    // ── Income sources (Transaction entity) ──
    const txs = await admin.entities.Transaction.filter({ user_id: targetId }, '-created_date', 500);
    const approvedDeposits = txs
      .filter(t => t.type === 'deposit' && (t.status === 'approved' || t.status === 'completed'))
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const referralIncome = txs
      .filter(t => t.type === 'bonus' && t.method === 'referral-commission')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const otherBonuses = txs
      .filter(t => t.type === 'bonus' && t.method !== 'referral-commission')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const adjustments = txs
      .filter(t => t.type === 'adjustment')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    // ── Gaming behavior (PlayerActivity entity) ──
    const activity = await admin.entities.PlayerActivity.filter({ user_id: targetId }, '-created_date', 1000);

    const rounds = activity.length;
    const totalBet = activity.reduce((s, a) => s + (Number(a.bet) || 0), 0);
    const totalWin = activity.reduce((s, a) => s + (Number(a.win) || 0), 0);
    const wins = activity.filter(a => a.outcome === 'win').length;
    const losses = activity.filter(a => a.outcome === 'loss').length;
    const winRate = rounds > 0 ? (wins / rounds) * 100 : 0;
    const avgBet = rounds > 0 ? totalBet / rounds : 0;
    const maxBet = activity.reduce((m, a) => Math.max(m, Number(a.bet) || 0), 0);
    const multipliers = activity.map(a => Number(a.multiplier) || 0).filter(m => m > 0);
    const avgMultiplier = multipliers.length > 0
      ? multipliers.reduce((s, m) => s + m, 0) / multipliers.length
      : 0;
    const maxMultiplier = multipliers.reduce((m, x) => Math.max(m, x), 0);
    const biggestWin = activity.reduce((m, a) => Math.max(m, Number(a.win) || 0), 0);
    const netProfit = totalWin - totalBet;

    // Per-game breakdown
    const perGame: Record<string, { rounds: number; bet: number; win: number; wins: number }> = {};
    for (const a of activity) {
      const g = a.game_id || 'unknown';
      if (!perGame[g]) perGame[g] = { rounds: 0, bet: 0, win: 0, wins: 0 };
      perGame[g].rounds++;
      perGame[g].bet += Number(a.bet) || 0;
      perGame[g].win += Number(a.win) || 0;
      if (a.outcome === 'win') perGame[g].wins++;
    }
    const gamesPlayed = Object.keys(perGame).map(g => ({
      game: g,
      rounds: perGame[g].rounds,
      bet: +perGame[g].bet.toFixed(2),
      win: +perGame[g].win.toFixed(2),
      net: +(perGame[g].win - perGame[g].bet).toFixed(2),
      winRate: perGame[g].rounds > 0 ? +((perGame[g].wins / perGame[g].rounds) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.bet - a.bet);

    // ── Risk flags ──
    const flags: { level: 'low' | 'medium' | 'high'; label: string; detail: string }[] = [];

    // 1. Abnormally high win rate with meaningful volume
    if (rounds >= 20 && winRate >= 75) {
      flags.push({
        level: 'high',
        label: 'Abnormally high win rate',
        detail: `${winRate.toFixed(1)}% win rate over ${rounds} rounds — statistically improbable for fair play.`,
      });
    } else if (rounds >= 10 && winRate >= 65) {
      flags.push({
        level: 'medium',
        label: 'Elevated win rate',
        detail: `${winRate.toFixed(1)}% win rate over ${rounds} rounds — above expected house edge.`,
      });
    }

    // 2. Very high average multiplier
    if (avgMultiplier >= 10) {
      flags.push({
        level: 'high',
        label: 'Unrealistic average multiplier',
        detail: `Average cashout multiplier ${avgMultiplier.toFixed(2)}x across ${multipliers.length} multiplier rounds.`,
      });
    } else if (avgMultiplier >= 5) {
      flags.push({
        level: 'medium',
        label: 'High average multiplier',
        detail: `Average multiplier ${avgMultiplier.toFixed(2)}x — review for scripted timing.`,
      });
    }

    // 3. Max multiplier extremely high (possible crash exploit)
    if (maxMultiplier >= 50) {
      flags.push({
        level: 'high',
        label: 'Extreme max multiplier',
        detail: `Max multiplier ${maxMultiplier.toFixed(2)}x detected — possible crash-game exploit.`,
      });
    }

    // 4. Net profit heavily skewed vs deposits (balance mostly from wins, not deposits)
    if (approvedDeposits > 0 && netProfit > 0) {
      const profitRatio = netProfit / approvedDeposits;
      if (profitRatio >= 5) {
        flags.push({
          level: 'high',
          label: 'Profit far exceeds deposits',
          detail: `Net profit $${netProfit.toFixed(2)} vs $${approvedDeposits.toFixed(2)} deposited (${profitRatio.toFixed(1)}x). Possible exploit.`,
        });
      } else if (profitRatio >= 2) {
        flags.push({
          level: 'medium',
          label: 'Profit significantly exceeds deposits',
          detail: `Net profit $${netProfit.toFixed(2)} vs $${approvedDeposits.toFixed(2)} deposited (${profitRatio.toFixed(1)}x).`,
        });
      }
    }

    // 5. No deposits but large balance / withdrawal
    if (approvedDeposits === 0 && totalWin > 0) {
      flags.push({
        level: 'high',
        label: 'Winnings with zero deposits',
        detail: `User has $${totalWin.toFixed(2)} in wins but no approved deposits — funds may be illegitimate.`,
      });
    }

    // 5b. Withdrawal requests with ZERO deposits (the exact exploit the user
    // reported: no deposit, no gameplay, yet multiple withdrawals submitted).
    const withdrawReqs = txs.filter(t => t.type === 'withdraw');
    const totalWithdrawn = withdrawReqs.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const pendingWithdrawals = withdrawReqs.filter(t => t.status === 'pending').length;

    if (approvedDeposits === 0 && withdrawReqs.length > 0) {
      flags.push({
        level: 'high',
        label: 'Withdrawals with zero deposits',
        detail: `User submitted ${withdrawReqs.length} withdrawal request(s) totaling $${totalWithdrawn.toFixed(2)} but has never deposited — possible balance exploit.`,
      });
    }

    // 5c. Total withdrawals exceed total deposits (draining more than funded)
    if (approvedDeposits > 0 && totalWithdrawn > approvedDeposits) {
      const ratio = totalWithdrawn / approvedDeposits;
      flags.push({
        level: 'high',
        label: 'Withdrawals exceed deposits',
        detail: `Total withdrawals $${totalWithdrawn.toFixed(2)} exceed deposits $${approvedDeposits.toFixed(2)} (${ratio.toFixed(1)}x) — investigate source of funds.`,
      });
    }

    // 5d. Multiple pending withdrawals (spam / attempt to bypass review)
    if (pendingWithdrawals >= 3) {
      flags.push({
        level: 'medium',
        label: 'Multiple pending withdrawals',
        detail: `${pendingWithdrawals} withdrawal requests awaiting approval — review for abuse.`,
      });
    }

    // 6. Very few rounds but large withdrawal (low activity, high value)
    if (rounds > 0 && rounds < 5 && totalWin >= 50) {
      flags.push({
        level: 'medium',
        label: 'Low activity, high value',
        detail: `Only ${rounds} rounds played but $${totalWin.toFixed(2)} won — review for scripted wins.`,
      });
    }

    // 7. Consistent max-bet wins (always betting max and winning)
    if (rounds >= 10) {
      const maxBetRounds = activity.filter(a => (Number(a.bet) || 0) >= maxBet * 0.95 && maxBet > 0);
      const maxBetWinRate = maxBetRounds.length > 0
        ? (maxBetRounds.filter(a => a.outcome === 'win').length / maxBetRounds.length) * 100
        : 0;
      if (maxBetRounds.length >= 5 && maxBetWinRate >= 70) {
        flags.push({
          level: 'high',
          label: 'Scripted max-bet pattern',
          detail: `${maxBetWinRate.toFixed(0)}% win rate on max-bet rounds (${maxBetRounds.length} rounds) — possible automated betting.`,
        });
      }
    }

    // 8. Rapid-fire rounds (suspiciously fast play)
    if (rounds >= 20) {
      const sorted = [...activity].sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
      const spans: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const dt = new Date(sorted[i].created_date).getTime() - new Date(sorted[i - 1].created_date).getTime();
        if (dt > 0) spans.push(dt);
      }
      if (spans.length >= 5) {
        const avgGap = spans.reduce((s, x) => s + x, 0) / spans.length;
        if (avgGap < 1500) {
          flags.push({
            level: 'medium',
            label: 'Rapid-fire gameplay',
            detail: `Average ${avgGap.toFixed(0)}ms between rounds — faster than humanly possible for some games.`,
          });
        }
      }
    }

    // ── Risk score ──
    let riskScore = 0;
    for (const f of flags) {
      if (f.level === 'high') riskScore += 35;
      else if (f.level === 'medium') riskScore += 18;
      else riskScore += 6;
    }
    riskScore = Math.min(100, riskScore);

    let summary: string;
    if (riskScore >= 60) summary = 'High risk — recommend manual review before approval.';
    else if (riskScore >= 30) summary = 'Medium risk — verify player activity before approving.';
    else summary = 'Low risk — gameplay appears normal.';

    return Response.json({
      income: {
        deposits: +approvedDeposits.toFixed(2),
        referral: +referralIncome.toFixed(2),
        bonuses: +otherBonuses.toFixed(2),
        adjustments: +adjustments.toFixed(2),
        gameWins: +totalWin.toFixed(2),
        total: +(approvedDeposits + referralIncome + otherBonuses + adjustments).toFixed(2),
      },
      gaming: {
        rounds,
        totalBet: +totalBet.toFixed(2),
        totalWin: +totalWin.toFixed(2),
        netProfit: +netProfit.toFixed(2),
        winRate: +winRate.toFixed(1),
        wins,
        losses,
        avgBet: +avgBet.toFixed(2),
        maxBet: +maxBet.toFixed(2),
        avgMultiplier: +avgMultiplier.toFixed(2),
        maxMultiplier: +maxMultiplier.toFixed(2),
        biggestWin: +biggestWin.toFixed(2),
        gamesPlayed,
      },
      flags,
      riskScore,
      summary,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}