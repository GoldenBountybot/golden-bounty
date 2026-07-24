// Big Brown — 6x4 · 4096 WAYS forest-wildlife slot.
// Paytable & mechanics per Endorphina's publicly documented rules.
// Base-symbol pays are per-way × (bet/20). Scatter pays total-bet × multiplier.

export const REEL_ROWS = [4, 4, 4, 4, 4, 4];
export const WAYS = 4096;
export const BETS = [0.50, 1.00, 2.00, 5.00, 12.50];

// Reels where wilds may land (0-indexed): reels 1,2,3,4,5 → indices 0,1,2,3,4.
export const WILD_REELS = new Set([0, 1, 2, 3, 4]);

// Full-height (4-cell) wild graphic shown when a wild reel expands.
// Bear-only image (black bg, dropped via mix-blend-mode:screen). The WILD
// label is rendered as an HTML gold plaque so it's always legible.
export const WILD_EXPAND_IMG =
  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/42a9ab939_generated_image.png';

// Symbol image URLs (generated to match reference screenshots).
const IMG = {
  scatter: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/98a234d10_generated_image.png',
  brown:   'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/31ddcdcb0_generated_image.png',
  spirit:  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/31ddcdcb0_generated_image.png',
  buffalo: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d5e8a8396_generated_image.png',
  eagle:   'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/7d8561976_generated_image.png',
  cougar:  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/678cbc6de_generated_image.png',
  wolf:    'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d03f81032_generated_image.png',
  deer:    'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/75af4c854_generated_image.png',
  A: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/b7e1c393e_generated_image.png',
  K: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/0563064f0_generated_image.png',
  Q: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/11e4aee1c_generated_image.png',
  J: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/aa1e47a19_generated_image.png',
  '10': 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9765e60dc_generated_image.png',
  '9':  'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e5f443649_generated_image.png',
};

// Pay values are multipliers of betUnit (= bet / 20).
// Derived from the reference paytable at €0.50 bet (betUnit = 0.025):
//   payout = pay × ways × betUnit  (base symbols)
//   payout = pay × bet             (scatter — total bet, not per-way)
export const SYMBOLS = {
  scatter: { id: 'scatter', label: 'BONUS', type: 'scatter', img: IMG.scatter, pay: { 3: 1, 4: 5, 5: 25, 6: 50 } },
  spirit:  { id: 'spirit',  label: 'RAGING BEAR', type: 'spirit', img: IMG.spirit, pay: { 3: 20, 4: 30, 5: 40, 6: 50 }, mult: 2 },
  brown:   { id: 'brown',   label: 'WILD', type: 'wild', img: IMG.brown, pay: { 3: 20, 4: 30, 5: 40, 6: 50 } },
  buffalo: { id: 'buffalo', label: 'BUFFALO', type: 'high', img: IMG.buffalo, pay: { 3: 30, 4: 40, 5: 50, 6: 60 } },
  eagle:   { id: 'eagle',   label: 'EAGLE', type: 'high', img: IMG.eagle, pay: { 3: 20, 4: 30, 5: 40, 6: 50 } },
  cougar:  { id: 'cougar',  label: 'COUGAR', type: 'high', img: IMG.cougar, pay: { 3: 20, 4: 30, 5: 40, 6: 50 } },
  wolf:    { id: 'wolf',    label: 'WOLF', type: 'high', img: IMG.wolf, pay: { 3: 12, 4: 20, 5: 30, 6: 40 } },
  deer:    { id: 'deer',    label: 'DEER', type: 'mid', img: IMG.deer, pay: { 3: 12, 4: 20, 5: 30, 6: 40 } },
  A: { id: 'A', label: 'A', type: 'low', img: IMG.A, pay: { 3: 10, 4: 12, 5: 20, 6: 30 } },
  K: { id: 'K', label: 'K', type: 'low', img: IMG.K, pay: { 3: 10, 4: 12, 5: 20, 6: 30 } },
  Q: { id: 'Q', label: 'Q', type: 'low', img: IMG.Q, pay: { 3: 8, 4: 10, 5: 12, 6: 20 } },
  J: { id: 'J', label: 'J', type: 'low', img: IMG.J, pay: { 3: 8, 4: 10, 5: 12, 6: 20 } },
  '10': { id: '10', label: '10', type: 'low', img: IMG['10'], pay: { 3: 6, 4: 8, 5: 10, 6: 12 } },
  '9':  { id: '9',  label: '9',  type: 'low', img: IMG['9'],  pay: { 3: 6, 4: 8, 5: 10, 6: 12 } },
};

export function getSymbolImg(id) {
  return (SYMBOLS[id] && SYMBOLS[id].img) || null;
}

// Weighted pool for non-wild reels. Scatter is rare; lows are common.
const BASE_POOL = [
  'buffalo', 'buffalo',
  'eagle', 'eagle', 'eagle',
  'cougar', 'cougar', 'cougar',
  'wolf', 'wolf', 'wolf', 'wolf',
  'deer', 'deer', 'deer', 'deer', 'deer',
  'A', 'A', 'A', 'A', 'A', 'A', 'A',
  'K', 'K', 'K', 'K', 'K', 'K', 'K',
  'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q',
  'J', 'J', 'J', 'J', 'J', 'J', 'J', 'J',
  '10', '10', '10', '10', '10', '10', '10', '10',
  '9', '9', '9', '9', '9', '9', '9', '9', '9', '9',
];

