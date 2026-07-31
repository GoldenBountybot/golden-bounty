// Fortune Gems — 3×3 gem slot engine
// 5 paylines, Wild (Diamond) substitutes, random center multiplier up to 10×

export const COLS = 3;
export const ROWS = 3;
export const TOTAL = 9;
export const CENTER_IDX = 4;

export const SYMBOLS = {
  DIAMOND: {
    id: 'DIAMOND', name: 'Diamond', isWild: true, pay3: 50,
    img: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f138fc8b0_generated_image.png',
  },
  RUBY: {
    id: 'RUBY', name: 'Ruby', pay3: 25,
    img: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/4a41c230f_generated_image.png',
  },
  SAPPHIRE: {
    id: 'SAPPHIRE', name: 'Sapphire', pay3: 15,
    img: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a2f75da51_generated_image.png',
  },
  EMERALD: {
    id: 'EMERALD', name: 'Emerald', pay3: 10,
    img: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/93d1539ce_generated_image.png',
  },
  TOPAZ: {
    id: 'TOPAZ', name: 'Topaz', pay3: 8,
    img: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/55dcdc8cc_generated_image.png',
  },
  AMETHYST: {
    id: 'AMETHYST', name: 'Amethyst', pay3: 5,
    img: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/902031fbb_generated_image.png',
  },
};

export const SYMBOL_IDS = Object.keys(SYMBOLS);
export const WILD = 'DIAMOND';

// Grid indices:
// 0 1 2
// 3 4 5
// 6 7 8
export const PAYLINES = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 4, 8], // diagonal ↘
  [6, 4, 2], // diagonal ↗
];

export const MULTIPLIERS = [1, 2, 3, 5, 10];

// Weighted symbol pool — rarer gems pay more but appear less
const SYM_WEIGHTS = {
  AMETHYST: 30,
  TOPAZ: 25,
  EMERALD: 20,
  SAPPHIRE: 15,
  RUBY: 8,
  DIAMOND: 2,
};

export function makeCell() {
  const entries = Object.entries(SYM_WEIGHTS);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [sym, w] of entries) {
    r -= w;
    if (r <= 0) return sym;
  }
  return 'AMETHYST';
}

export function makeGrid() {
  const grid = [];
  for (let i = 0; i < TOTAL; i++) {
    grid.push({ id: Math.random().toString(36).slice(2) + '-' + i + '-' + Date.now(), sym: makeCell() });
  }
  return grid;
}

// Evaluate all 5 paylines. Wild substitutes for any symbol.
export function evaluate(grid, bet) {
  let totalWin = 0;
  const winLines = [];
  const winCells = new Set();
  const winSymbols = [];

  for (let lineIdx = 0; lineIdx < PAYLINES.length; lineIdx++) {
    const line = PAYLINES[lineIdx];
    const symbols = line.map((i) => grid[i].sym);

    // Determine target symbol = first non-wild, or wild if all wild
    let targetSym = null;
    for (const s of symbols) {
      if (s !== WILD) { targetSym = s; break; }
    }
    if (!targetSym) targetSym = WILD;

    const allMatch = symbols.every((s) => s === targetSym || s === WILD);
    if (allMatch) {
      const pay = SYMBOLS[targetSym].pay3 * bet;
      totalWin += pay;
      winLines.push({ line: lineIdx, symbol: targetSym, pay });
      line.forEach((i) => winCells.add(i));
      if (!winSymbols.includes(targetSym)) winSymbols.push(targetSym);
    }
  }

  return { pay: totalWin, winLines, winCells, winSymbols };
}

// Weighted random multiplier — 1× most common, 10× very rare
export function randomMultiplier() {
  const weights = [55, 25, 12, 6, 2]; // 1, 2, 3, 5, 10
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return MULTIPLIERS[i];
  }
  return 1;
}

// Force a win on a random payline with a random non-wild symbol
export function nudgeForWin(grid) {
  const symIds = SYMBOL_IDS.filter((s) => s !== WILD);
  const line = PAYLINES[Math.floor(Math.random() * PAYLINES.length)];
  const winSym = symIds[Math.floor(Math.random() * symIds.length)];
  const newGrid = grid.map((c) => ({ ...c }));
  line.forEach((i) => { newGrid[i].sym = winSym; });
  return newGrid;
}