import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!jwt) return json({ error: 'Unauthorized' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
    const { data: authData } = await anon.auth.getUser(jwt);
    const user = authData?.user;
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const svc = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data: adminProfile } = await svc.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (adminProfile?.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    const body = await req.json().catch(() => ({}));
    const targetId = String(body.user_id || '');
    if (!targetId) return json({ error: 'user_id required' }, 400);

    const [{ data: txs, error: txError }, { data: activity, error: activityError }] = await Promise.all([
      svc.from('transactions').select('*').eq('user_id', targetId).order('created_at', { ascending: false }).limit(500),
      svc.from('player_activity').select('*').eq('user_id', targetId).order('created_at', { ascending: false }).limit(1000),
    ]);
    if (txError) throw txError;
    if (activityError) throw activityError;
    const transactions = txs || [];
    const roundsData = activity || [];

    const approvedDeposits = transactions.filter(t => t.type === 'deposit' && (t.status === 'approved' || t.status === 'completed')).reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const referralIncome = transactions.filter(t => t.type === 'bonus' && t.method === 'referral-commission').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const otherBonuses = transactions.filter(t => t.type === 'bonus' && t.method !== 'referral-commission').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const adjustments = transactions.filter(t => t.type === 'adjustment').reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const rounds = roundsData.length;
    const totalBet = roundsData.reduce((s, a) => s + (Number(a.bet) || 0), 0);
    const totalWin = roundsData.reduce((s, a) => s + (Number(a.win) || 0), 0);
    const wins = roundsData.filter(a => a.outcome === 'win').length;
    const losses = roundsData.filter(a => a.outcome === 'loss').length;
    const winRate = rounds > 0 ? (wins / rounds) * 100 : 0;
    const avgBet = rounds > 0 ? totalBet / rounds : 0;
    const maxBet = roundsData.reduce((m, a) => Math.max(m, Number(a.bet) || 0), 0);
    const multipliers = roundsData.map(a => Number(a.multiplier) || 0).filter(m => m > 0);
    const avgMultiplier = multipliers.length > 0 ? multipliers.reduce((s, m) => s + m, 0) / multipliers.length : 0;
    const maxMultiplier = multipliers.reduce((m, x) => Math.max(m, x), 0);
    const biggestWin = roundsData.reduce((m, a) => Math.max(m, Number(a.win) || 0), 0);
    const netProfit = totalWin - totalBet;

    const perGame: Record<string, { rounds: number; bet: number; win: number; wins: number }> = {};
    for (const a of roundsData) {
      const game = a.game_id || 'unknown';
      if (!perGame[game]) perGame[game] = { rounds: 0, bet: 0, win: 0, wins: 0 };
      perGame[game].rounds++;
      perGame[game].bet += Number(a.bet) || 0;
      perGame[game].win += Number(a.win) || 0;
      if (a.outcome === 'win') perGame[game].wins++;
    }
    const gamesPlayed = Object.keys(perGame).map(game => ({
      game,
      rounds: perGame[game].rounds,
      bet: +perGame[game].bet.toFixed(2),
      win: +perGame[game].win.toFixed(2),
      net: +(perGame[game].win - perGame[game].bet).toFixed(2),
      winRate: perGame[game].rounds > 0 ? +((perGame[game].wins / perGame[game].rounds) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.bet - a.bet);

    const flags: { level: 'low' | 'medium' | 'high'; label: string; detail: string }[] = [];
    if (rounds >= 20 && winRate >= 75) flags.push({ level: 'high', label: 'Abnormally high win rate', detail: `${winRate.toFixed(1)}% win rate over ${rounds} rounds — statistically improbable for fair play.` });
    else if (rounds >= 10 && winRate >= 65) flags.push({ level: 'medium', label: 'Elevated win rate', detail: `${winRate.toFixed(1)}% win rate over ${rounds} rounds — above expected house edge.` });

    if (avgMultiplier >= 10) flags.push({ level: 'high', label: 'Unrealistic average multiplier', detail: `Average cashout multiplier ${avgMultiplier.toFixed(2)}x across ${multipliers.length} multiplier rounds.` });
    else if (avgMultiplier >= 5) flags.push({ level: 'medium', label: 'High average multiplier', detail: `Average multiplier ${avgMultiplier.toFixed(2)}x — review for scripted timing.` });
    if (maxMultiplier >= 50) flags.push({ level: 'high', label: 'Extreme max multiplier', detail: `Max multiplier ${maxMultiplier.toFixed(2)}x detected — possible crash-game exploit.` });

    if (approvedDeposits > 0 && netProfit > 0) {
      const ratio = netProfit / approvedDeposits;
      if (ratio >= 5) flags.push({ level: 'high', label: 'Profit far exceeds deposits', detail: `Net profit $${netProfit.toFixed(2)} vs $${approvedDeposits.toFixed(2)} deposited (${ratio.toFixed(1)}x). Possible exploit.` });
      else if (ratio >= 2) flags.push({ level: 'medium', label: 'Profit significantly exceeds deposits', detail: `Net profit $${netProfit.toFixed(2)} vs $${approvedDeposits.toFixed(2)} deposited (${ratio.toFixed(1)}x).` });
    }
    if (approvedDeposits === 0 && totalWin > 0) flags.push({ level: 'high', label: 'Winnings with zero deposits', detail: `User has $${totalWin.toFixed(2)} in wins but no approved deposits — funds may be illegitimate.` });

    const withdrawReqs = transactions.filter(t => t.type === 'withdraw');
    const totalWithdrawn = withdrawReqs.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const pendingWithdrawals = withdrawReqs.filter(t => t.status === 'pending').length;
    if (approvedDeposits === 0 && withdrawReqs.length > 0) flags.push({ level: 'high', label: 'Withdrawals with zero deposits', detail: `User submitted ${withdrawReqs.length} withdrawal request(s) totaling $${totalWithdrawn.toFixed(2)} but has never deposited — possible balance exploit.` });
    if (approvedDeposits > 0 && totalWithdrawn > approvedDeposits) flags.push({ level: 'high', label: 'Withdrawals exceed deposits', detail: `Total withdrawals $${totalWithdrawn.toFixed(2)} exceed deposits $${approvedDeposits.toFixed(2)} (${(totalWithdrawn / approvedDeposits).toFixed(1)}x) — investigate source of funds.` });
    if (pendingWithdrawals >= 3) flags.push({ level: 'medium', label: 'Multiple pending withdrawals', detail: `${pendingWithdrawals} withdrawal requests awaiting approval — review for abuse.` });
    if (rounds > 0 && rounds < 5 && totalWin >= 50) flags.push({ level: 'medium', label: 'Low activity, high value', detail: `Only ${rounds} rounds played but $${totalWin.toFixed(2)} won — review for scripted wins.` });

    if (rounds >= 10) {
      const maxBetRounds = roundsData.filter(a => (Number(a.bet) || 0) >= maxBet * 0.95 && maxBet > 0);
      const maxBetWinRate = maxBetRounds.length > 0 ? (maxBetRounds.filter(a => a.outcome === 'win').length / maxBetRounds.length) * 100 : 0;
      if (maxBetRounds.length >= 5 && maxBetWinRate >= 70) flags.push({ level: 'high', label: 'Scripted max-bet pattern', detail: `${maxBetWinRate.toFixed(0)}% win rate on max-bet rounds (${maxBetRounds.length} rounds) — possible automated betting.` });
    }
    if (rounds >= 20) {
      const sorted = [...roundsData].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const spans: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const gap = new Date(sorted[i].created_at).getTime() - new Date(sorted[i - 1].created_at).getTime();
        if (gap > 0) spans.push(gap);
      }
      if (spans.length >= 5) {
        const avgGap = spans.reduce((s, value) => s + value, 0) / spans.length;
        if (avgGap < 1500) flags.push({ level: 'medium', label: 'Rapid-fire gameplay', detail: `Average ${avgGap.toFixed(0)}ms between rounds — faster than humanly possible for some games.` });
      }
    }

    let riskScore = Math.min(100, flags.reduce((score, flag) => score + (flag.level === 'high' ? 35 : flag.level === 'medium' ? 18 : 6), 0));
    const summary = riskScore >= 60 ? 'High risk — recommend manual review before approval.' : riskScore >= 30 ? 'Medium risk — verify player activity before approving.' : 'Low risk — gameplay appears normal.';

    return json({
      income: { deposits: +approvedDeposits.toFixed(2), referral: +referralIncome.toFixed(2), bonuses: +otherBonuses.toFixed(2), adjustments: +adjustments.toFixed(2), gameWins: +totalWin.toFixed(2), total: +(approvedDeposits + referralIncome + otherBonuses + adjustments).toFixed(2) },
      gaming: { rounds, totalBet: +totalBet.toFixed(2), totalWin: +totalWin.toFixed(2), netProfit: +netProfit.toFixed(2), winRate: +winRate.toFixed(1), wins, losses, avgBet: +avgBet.toFixed(2), maxBet: +maxBet.toFixed(2), avgMultiplier: +avgMultiplier.toFixed(2), maxMultiplier: +maxMultiplier.toFixed(2), biggestWin: +biggestWin.toFixed(2), gamesPlayed },
      flags, riskScore, summary,
    });
  } catch (error) {
    return json({ error: String((error as Error)?.message || error) }, 500);
  }
});