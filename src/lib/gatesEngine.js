// Gates of Olympus — pay-anywhere tumble slot engine (6x5 grid).
// 8+ matching symbols anywhere pay; winning symbols tumble away and new ones
// drop in; multiplier symbols (×2..×500) stick to the board and sum up; 4+
// scatters trigger 15 free spins where multipliers accumulate across the round.

export const REELS = 6;
export const ROWS = 5;

export const SYMBOLS = {
  zeus: { emoji: '⚡', tier: 'high', label: 'Zeus' },
  crown: { emoji: '👑', tier: 'high', label: 'Crown' },
  hourglass: { emoji: '⏳', tier: 'high', label: 'Hourglass' },
  ring: { emoji: '💍', tier: 'high', label: 'Ring' },
  goblet: { emoji: '🍷', tier: 'high', label: 'Goblet' },
  red: { emoji: '🔴', tier: 'low', label: 'Ruby' },
  blue: { emoji: '🔵', tier: 'low', label: 'Sapphire' },
  green: { emoji: '🟢', tier: 'low', label: 'Emerald' },
  yellow: { emoji: '🟡', tier: 'low', label: 'Topaz' },
  scatter: { emoji: '🔱', tier: 'scatter', label: 'Scatter' },
};

// pay multiplier of bet for 8-11 / 12-14 / 15-19 / 20+ symbols anywhere
export const PAY = {
  zeus: [2, 5, 10, 20],
  crown: [1.5, 3, 6, 12],
  hourglass: [1, 2, 4, 8],
  ring: [0.8, 1.5, 3, 6],
  goblet: [0.5, 1, 2, 4],
  red: [0.25, 0.5, 1, 2],
  blue: [0.25, 0.5, 1, 2],
  green: [0.25, 0.5, 1, 2],
  yellow: [0.25, 0.5, 1, 2],
};

export const MULTIPLIERS = [
  { v: 2, w: 30 }, { v: 3, w: 20 }, { v: 5, w: 15 }, { v: 10, w: 12 },
  { v: 15, w: 8 }, { v: 25, w: 6 }, { v: 50, w: 5 }, { v: 100, w: 4 },
  { v: 250, w: 2 }, { v: 500, w: 1 },
];

const NORMAL_POOL = [
  ['zeus', 5], ['crown', 7], ['hourglass', 9], ['ring', 10], ['goblet', 12],
  ['red', 15], ['blue', 15], ['green', 15], ['yellow', 15],
];
const NORMAL_TOTAL = NORMAL_POOL.reduce((s, [, w]) => s + w, 0);

export const FREE_SPINS_AWARD = 15;
export const BETS = [0.10, 0.20, 0.50, 1, 2, 5, 10, 25, 50, 100, 250, 500];
export const MIN_BET = 0.10;
export const MAX_BET = 500;
export const BET_STEP = 0.10;

const rand = (n) => Math.floor(Math.random() * n);

function weightedPick(pool, total) {
  let r = Math.random() * total;
  for (const [k, w] of pool) { if ((r -= w) < 0) return k; }
  return pool[pool.length - 1][0];
}
function pickMult() {
  const total = MULTIPLIERS.reduce((s, m) => s + m.w, 0);
  let r = Math.random() * total;
  for (const m of MULTIPLIERS) { if ((r -= m.w) < 0) return m.v; }
  return 2;
}
export function pickSymbol(freeMode, allowMult = true) {
  // Value (multiplier) symbols drop rarely in the base game and more often
  // during free spins. `allowMult` lets a spin cap them to a single value
  // symbol per spin (base game) — once one has landed, no more are generated
  // for the rest of that spin's tumbles.
  const mChance = allowMult ? (freeMode ? 0.07 : 0.012) : 0;
  const sChance = freeMode ? 0.02 : 0.014;
  const r = Math.random();
  if (r < mChance) return `M${pickMult()}`;
  if (r < mChance + sChance) return 'scatter';
  return weightedPick(NORMAL_POOL, NORMAL_TOTAL);
}

export function isMult(cell) { return typeof cell === 'string' && cell.startsWith('M'); }
export function multValue(cell) {
  if (!isMult(cell)) return 0;
  const v = Number(cell.slice(1));
  return isFinite(v) ? v : 0;
}

// Value (multiplier) symbols come in 4 colour tiers. The colour is derived from
// the multiplier value: green = low (common) … red = huge (very rare). Because
// pickMult() already weights small values far more than large ones, tying
// colour to value gives the requested drop hierarchy
// (green > blue > pink > red) for free.
export function multColor(v) {
  if (v <= 5) return 'green';
  if (v <= 25) return 'blue';
  if (v <= 100) return 'pink';
  return 'red';
}

export function buildGrid(freeMode, allowMult = true) {
  const g = [];
  for (let c = 0; c < REELS; c++) {
    const reel = [];
    for (let r = 0; r < ROWS; r++) reel.push(pickSymbol(freeMode, allowMult));
    g.push(reel);
  }
  return g;
}

export function payForCount(sym, count) {
  const t = PAY[sym];
  if (!t) return 0;
  if (count >= 20) return t[3];
  if (count >= 15) return t[2];
  if (count >= 12) return t[1];
  if (count >= 8) return t[0];
  return 0;
}

