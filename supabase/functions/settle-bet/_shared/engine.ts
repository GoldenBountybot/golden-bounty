
const MAX_WIN_MULT = 5000;
const FREE_SPIN_MAX_WIN = 5000;
export const MAX_WIN_PER_ROUND = 50000;
export const ROUND_TTL_MS = 60 * 60 * 1000;

export const GAME_REGISTRY = {
  'wild-bounty':      { settleMode: 'cap',   supportsFreeSpins: true },
  'fullhouse':        { settleMode: 'fixed', supportsFreeSpins: true },
  'gates-of-olympus': { settleMode: 'fixed', supportsFreeSpins: true },
  'big-brown':        { settleMode: 'cap',   supportsFreeSpins: true },
  'argonauts':        { settleMode: 'fixed', supportsFreeSpins: true },
  'crown-coins':      { settleMode: 'fixed', supportsFreeSpins: true },
  'plinko':           { settleMode: 'fixed', supportsFreeSpins: false },
  'mines':            { settleMode: 'cap',   supportsFreeSpins: false },
  'hi-lo':            { settleMode: 'cap',   supportsFreeSpins: false },
  'rocket-crash':     { settleMode: 'cap',   supportsFreeSpins: false },
  'thimbles':         { settleMode: 'cap',   supportsFreeSpins: false },
};

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

export function decideOutcome(rtp, betAmount, isFreeSpin, gameId) {
  const rtpFrac = Math.max(0, Math.min(1, rtp / 100));

  if (gameId === 'plinko') {
    const BUCKETS = [0.1, 2, 5, 10, 25, 50, 100];
    const WEIGHTS = [66.4, 25, 6, 2, 0.4, 0.5, 0.1];
    const totalW = WEIGHTS.reduce((a, b) => a + b, 0);
    let r2 = Math.random() * totalW;
    let mult = BUCKETS[0];
    for (let i = 0; i < BUCKETS.length; i++) {
      r2 -= WEIGHTS[i];
      if (r2 <= 0) { mult = BUCKETS[i]; break; }
    }
    const maxMult = isFreeSpin ? (FREE_SPIN_MAX_WIN / Math.max(betAmount, 0.01)) : MAX_WIN_MULT;
    mult = Math.min(mult, maxMult);
    let winAmount = mult * betAmount;
    if (isFreeSpin) winAmount = Math.min(winAmount, FREE_SPIN_MAX_WIN);
    winAmount = Math.round(winAmount * 100) / 100;
    return { isWin: mult > 1, winAmount, multiplier: mult };
  }

  if (gameId === 'thimbles') {
    const winChance = rtpFrac * 0.4;
    if (Math.random() >= winChance) return { isWin: false, winAmount: 0, multiplier: 0 };
    const mult = 3;
    let winAmount = mult * Math.max(betAmount, 0.01);
    if (isFreeSpin) winAmount = Math.min(winAmount, FREE_SPIN_MAX_WIN);
    winAmount = Math.round(winAmount * 100) / 100;
    return { isWin: true, winAmount, multiplier: mult };
  }

  if (gameId === 'big-brown') {
    const winChance = rtpFrac * 0.30;
    if (!(Math.random() < winChance)) return { isWin: false, winAmount: 0, multiplier: 0 };
    const cap = Math.min(betAmount * 5000, isFreeSpin ? FREE_SPIN_MAX_WIN : MAX_WIN_MULT * betAmount);
    const winAmount = Math.round(cap * 100) / 100;
    return { isWin: true, winAmount, multiplier: winAmount / Math.max(betAmount, 0.01) };
  }

  const winChanceMult = gameId === 'fullhouse' ? 0.24 : (gameId === 'wild-bounty' ? (isFreeSpin ? 0.27 : 0.31) : (gameId === 'gates-of-olympus' ? 0.22 : (gameId === 'argonauts' ? 0.07 : (gameId === 'big-brown' ? 0.19 : (gameId === 'thimbles' ? 0.75 : (gameId === 'hi-lo' ? 0.75 : (gameId === 'mines' ? 0.75 : 0.15)))))));
  const winChance = rtpFrac * winChanceMult;
  const isWin = Math.random() < winChance;
  if (!isWin) {
    if (gameId === 'hi-lo') {
      const cap = Math.round(Math.max(betAmount, 0.01) * 100) / 100;
      return { isWin: false, winAmount: cap, multiplier: 0 };
    }
    return { isWin: false, winAmount: 0, multiplier: 0 };
  }

  const r = Math.random();
  let multiplier;
  if (r < 0.85) multiplier = 1.5 + Math.random() * 2.5;
  else if (r < 0.96) multiplier = 4 + Math.random() * 16;
  else if (r < 0.995) multiplier = 20 + Math.random() * 80;
  else multiplier = 100 + Math.random() * 400;

  const maxMult = isFreeSpin ? (FREE_SPIN_MAX_WIN / Math.max(betAmount, 0.01)) : MAX_WIN_MULT;
  multiplier = Math.min(multiplier, maxMult);
  let winAmount = multiplier * betAmount;
  if (isFreeSpin) winAmount = Math.min(winAmount, FREE_SPIN_MAX_WIN);
  winAmount = Math.round(winAmount * 100) / 100;
  return { isWin: true, winAmount, multiplier };
}

export function svc() {
  return { url: Deno.env.get('SUPABASE_URL'), key: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') };
}

export async function authUser(req) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!jwt) return null;
  const { url, key } = svc();
  const res = await fetch(url + '/auth/v1/user', {
    headers: { apikey: key, Authorization: 'Bearer ' + jwt } });
  if (!res.ok) return null;
  return await res.json();
}

export async function rpc(name, args) {
  const { url, key } = svc();
  const res = await fetch(url + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(args) });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function sel(path) {
  const { url, key } = svc();
  const res = await fetch(url + '/rest/v1/' + path, {
    headers: { apikey: key, Authorization: 'Bearer ' + key } });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
