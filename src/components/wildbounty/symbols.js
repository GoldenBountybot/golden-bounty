// Wild Bounty Showdown — 3600 WAYS (3 x 4 x 5 x 5 x 4 x 3)
export const REEL_ROWS = [3, 4, 5, 5, 4, 3];

export const MULTIPLIERS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];

export const MIN_BET = 0.05;
export const BETS = [0.05, 0.10, 0.25, 0.50, 1.00];

export const SYMBOLS = {
  scatter:  { id: 'scatter',  label: 'SCATTER', type: 'scatter', pay: { 3: 2, 4: 5, 5: 10, 6: 25 } },
  wild:     { id: 'wild',     label: 'WILD',    type: 'wild',    pay: { 3: 5, 4: 10, 5: 25, 6: 50 } },
  bandit:   { id: 'bandit',   label: 'BANDIT',  type: 'high',    pay: { 3: 10, 4: 20, 5: 30, 6: 50 } },
  revolver: { id: 'revolver', label: 'GUN',     type: 'high',    pay: { 3: 8, 4: 15, 5: 20, 6: 30 } },
  whiskey:  { id: 'whiskey',  label: 'WHISKEY', type: 'mid',     pay: { 3: 5, 4: 10, 5: 15, 6: 20 } },
  hat:      { id: 'hat',      label: 'HAT',    type: 'mid',     pay: { 3: 5, 4: 10, 5: 15, 6: 20 } },
  A:        { id: 'A',        label: 'A',      type: 'low',     pay: { 3: 2, 4: 4, 5: 6, 6: 10 } },
  K:        { id: 'K',        label: 'K',      type: 'low',     pay: { 3: 2, 4: 4, 5: 6, 6: 10 } },
  Q:        { id: 'Q',        label: 'Q',      type: 'low',     pay: { 3: 1, 4: 2, 5: 3, 6: 5 } },
  J:        { id: 'J',        label: 'J',      type: 'low',     pay: { 3: 1, 4: 2, 5: 3, 6: 5 } },
};

// Weighted pool — scatter rare, high symbols uncommon, low symbols common.
// Wild never appears directly from a spin — only via the 4/5-of-a-kind conversion.
// Scatter can land naturally (1–2); 3 together only via the forced 0.01% trigger.
const POOL = [
  'scatter',
  'bandit', 'bandit', 'bandit', 'bandit',
  'revolver', 'revolver', 'revolver', 'revolver',
  'hat', 'hat', 'hat', 'hat',
  'whiskey', 'whiskey', 'whiskey', 'whiskey',
  'A', 'A', 'A', 'A', 'A',
  'K', 'K', 'K', 'K', 'K',
  'Q', 'Q', 'Q', 'Q', 'Q', 'Q',
  'J', 'J', 'J', 'J', 'J', 'J', 'J',
];

export function randomSymbol() {
  return POOL[Math.floor(Math.random() * POOL.length)];
}

export function buildReel(rows) {
  return Array.from({ length: rows }, () => randomSymbol());
}

// Ways-to-win evaluation. Wild substitutes for all base symbols.
// grid: array of 6 arrays. bet: current stake (base unit = 100).
export function evaluateWins(grid, bet) {
  // 20-coin ways structure: each way pays paytable × (bet / 20) × ways
  const betUnit = bet / 20;
  const wins = [];
  const baseSymbols = Object.values(SYMBOLS).filter(s => s.type !== 'scatter' && s.type !== 'wild');

  for (const sym of baseSymbols) {
    let reels = 0;
    const countsPerReel = [];
    for (let r = 0; r < 6; r++) {
      const reel = grid[r];
      let count = 0;
      for (const s of reel) {
        if (s === sym.id || s === 'wild') count++;
      }
      if (count > 0) {
        reels++;
        countsPerReel.push(count);
      } else {
        break; // must be contiguous from leftmost reel
      }
    }
    if (reels >= 3) {
      const ways = countsPerReel.reduce((a, b) => a * b, 1);
      const pay = (SYMBOLS[sym.id].pay[reels] || 0) * ways * betUnit;
      if (pay > 0) wins.push({ symbol: sym.id, reels, ways, pay });
    }
  }

  let scatterCount = 0;
  grid.forEach(reel => reel.forEach(s => { if (s === 'scatter') scatterCount++; }));

  return { wins, scatterCount };
}