// Evaluate a grid: counts symbols, computes wins, lists multiplier cells, scatters.
export function evaluate(grid, bet) {
  const counts = {};
  const cells = {};
  for (let c = 0; c < REELS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const s = grid[c][r];
      if (isMult(s)) continue;
      counts[s] = (counts[s] || 0) + 1;
      (cells[s] = cells[s] || []).push(`${c}-${r}`);
    }
  }
  const wins = [];
  let win = 0;
  const winPositions = new Set();
  for (const s of Object.keys(counts)) {
    const pay = payForCount(s, counts[s]);
    if (pay > 0) {
      const p = pay * bet;
      win += p;
      wins.push({ symbol: s, count: counts[s], pay: p });
      cells[s].forEach((pos) => winPositions.add(pos));
    }
  }
  const multipliers = [];
  for (let c = 0; c < REELS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const v = multValue(grid[c][r]);
      if (v > 0) multipliers.push({ pos: `${c}-${r}`, value: v });
    }
  }
  const scatterCount = counts.scatter || 0;
  return { wins, win, winPositions, multipliers, scatterCount };
}

// Remove winning + scatter cells; keep multipliers and non-winning symbols;
// refill the top of each column with new symbols.
export function tumble(grid, winPositions, freeMode, allowMult = true) {
  // In-place refill: winning + scatter cells are replaced exactly where they
  // stood; multipliers and every other symbol keep their original positions.
  return grid.map((reel, c) => reel.map((cell, r) => {
    if (isMult(cell)) return cell;
    if (winPositions.has(`${c}-${r}`)) return pickSymbol(freeMode, allowMult);
    if (cell === 'scatter') return pickSymbol(freeMode, allowMult);
    return cell;
  }));
}

function forceWinGrid(freeMode, allowMult = true) {
  const g = buildGrid(freeMode, allowMult);
  const sym = weightedPick(NORMAL_POOL, NORMAL_TOTAL);
  const n = 8 + rand(4);
  const used = new Set();
  while (used.size < n) used.add(`${rand(REELS)}-${rand(ROWS)}`);
  used.forEach((p) => {
    const [c, r] = p.split('-').map(Number);
    g[c][r] = sym;
  });
  return g;
}

function forceLossGrid(freeMode, allowMult = true) {
  let g = buildGrid(freeMode, allowMult);
  let attempts = 0;
  while (attempts < 10) {
    const ev = evaluate(g, 1);
    if (ev.win === 0) return g;
    // break the winning symbol's count by replacing one instance with another normal symbol
    const w = ev.wins[0];
    const pool = NORMAL_POOL.filter(([k]) => k !== w.symbol);
    const total = pool.reduce((s, [, w2]) => s + w2, 0);
    const alt = weightedPick(pool, total);
    const pos = [];
    for (let c = 0; c < REELS; c++) for (let r = 0; r < ROWS; r++) if (g[c][r] === w.symbol) pos.push([c, r]);
    const [c, r] = pos[rand(pos.length)];
    g[c][r] = alt;
    attempts++;
  }
  return g;
}

// Compute the full tumble sequence + totals for one spin.
function gridHasMult(grid) {
  for (const reel of grid) for (const cell of reel) if (isMult(cell)) return true;
  return false;
}

// Base game: keep at most `max` value (multiplier) symbols in the starting grid
// so a single spin never lands two value symbols at once (e.g. green + blue).
function capMults(grid, max) {
  let count = 0;
  return grid.map(reel => reel.map(cell => {
    if (isMult(cell)) {
      count++;
      return count > max ? weightedPick(NORMAL_POOL, NORMAL_TOTAL) : cell;
    }
    return cell;
  }));
}

export function computeSpin(bet, wantWin, freeMode, runningMult) {
  let grid = wantWin ? forceWinGrid(freeMode, true) : forceLossGrid(freeMode, true);
  if (!freeMode) grid = capMults(grid, 1);
  let spinHasMult = freeMode ? false : gridHasMult(grid);
  const tumbles = [];
  let totalWin = 0;
  let spinMultSum = 0;
  let scatterMax = 0;
  let t = 0;
  while (t < 20) {
    const ev = evaluate(grid, bet);
    tumbles.push({
      grid: grid.map((reel) => [...reel]),
      wins: ev.wins,
      winPositions: ev.winPositions,
      multipliers: ev.multipliers,
      scatterCount: ev.scatterCount,
      win: ev.win,
    });
    totalWin += ev.win;
    spinMultSum += ev.multipliers.reduce((s, m) => s + m.value, 0);
    scatterMax = Math.max(scatterMax, ev.scatterCount);
    if (ev.win === 0) break;
    grid = tumble(grid, ev.winPositions, freeMode, freeMode ? true : !spinHasMult);
    if (!freeMode && gridHasMult(grid)) spinHasMult = true;
    t++;
  }
  const triggeredFree = scatterMax >= 4;
  const effectiveMult = freeMode
    ? (runningMult + spinMultSum)
    : (spinMultSum > 0 ? spinMultSum : 1);
  const spinWin = Math.round(totalWin * (effectiveMult || 1) * 100) / 100;
  return {
    tumbles,
    totalWin,
    spinMultSum,
    effectiveMult,
    spinWin,
    scatterMax,
    triggeredFree,
    newRunningMult: freeMode ? runningMult + spinMultSum : 0,
  };
}