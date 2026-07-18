// SuperAce slot engine — pure logic, no React.
// 5x4 grid, ways-pay, cascading combos, golden->wild, scatter free spins.

export const COLS = 5;
export const ROWS = 4;
export const TOTAL = COLS * ROWS;

export const BASE_MULTS = [1, 2, 3, 5];
export const FREE_MULTS = [2, 4, 6, 10];
export const FREE_SPINS_AWARD = 10;
export const RETRIGGER_AWARD = 5;
export const BUY_BONUS_MULT = 60;
export const MAX_WIN_CAP = 1500; // times bet, hard cap per spin

export const PAY_SYMBOLS = ['A', 'K', 'Q', 'J', 'S', 'H', 'D', 'C'];
// PAYS[s][run] = multiplier of bet PER WAY (1024-ways convention).
// Values mirror the JILI Super Ace / Full House paytable (× total bet per way).
export const PAYS = {
  A: { 3: 0.5,  4: 1.5,  5: 2.5  },
  K: { 3: 0.4,  4: 1.2,  5: 2.0  },
  Q: { 3: 0.3,  4: 0.9,  5: 1.5  },
  J: { 3: 0.2,  4: 0.6,  5: 1.0  },
  S: { 3: 0.1,  4: 0.3,  5: 0.5  },
  H: { 3: 0.1,  4: 0.3,  5: 0.5  },
  D: { 3: 0.05, 4: 0.15, 5: 0.25 },
  C: { 3: 0.05, 4: 0.15, 5: 0.25 },
};
export const SCATTER_PAY = { 3: 2, 4: 10, 5: 50 };

// Golden Cards only appear on reels 2–4 (columns 1,2,3). 20% chance per card.
export const GOLDEN_COLS = [1, 2, 3];
export const GOLDEN_CHANCE = 0.20;

// Reel-strip weights. Suits common, faces mid, A rarer, SCATTER rare.
// WILD never spawns directly — it only appears via golden-card transformation.
const WEIGHTS = {
  A: 7, K: 8, Q: 9, J: 10,
  S: 16, H: 16, D: 16, C: 16,
  SC: 3,
};

let _uid = 0;
export function makeCell(forceSym) {
  const sym = forceSym || weightedSym();
  return { sym, golden: false, id: ++_uid };
}

function weightedSym() {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [s, w] of Object.entries(WEIGHTS)) {
    if (r < w) return s;
    r -= w;
  }
  return 'S';
}

export function makeGrid() {
  const g = [];
  for (let i = 0; i < TOTAL; i++) g.push(makeCell());
  // Golden cards: 1–4 random, on middle reels (2–4) over pay-symbol cells.
  const candidates = [];
  for (const c of GOLDEN_COLS) {
    for (let r = 0; r < ROWS; r++) {
      const idx = r * COLS + c;
      if (PAY_SYMBOLS.includes(g[idx].sym)) candidates.push(idx);
    }
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const n = Math.min(candidates.length, 1);
  for (let i = 0; i < n; i++) g[candidates[i]].golden = true;
  return g;
}

// index = row*COLS + col
export function evaluate(g, bet) {
  let pay = 0;
  const winCells = new Set();
  const goldenToWild = new Set();
  for (const s of PAY_SYMBOLS) {
    let run = 0;
    const counts = [];
    for (let c = 0; c < COLS; c++) {
      let cnt = 0;
      for (let r = 0; r < ROWS; r++) {
        const cell = g[r * COLS + c];
        if (cell.sym === s || cell.sym === 'W') cnt++;
      }
      if (cnt > 0) { counts.push(cnt); run++; } else break;
    }
    if (run >= 3) {
      const ways = counts.reduce((a, b) => a * b, 1);
      pay += (PAYS[s][run] || 0) * ways * bet;
      for (let c = 0; c < run; c++) {
        for (let r = 0; r < ROWS; r++) {
          const idx = r * COLS + c;
          const cell = g[idx];
          if (cell.sym === s || cell.sym === 'W') {
            winCells.add(idx);
            if (cell.golden && cell.sym !== 'W') goldenToWild.add(idx);
          }
        }
      }
    }
  }
  // Every golden card that is part of a winning combo flips into a WILD (Joker)
  // for the next cascade — the signature Super Ace mechanic.
  const scatterCount = g.filter((c) => c.sym === 'SC').length;
  let scatterPay = 0;
  if (scatterCount >= 3) scatterPay = (SCATTER_PAY[scatterCount] || SCATTER_PAY[5]) * bet;
  return { pay, winCells, goldenToWild, scatterCount, scatterPay };
}

// Remove winning cells, turn golden winners into WILD, compact down, refill top.
export function cascade(g, winCells, goldenToWild) {
  const res = new Array(TOTAL);
  for (let c = 0; c < COLS; c++) {
    const keepers = [];
    for (let r = 0; r < ROWS; r++) {
      const idx = r * COLS + c;
      const cell = g[idx];
      if (goldenToWild.has(idx)) keepers.push({ ...cell, sym: 'W', golden: false });
      else if (!winCells.has(idx)) keepers.push(cell);
    }
    const offset = ROWS - keepers.length;
    for (let r = 0; r < ROWS; r++) {
      const idx = r * COLS + c;
      if (r >= offset) {
        res[idx] = keepers[r - offset];
      } else {
        res[idx] = makeCell();
      }
    }
  }
  return res;
}

// RTP nudge: force 3 top-row reels to share a random paying symbol.
export function nudgeForWin(g) {
  const s = PAY_SYMBOLS[Math.floor(Math.random() * PAY_SYMBOLS.length)];
  for (let c = 0; c < 3; c++) {
    g[c] = makeCell(s); // top row (row 0)
  }
  return g;
}

export function multiplierFor(combo, inFree) {
  const arr = inFree ? FREE_MULTS : BASE_MULTS;
  return arr[Math.min(combo, arr.length - 1)];
}

// Golden Wild spread: find grid positions where dropping a WILD would create
// a new/extended winning line (i.e., increases winning cells).
export function findWildTargets(g, sourceIdx) {
  const baseWin = evaluate(g, 1).winCells;
  const targets = [];
  for (let i = 0; i < TOTAL; i++) {
    if (i === sourceIdx || baseWin.has(i)) continue;
    const cell = g[i];
    if (cell.sym === 'W' || cell.sym === 'SC') continue;
    const test = g.slice();
    test[i] = { ...cell, sym: 'W' };
    const afterWin = evaluate(test, 1).winCells;
    if (afterWin.size > baseWin.size) targets.push(i);
  }
  return targets;
}

// Golden Wild trigger: only spawns when placing it (+ flying copies) yields a big win.
export const BIG_WIN_MULT = 50;

export function findGoldenWildConfig(g, bet) {
  const threshold = BIG_WIN_MULT * bet;
  let best = null;
  for (const c of GOLDEN_COLS) {
    for (let r = 0; r < ROWS; r++) {
      const idx = r * COLS + c;
      const cell = g[idx];
      if (cell.sym === 'W' || cell.sym === 'SC') continue;
      const test = g.slice();
      test[idx] = { ...cell, sym: 'W' };
      const targets = findWildTargets(test, idx).slice(0, 2);
      const test2 = test.slice();
      targets.forEach((t) => { test2[t] = { ...test2[t], sym: 'W' }; });
      const ev = evaluate(test2, bet);
      if (ev.pay >= threshold && (!best || ev.pay > best.win)) {
        best = { sourceIdx: idx, targets, win: ev.pay };
      }
    }
  }
  return best;
}