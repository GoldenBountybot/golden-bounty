const MAX_WIN_MULT = 5000;
const FREE_SPIN_MAX_WIN = 5000;
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  try {
    const user = await authUser(req);
    if (!user) return json({
      error: 'Unauthorized'
    }, 401);
    const body = await req.json().catch(()=>({}));
    const betAmount = Number(body.bet_amount ?? 0);
    const gameId = String(body.game_id || 'unknown');
    const requestedFreeSpin = !!body.is_free_spin;
    const thimblesTwoBall = body.thimbles_mode === 'two';
    const gameConfig = GAME_REGISTRY[gameId];
    if (!gameConfig) return json({
      error: 'invalid-game'
    }, 400);
    const settleMode = gameId === 'plinko' ? 'fixed' : gameConfig.settleMode;
    const isFreeSpin = requestedFreeSpin && gameConfig.supportsFreeSpins;
    if (!isFinite(betAmount) || betAmount < 0) return json({
      error: 'invalid-params'
    }, 400);
    let minBet = 0.01, maxBet = 500, gameRtp = 50;
    const settings = await sel('game_settings?select=*');
    const per = settings.find((r)=>r.game_id === gameId);
    const glob = settings.find((r)=>r.game_id === '*');
    const active = per && per.enabled !== false ? per : glob && glob.enabled !== false ? glob : null;
    if (active) {
      minBet = Number(active.min_bet ?? 0.01);
      maxBet = Number(active.max_bet ?? 500);
      gameRtp = Number(active.rtp ?? 50);
    }
    if (betAmount < minBet || betAmount > maxBet) {
      return json({
        error: 'bet-out-of-range',
        min: minBet,
        max: maxBet
      }, 400);
    }
    const wallets = await sel('wallets?user_id=eq.' + user.id + '&select=*');
    const wallet = wallets[0];
    if (!wallet) return json({
      error: 'no-wallet'
    }, 400);
    if (wallet.banned) return json({
      error: 'Account banned'
    }, 403);
    let rtp = gameRtp;
    if (wallet.rtp !== undefined && wallet.rtp !== null) {
      const userRtp = Number(wallet.rtp);
      if (!Number.isNaN(userRtp)) rtp = userRtp;
    }
    rtp = Math.max(0, Math.min(100, rtp));
    if (isFreeSpin) {
      // Legit bonus rounds award 8-24 free spins back to back, so the old
      // 15 / 25% limit rejected real free spins and their wins were never
      // credited. Relaxed limits still block sustained free-spin-only abuse.
      const c = await rpc('count_recent_free_spins', {
        p_user: user.id
      });
      const total = Number(c.total || 0), freeCount = Number(c.free || 0);
      if (freeCount >= 70 || total >= 40 && freeCount / total > 0.8) {
        return json({
          error: 'free-spin-rate-limit'
        }, 429);
      }
    }
    let outcome;
    if (settleMode === 'cap') {
      if (gameId === 'rocket-crash') {
        const cap = isFreeSpin ? FREE_SPIN_MAX_WIN : Math.min(betAmount * MAX_WIN_MULT, FREE_SPIN_MAX_WIN);
        outcome = {
          isWin: true,
          winAmount: cap,
          multiplier: MAX_WIN_MULT
        };
      } else {
        const dec = decideOutcome(rtp, betAmount, isFreeSpin, gameId, thimblesTwoBall);
        if (!dec.isWin) {
          outcome = {
            isWin: false,
            winAmount: 0,
            multiplier: 0
          };
        } else {
          const cap = isFreeSpin ? FREE_SPIN_MAX_WIN : Math.min(betAmount * MAX_WIN_MULT, FREE_SPIN_MAX_WIN);
          outcome = {
            isWin: true,
            winAmount: cap,
            multiplier: MAX_WIN_MULT
          };
        }
      }
    } else {
      outcome = decideOutcome(rtp, betAmount, isFreeSpin, gameId, thimblesTwoBall);
    }
    outcome.winAmount = Math.min(outcome.winAmount, MAX_WIN_PER_ROUND);
    const roundToken = crypto.randomUUID();
    const res = await rpc('place_bet_secure', {
      p_user: user.id,
      p_token: roundToken,
      p_game: gameId,
      p_bet: betAmount,
      p_win: outcome.winAmount,
      p_free: isFreeSpin,
      p_mode: settleMode,
      p_expires: new Date(Date.now() + ROUND_TTL_MS).toISOString()
    });
    if (!res.ok) return json({
      error: res.error,
      balance: res.balance
    }, 400);
    return json({
      round_token: roundToken,
      win_amount: outcome.winAmount,
      is_win: outcome.isWin,
      multiplier: outcome.multiplier,
      balance: res.balance,
      wager_remaining: res.wager_remaining
    });
  } catch (e) {
    return json({
      error: String(e?.message || e)
    }, 500);
  }
});
export const MAX_WIN_PER_ROUND = 50000;
export const ROUND_TTL_MS = 60 * 60 * 1000;
export const GAME_REGISTRY = {
  'wild-bounty': {
    settleMode: 'cap',
    supportsFreeSpins: true
  },
  'fullhouse': {
    settleMode: 'fixed',
    supportsFreeSpins: true
  },
  'gates-of-olympus': {
    settleMode: 'fixed',
    supportsFreeSpins: true
  },
  'big-brown': {
    settleMode: 'cap',
    supportsFreeSpins: true
  },
  'argonauts': {
    settleMode: 'fixed',
    supportsFreeSpins: true
  },
  'crown-coins': {
    settleMode: 'fixed',
    supportsFreeSpins: true
  },
  'plinko': {
    settleMode: 'fixed',
    supportsFreeSpins: false
  },
  'mines': {
    settleMode: 'cap',
    supportsFreeSpins: false
  },
  'hi-lo': {
    settleMode: 'cap',
    supportsFreeSpins: false
  },
  'rocket-crash': {
    settleMode: 'cap',
    supportsFreeSpins: false
  },
  'thimbles': {
    settleMode: 'cap',
    supportsFreeSpins: false
  }
};
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json'
    }
  });
}
export function decideOutcome(rtp, betAmount, isFreeSpin, gameId, twoBall = false) {
  const rtpFrac = Math.max(0, Math.min(1, rtp / 100));
  if (gameId === 'plinko') {
    const BUCKETS = [
      0.1,
      2,
      5,
      10,
      25,
      50,
      100
    ];
    const WEIGHTS = [
      66.4,
      25,
      6,
      2,
      0.4,
      0.5,
      0.1
    ];
    const totalW = WEIGHTS.reduce((a, b)=>a + b, 0);
    let r2 = Math.random() * totalW;
    let mult = BUCKETS[0];
    for(let i = 0; i < BUCKETS.length; i++){
      r2 -= WEIGHTS[i];
      if (r2 <= 0) {
        mult = BUCKETS[i];
        break;
      }
    }
    const maxMult = isFreeSpin ? FREE_SPIN_MAX_WIN / Math.max(betAmount, 0.01) : MAX_WIN_MULT;
    mult = Math.min(mult, maxMult);
    let winAmount = mult * betAmount;
    if (isFreeSpin) winAmount = Math.min(winAmount, FREE_SPIN_MAX_WIN);
    winAmount = Math.round(winAmount * 100) / 100;
    return {
      isWin: mult > 1,
      winAmount,
      multiplier: mult
    };
  }
  if (gameId === 'thimbles') {
    const winChance = rtpFrac * (twoBall ? 0.46 : 0.4);
    if (Math.random() >= winChance) return {
      isWin: false,
      winAmount: 0,
      multiplier: 0
    };
    const mult = 3;
    let winAmount = mult * Math.max(betAmount, 0.01);
    if (isFreeSpin) winAmount = Math.min(winAmount, FREE_SPIN_MAX_WIN);
    winAmount = Math.round(winAmount * 100) / 100;
    return {
      isWin: true,
      winAmount,
      multiplier: mult
    };
  }
  if (gameId === 'big-brown') {
    const winChance = rtpFrac * 0.30;
    if (!(Math.random() < winChance)) return {
      isWin: false,
      winAmount: 0,
      multiplier: 0
    };
    const cap = Math.min(betAmount * 5000, isFreeSpin ? FREE_SPIN_MAX_WIN : MAX_WIN_MULT * betAmount);
    const winAmount = Math.round(cap * 100) / 100;
    return {
      isWin: true,
      winAmount,
      multiplier: winAmount / Math.max(betAmount, 0.01)
    };
  }
  const winChanceMult = gameId === 'fullhouse' ? 0.24 : gameId === 'wild-bounty' ? isFreeSpin ? 0.27 : 0.31 : gameId === 'gates-of-olympus' ? 0.22 : gameId === 'argonauts' ? 0.07 : gameId === 'big-brown' ? 0.19 : gameId === 'thimbles' ? 0.75 : gameId === 'hi-lo' ? 0.95 : gameId === 'mines' ? 0.95 : 0.15;
  const winChance = rtpFrac * winChanceMult;
  const isWin = Math.random() < winChance;
  if (!isWin) {
    if (gameId === 'hi-lo') {
      const cap = Math.round(Math.max(betAmount, 0.01) * 100) / 100;
      return {
        isWin: false,
        winAmount: cap,
        multiplier: 0
      };
    }
    return {
      isWin: false,
      winAmount: 0,
      multiplier: 0
    };
  }
  const r = Math.random();
  let multiplier;
  if (r < 0.85) multiplier = 1.5 + Math.random() * 2.5;
  else if (r < 0.96) multiplier = 4 + Math.random() * 16;
  else if (r < 0.995) multiplier = 20 + Math.random() * 80;
  else multiplier = 100 + Math.random() * 400;
  const maxMult = isFreeSpin ? FREE_SPIN_MAX_WIN / Math.max(betAmount, 0.01) : MAX_WIN_MULT;
  multiplier = Math.min(multiplier, maxMult);
  let winAmount = multiplier * betAmount;
  if (isFreeSpin) winAmount = Math.min(winAmount, FREE_SPIN_MAX_WIN);
  winAmount = Math.round(winAmount * 100) / 100;
  return {
    isWin: true,
    winAmount,
    multiplier
  };
}
export function svc() {
  return {
    url: Deno.env.get('SUPABASE_URL'),
    key: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  };
}
export async function authUser(req) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  if (!jwt) return null;
  const { url, key } = svc();
  const res = await fetch(url + '/auth/v1/user', {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + jwt
    }
  });
  if (!res.ok) return null;
  return await res.json();
}
export async function rpc(name, args) {
  const { url, key } = svc();
  const res = await fetch(url + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
export async function sel(path) {
  const { url, key } = svc();
  const res = await fetch(url + '/rest/v1/' + path, {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}