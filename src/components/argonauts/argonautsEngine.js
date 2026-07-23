// Argonauts slot engine — Greek mythology 5x3, 10 paylines.
// Endorphina-style mechanics: stacked wild bull, Argo scatter (8 free spins),
// Jason's shield bonus (Golden Fleece hold-and-spin), risk/gamble double-up.

export const REELS = 5;
export const ROWS = 3;

// 10 paylines — row index (0..2) per reel.
export const PAYLINES = [
  [0, 0, 0, 0, 0], // 1 top
  [1, 1, 1, 1, 1], // 2 middle
  [2, 2, 2, 2, 2], // 3 bottom
  [0, 1, 2, 1, 0], // 4 V
  [2, 1, 0, 1, 2], // 5 inverted V
  [0, 0, 1, 2, 2], // 6 stairs down
  [2, 2, 1, 0, 0], // 7 stairs up
  [0, 1, 1, 1, 0], // 8 valley
  [2, 1, 1, 1, 2], // 9 hill
  [1, 0, 0, 0, 1], // 10 dip
];

export const SYMBOLS = {
  wild:    { id: 'wild',    emoji: '🐂', name: 'Wild Bull',   kind: 'wild' },
  scatter: { id: 'scatter', emoji: '⛵', name: 'Argo Ship',    kind: 'scatter' },
  bonus:   { id: 'bonus',   emoji: '🛡️', name: "Jason's Shield", kind: 'bonus' },
  jason:   { id: 'jason',   emoji: '⚔️', name: 'Jason',         kind: 'high' },
  atlanta: { id: 'atlanta', emoji: '👸', name: 'Atlanta',      kind: 'high' },
  lizard:  { id: 'lizard',  emoji: '🦎', name: 'Serpent',       kind: 'high' },
  dove:    { id: 'dove',    emoji: '🕊️', name: 'Dove',          kind: 'high' },
  harp:    { id: 'harp',    emoji: '🎵', name: 'Lyre',          kind: 'low' },
  cup:     { id: 'cup',     emoji: '🏺', name: 'Chalice',       kind: 'low' },
  potion:  { id: 'potion',  emoji: '🧪', name: 'Potion',        kind: 'low' },
  bow:     { id: 'bow',     emoji: '🎯', name: 'Bow',           kind: 'low' },
};

export const SYMBOL_META = Object.values(SYMBOLS);

// Paytable: multipliers of line-bet, keyed by symbol id, [3, 4, 5].
export const PAYTABLE = {
  wild:    [20, 60, 300],
  jason:   [25, 75, 250],
  atlanta: [15, 40, 125],
  lizard:  [10, 30, 100],
  dove:    [8, 25, 80],
  harp:    [5, 15, 50],
  cup:     [5, 12, 40],
  potion:  [4, 10, 30],
  bow:     [3, 8, 25],
};

export const SCATTER_PAY = 25;       // x base bet for 3 scatters
export const BONUS_TRIGGER_COUNT = 6; // 6+ bonus symbols trigger Golden Fleece
export const FREE_SPINS_AWARD = 8;
export const MAX_RISK_STEPS = 10;

// Reel symbol weights.
const BASE_WEIGHTS = {
  bow: 22, potion: 20, cup: 18, harp: 16,
  dove: 12, lizard: 10, atlanta: 8, jason: 6,
  wild: 6, bonus: 5,
};
const FREE_WEIGHTS = {
  jason: 20, atlanta: 16, lizard: 14, dove: 12,
  wild: 10, bonus: 8, scatter: 6,
};

function pickWeighted(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [sym, w] of entries) {
    r -= w;
    if (r <= 0) return sym;
  }
  return entries[entries.length - 1][0];
}

export function reelWeights(reelIndex, freeSpins) {
  if (freeSpins) {
    const w = { ...FREE_WEIGHTS };
    if (reelIndex < 1 || reelIndex > 3) delete w.scatter;
    return w;
  }
  const w = { ...BASE_WEIGHTS };
  if (reelIndex >= 1 && reelIndex <= 3) w.scatter = 4;
  else delete w.scatter;
  return w;
}

export function generateReel(reelIndex, freeSpins) {
  // Stacked wild chance — full-column wilds (higher in free spins).
  const stackChance = freeSpins ? 0.12 : 0.07;
  if (Math.random() < stackChance) return ['wild', 'wild', 'wild'];
  const w = reelWeights(reelIndex, freeSpins);
  return [0, 1, 2].map(() => pickWeighted(w));
}

export function generateGrid(freeSpins = false) {
  return Array.from({ length: REELS }, (_, r) => generateReel(r, freeSpins));
}

