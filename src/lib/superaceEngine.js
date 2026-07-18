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
// PAYS[s][run] = multiplier of bet PER WAY. win = PAYS[s][run] * ways * bet
export const PAYS = {
  A: { 3: 0.10, 4: 0.30, 5: 0.75 },
  K: { 3: 0.08, 4: 0.22, 5: 0.60 },
  Q: { 3: 0.06, 4: 0.18, 5: 0.48 },
  J: { 3: 0.05, 4: 0.14, 5: 0.38 },
  S: { 3: 0.035, 4: 0.10, 5: 0.26 },
  H: { 3: 0.035, 4: 0.10, 5: 0.26 },
  D: { 3: 0.035, 4: 0.10, 5: 0.26 },
  C: { 3: 0.035, 4: 0.10, 5: 0.26 },
};
export const SCATTER_PAY = { 3: 2, 4: 10, 5: 50 };

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
  // Every card (faces + suits) can be golden. Spawn 1–4 golden cards per spin.
  const payIdx = [];
  for (let i = 0; i < TOTAL; i++) {
    if (PAY_SYMBOLS.includes(g[i].sym)) payIdx.push(i);
  }
  const count = Math.min(1 + Math.floor(Math.random() * 4), payIdx.length); // 1..4
  for (let i = payIdx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [payIdx[i], payIdx[j]] = [payIdx[j], payIdx[i]];
  }
  for (let i = 0; i < count; i++) g[payIdx[i]].golden = true;
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
      res[idx] = r >= offset ? keepers[r - offset] : makeCell();
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