// Wild reels use the base pool plus a reel-specific chance to inject a wild
// (brown/spirit). The 1st column (reel 0) takes the chance removed from the
// 3rd column (reel 2). At most one wild is kept per spin via capWildsToOne.
const WILD_CHANCE = { 0: 0.004, 1: 0.002, 2: 0.004, 3: 0.06, 4: 0.06 };

export function randomSymbol(reelIndex = -1) {
  if (!WILD_REELS.has(reelIndex)) {
    return BASE_POOL[Math.floor(Math.random() * BASE_POOL.length)];
  }
  const chance = WILD_CHANCE[reelIndex] || 0.03;
  if (Math.random() < chance) {
    return Math.random() < 0.18 ? 'spirit' : 'brown';
  }
  // Otherwise draw a non-wild symbol (scatter allowed on wild reels).
  const pool = BASE_POOL.concat(['scatter']);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function buildReel(rows, reelIndex) {
  return Array.from({ length: rows }, () => randomSymbol(reelIndex));
}

export function buildGrid() {
  const grid = REEL_ROWS.map((r, i) => buildReel(r, i));
  return capWildsToOne(grid);
}

// Replace every wild (brown/spirit) with a random base symbol (no wild/scatter).
export function clearWilds(grid) {
  return grid.map(reel => reel.map(s => (s === 'brown' || s === 'spirit') ? randomSymbol(-1) : s));
}

// Enforce at most one wild symbol across the whole grid: keeps the first wild
// found (scanning reels left→right, rows top→bottom) and replaces any extra
// wilds with random base symbols. This guarantees any single pay way contains
// no more than one wild.
export function capWildsToOne(grid) {
  const wilds = [];
  grid.forEach((reel, ri) => reel.forEach((s, row) => {
    if (s === 'brown' || s === 'spirit') wilds.push([ri, row]);
  }));
  if (wilds.length <= 1) return grid;
  const out = grid.map(r => [...r]);
  for (let i = 1; i < wilds.length; i++) {
    const [ri, row] = wilds[i];
    out[ri][row] = randomSymbol(-1);
  }
  return out;
}

// Expand wilds: on reels 1-4, any brown/spirit wild fills the whole reel.
// Spirit (Raging Bear) takes priority if both appear (they can't share a reel by design).
export function expandWilds(grid) {
  return grid.map((reel, ri) => {
    if (!WILD_REELS.has(ri)) return reel;
    const spirit = reel.includes('spirit');
    const brown = reel.includes('brown');
    if (spirit) return Array(reel.length).fill('spirit');
    if (brown) return Array(reel.length).fill('brown');
    return reel;
  });
}

// Ways-to-win evaluation. Wild (brown/spirit) substitutes for all base symbols.
// Spirit (Raging Bear) wild reels multiply a win by 2 each (multiplicatively).
// Scatter pays total-bet × multiplier (not per-way).
export function evaluateWins(grid, bet) {
  const betUnit = bet / 20;
  const wins = [];
  const baseSymbols = Object.values(SYMBOLS).filter(s => s.type !== 'scatter' && s.type !== 'wild' && s.type !== 'spirit');

  for (const sym of baseSymbols) {
    let reels = 0;
    const countsPerReel = [];
    const spiritReelsUsed = [];
    for (let r = 0; r < 6; r++) {
      const reel = grid[r];
      let count = 0;
      let hasSpirit = false;
      for (const s of reel) {
        if (s === sym.id || s === 'brown' || s === 'spirit') {
          count++;
          if (s === 'spirit') hasSpirit = true;
        }
      }
      if (count > 0) {
        reels++;
        countsPerReel.push(count);
        if (hasSpirit) spiritReelsUsed.push(r);
      } else {
        break;
      }
    }
    if (reels >= 3) {
      const ways = countsPerReel.reduce((a, b) => a * b, 1);
      const spiritMult = spiritReelsUsed.length ? Math.pow(2, spiritReelsUsed.length) : 1;
      const pay = (SYMBOLS[sym.id].pay[reels] || 0) * ways * betUnit * spiritMult;
      if (pay > 0) wins.push({ symbol: sym.id, reels, ways, pay, spiritMult, spiritReels: spiritReelsUsed });
    }
  }

  let scatterCount = 0;
  grid.forEach(reel => reel.forEach(s => { if (s === 'scatter') scatterCount++; }));

  // Scatter pays total bet × multiplier (not per-way).
  let scatterWin = 0;
  if (scatterCount >= 3) {
    scatterWin = (SYMBOLS.scatter.pay[scatterCount] || 0) * bet;
  }

  return { wins, scatterCount, scatterWin };
}

// Scatter free-spin award table: 3→8, 4→12, 5→16, 6→24.
export function freeSpinsForScatters(count) {
  return ({ 3: 8, 4: 12, 5: 16, 6: 24 })[count] || 0;
}

// Bonus Pop buy cost = total bet × multiplier (per the reference: cost scales with bet).
export const BONUS_POP_COSTS = { 8: 39, 12: 58, 16: 78, 24: 117 };
export function bonusPopCost(bet, games = 8) {
  return bet * (BONUS_POP_COSTS[games] || 39);
}