// Evaluate line wins + scatter/bonus counts.
export function evaluate(grid, lineBet, baseBet) {
  const wins = [];
  PAYLINES.forEach((line, li) => {
    const first = grid[0][line[0]];
    let paySym = first;
    if (paySym === 'wild') {
      paySym = null;
      for (let r = 0; r < REELS; r++) {
        const s = grid[r][line[r]];
        if (s !== 'wild' && s !== 'scatter' && s !== 'bonus') { paySym = s; break; }
      }
      if (!paySym) paySym = 'wild';
    }
    if (!paySym || paySym === 'scatter' || paySym === 'bonus') return;
    let count = 0;
    for (let r = 0; r < REELS; r++) {
      const s = grid[r][line[r]];
      if (s === paySym || s === 'wild') count++;
      else break;
    }
    if (count >= 3) {
      const mult = PAYTABLE[paySym][count - 3];
      wins.push({
        line: li,
        symbol: paySym,
        count,
        pay: mult * lineBet,
        positions: line.slice(0, count).map((row, r) => `${r}-${row}`),
      });
    }
  });

  const scatterPositions = [];
  const bonusPositions = [];
  for (let r = 0; r < REELS; r++) {
    for (let row = 0; row < ROWS; row++) {
      if (grid[r][row] === 'scatter') scatterPositions.push(`${r}-${row}`);
      if (grid[r][row] === 'bonus') bonusPositions.push(`${r}-${row}`);
    }
  }
  const scatterCount = scatterPositions.length;
  const bonusCount = bonusPositions.length;
  const scatterPay = scatterCount >= 3 ? SCATTER_PAY * baseBet : 0;
  const lineWin = wins.reduce((s, w) => s + w.pay, 0);
  return {
    wins, scatterCount, scatterPositions, scatterPay,
    bonusCount, bonusPositions, lineWin,
  };
}

// ---- Golden Fleece bonus game (hold-and-spin, auto-resolved) ----
function makeBonusSymbol() {
  const roll = Math.random();
  if (roll < 0.08) return { type: 'fleece', emoji: '🐑', prize: [20, 50, 150][Math.floor(Math.random() * 3)] };
  if (roll < 0.80) return { type: 'shield', emoji: '🛡️', prize: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16][Math.floor(Math.random() * 10)] };
  return { type: 'meander', emoji: '🌀', prize: 0 };
}

export function resolveBonus(baseBet, triggerCount) {
  const SIZE = 15;
  const grid = Array(SIZE).fill(null);
  let respins = 3;
  const steps = [];
  const seed = Math.min(triggerCount, SIZE);
  const idxs = [...Array(SIZE).keys()];
  for (let i = 0; i < seed; i++) {
    const pos = idxs.splice(Math.floor(Math.random() * idxs.length), 1)[0];
    grid[pos] = makeBonusSymbol();
  }
  steps.push(grid.map((v) => (v ? { ...v } : null)));
  let full = grid.filter((v) => v && v.type !== 'meander').length >= SIZE;
  while (respins > 0 && !full) {
    for (let i = 0; i < SIZE; i++) if (grid[i] && grid[i].type === 'meander') grid[i] = null;
    let newLocks = 0;
    for (let i = 0; i < SIZE; i++) {
      if (grid[i] === null && Math.random() < 0.28) {
        grid[i] = makeBonusSymbol();
        if (grid[i].type !== 'meander') newLocks++;
      }
    }
    steps.push(grid.map((v) => (v ? { ...v } : null)));
    if (newLocks > 0) respins = 3;
    else respins--;
    full = grid.filter((v) => v && v.type !== 'meander').length >= SIZE;
  }
  let total = 0;
  let extraJackpot = false;
  const lockCount = grid.filter((v) => v && v.type !== 'meander').length;
  if (lockCount >= SIZE) { total += 5000 * baseBet; extraJackpot = true; }
  total += grid.filter((v) => v && v.prize).reduce((s, v) => s + v.prize, 0) * baseBet;
  return { steps, total, extraJackpot };
}

// Force a win by seeding matching high symbols across the first 3 reels on a
// random payline (used for RTP bias toward a winning spin).
export function forceWinGrid() {
  const grid = generateGrid(false);
  const line = PAYLINES[Math.floor(Math.random() * PAYLINES.length)];
  const sym = ['jason', 'atlanta', 'lizard', 'dove', 'harp', 'cup'][Math.floor(Math.random() * 6)];
  for (let r = 0; r < 3; r++) {
    const copy = [...grid[r]];
    copy[line[r]] = sym;
    grid[r] = copy;
  }
  return grid;
}

export const BETS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 45];