// Big Brown — 6x4 · 4096 WAYS forest-wildlife slot.
// Original implementation inspired by Endorphina's publicly described mechanics
// (expanding wilds, spirit-bear multipliers, scatter-triggered free spins).

export const REEL_ROWS = [4, 4, 4, 4, 4, 4];
export const WAYS = 4096;
export const BETS = [0.10, 0.25, 0.50, 1.00, 2.00];

// Reels where wilds may land (0-indexed): reels 2,3,4,5 → indices 1,2,3,4.
export const WILD_REELS = new Set([1, 2, 3, 4]);

export const SYMBOLS = {
  scatter: { id: 'scatter', label: 'SCATTER', type: 'scatter', emoji: '🐾', pay: { 3: 2, 4: 5, 5: 10, 6: 25 } },
  spirit:  { id: 'spirit',  label: 'SPIRIT BEAR', type: 'spirit', emoji: '🐻‍❄️', pay: { 3: 5, 4: 10, 5: 25, 6: 50 }, mult: 2 },
  brown:   { id: 'brown',   label: 'BROWN BEAR', type: 'wild', emoji: '🐻', pay: { 3: 5, 4: 10, 5: 25, 6: 50 } },
  buffalo: { id: 'buffalo', label: 'BUFFALO', type: 'high', emoji: '🐃', pay: { 3: 3, 4: 8, 5: 15, 6: 30 } },
  eagle:   { id: 'eagle',   label: 'EAGLE', type: 'high', emoji: '🦅', pay: { 3: 2, 4: 5, 5: 10, 6: 20 } },
  wolf:    { id: 'wolf',    label: 'WOLF', type: 'high', emoji: '🐺', pay: { 3: 2, 4: 4, 5: 8, 6: 15 } },
  deer:    { id: 'deer',    label: 'DEER', type: 'mid', emoji: '🦌', pay: { 3: 1, 4: 3, 5: 6, 6: 12 } },
  A: { id: 'A', label: 'A', type: 'low', emoji: 'A', pay: { 3: 1, 4: 2, 5: 4, 6: 8 } },
  K: { id: 'K', label: 'K', type: 'low', emoji: 'K', pay: { 3: 1, 4: 2, 5: 3, 6: 6 } },
  Q: { id: 'Q', label: 'Q', type: 'low', emoji: 'Q', pay: { 3: 0.5, 4: 1, 5: 2, 6: 4 } },
  J: { id: 'J', label: 'J', type: 'low', emoji: 'J', pay: { 3: 0.5, 4: 1, 5: 2, 6: 4 } },
};

// Weighted pool for non-wild reels. Scatter is rare; lows are common.
const BASE_POOL = [
  'buffalo', 'buffalo',
  'eagle', 'eagle', 'eagle',
  'wolf', 'wolf', 'wolf', 'wolf',
  'deer', 'deer', 'deer', 'deer', 'deer',
  'A', 'A', 'A', 'A', 'A', 'A', 'A',
  'K', 'K', 'K', 'K', 'K', 'K', 'K',
  'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q',
  'J', 'J', 'J', 'J', 'J', 'J', 'J', 'J',
];

// Wild pool for wild reels — includes brown + spirit + scatter, rare.
const WILD_POOL = [
  'brown', 'brown', 'brown', 'brown',
  'spirit',
  'scatter', 'scatter',
  'buffalo', 'eagle', 'eagle',
  'wolf', 'wolf',
  'deer', 'deer',
  'A', 'A', 'K', 'K', 'Q', 'Q', 'J', 'J',
];

export function randomSymbol(reelIndex = -1) {
  const pool = WILD_REELS.has(reelIndex) ? WILD_POOL : BASE_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function buildReel(rows, reelIndex) {
  return Array.from({ length: rows }, () => randomSymbol(reelIndex));
}

export function buildGrid() {
  return REEL_ROWS.map((r, i) => buildReel(r, i));
}

// Expand wilds: on reels 1-4, any brown/spirit wild fills the whole reel.
// Spirit takes priority if both appear (they shouldn't share a reel by design).
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
// Spirit wild reels multiply a win by 2 each (multiplicatively).
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

  return { wins, scatterCount };
}

// Scatter free-spin award table: 3→8, 4→12, 5→16, 6→24.
export function freeSpinsForScatters(count) {
  return ({ 3: 8, 4: 12, 5: 16, 6: 24 })[count] || 0;
}