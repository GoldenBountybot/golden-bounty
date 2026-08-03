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

const IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776';
export const SYMBOLS = {
  wild:    { id: 'wild',    emoji: '🐂', name: 'Wild Bull',     kind: 'wild',    image: `${IMG}/aa8365d9b_file_000000003078820b89250f27c56de62e.png` },
  scatter: { id: 'scatter', emoji: '⛵', name: 'Argo Ship',     kind: 'scatter', image: `${IMG}/58d0858d9_file_000000008fa0820bb5da9eef0fb09545.png` },
  bonus:   { id: 'bonus',   emoji: '🛡️', name: 'Golden Fleece', kind: 'bonus',   image: `${IMG}/1c288effb_file_00000000b92c820ba7b84e338f31f43a.png` },
  jason:   { id: 'jason',   emoji: '⚔️', name: 'Jason',         kind: 'high',    image: `${IMG}/87ea31954_file_000000001b80820b8d6d3c9e756709e7.png` },
  atlanta: { id: 'atlanta', emoji: '👸', name: 'Goddess',        kind: 'high',    image: `${IMG}/5e79860d9_file_000000004900820b9b740d0a7100cb38.png` },
  lizard:  { id: 'lizard',  emoji: '🦎', name: 'Serpent',       kind: 'high',    image: `${IMG}/ad27ed152_file_00000000e8cc820b9c45251d35e5fbfb.png` },
  dove:    { id: 'dove',    emoji: '🕊️', name: 'Dove',          kind: 'high',    image: `${IMG}/8281d4090_file_00000000d4b0820baceab77e6055cfc7.png` },
  harp:    { id: 'harp',    emoji: '🎵', name: 'Lyre',          kind: 'low',     image: `${IMG}/46043deed_file_00000000d370820bb6e81b120d4d648b.png` },
  cup:     { id: 'cup',     emoji: '🏺', name: 'Amphora',       kind: 'low',     image: `${IMG}/a7c4a453e_file_00000000330c820bb7083c0ecb826172.png` },
  potion:  { id: 'potion',  emoji: '🧪', name: 'Potion',        kind: 'low',     image: `${IMG}/f3c47cc81_file_0000000019e481f8a4cdf17759a2b277.png` },
  bow:     { id: 'bow',     emoji: '🎯', name: 'Bow',           kind: 'low',     image: `${IMG}/c3399d723_file_000000006180820b9453462a52494a1b.png` },
};

export const SYMBOL_META = Object.values(SYMBOLS);

// Paytable: multipliers of line-bet, keyed by symbol id, [3, 4, 5].
export const PAYTABLE = {
  wild:    [20, 60, 300],
  jason:   [15, 50, 250],
  atlanta: [5, 40, 200],
  lizard:  [5, 30, 150],
  dove:    [5, 25, 100],
  harp:    [5, 10, 50],
  cup:     [5, 10, 50],
  potion:  [5, 10, 50],
  bow:     [5, 10, 50],
};

export const SCATTER_PAY = 25;       // x base bet for 3 scatters
export const BONUS_TRIGGER_COUNT = 6; // 6+ bonus symbols trigger Golden Fleece
export const FREE_SPINS_AWARD = 8;
export const MAX_RISK_STEPS = 10;

// ---- Value Coin feature (Crown Coins style) ----
// Value coins appear on reels in the base game. Landing coins on 3+ reels
// triggers a hold-and-spin coin round: 3 spins, coins stick, any new coin
// resets the counter to 3. Coin value = mult × bet (at $0.10 → $0.10…$1.50).
export const VALUE_COIN_MULTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
export const VALUE_COIN_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/5e1ba97ff_file_000000008624820bb05d279226f89912.png';
export const VALUE_COIN_CHANCE = 0.05;   // per reel, base game
export const COIN_TRIGGER_COUNT = 5;     // 5+ value coins (bonus symbols count) triggers coin round
export const COIN_SPINS_START = 3;
export const COIN_DROP_CHANCE = 0.12;    // per reel, per coin spin

export function isValueCoin(key) { return typeof key === 'string' && key.startsWith('vc'); }
export function valueCoinMult(key) { return Number(String(key).slice(2)) || 0; }
export function valueCoinKey(mult) { return 'vc' + mult; }

// Reel symbol weights.
const BASE_WEIGHTS = {
  bow: 11, potion: 11, cup: 11, harp: 11,
  dove: 3, lizard: 3, atlanta: 2, jason: 2,
  wild: 2, bonus: 1,
};
const FREE_WEIGHTS = {
  jason: 22, atlanta: 18, lizard: 16, dove: 14,
  wild: 12, bonus: 3, scatter: 6,
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
  // Value coins — base game only. Variable count per reel (1..3),
  // each coin a distinct multiplier, placed in random rows.
  if (!freeSpins && Math.random() < VALUE_COIN_CHANCE) {
    const w = reelWeights(reelIndex, freeSpins);
    const count = Math.random() < 0.78 ? 1 : 2; // mostly 1 coin, rarely 2
    const rows = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, count);
    const reel = [0, 1, 2].map(() => pickWeighted(w));
    const used = new Set();
    rows.forEach((r) => {
      let mult;
      do { mult = VALUE_COIN_MULTS[Math.floor(Math.random() * VALUE_COIN_MULTS.length)]; }
      while (used.has(mult) && used.size < VALUE_COIN_MULTS.length);
      used.add(mult);
      reel[r] = valueCoinKey(mult);
    });
    return reel;
  }
  // Stacked wild / bonus — variable height (1..3), stacked consecutively.
  // BONUS symbols may appear stacked, both in main game and Free Games.
  const stackChance = freeSpins ? 0.12 : 0.07;
  if (Math.random() < stackChance) {
    const height = 1 + Math.floor(Math.random() * ROWS); // 1..3
    const start = Math.floor(Math.random() * (ROWS - height + 1));
    const w = reelWeights(reelIndex, freeSpins);
    const reel = [0, 1, 2].map(() => pickWeighted(w));
    const stackSym = w.bonus && Math.random() < 0.05 ? 'bonus' : 'wild';
    for (let i = 0; i < height; i++) reel[start + i] = stackSym;
    return reel;
  }
  const w = reelWeights(reelIndex, freeSpins);
  return [0, 1, 2].map(() => pickWeighted(w));
}

// Coin burst: occasionally 3-5 value coins drop together across distinct reels
// (max 1 per reel, so the burst itself never reaches 6). Exclusive with the
// per-reel independent coin logic — the rare 6+ trigger still comes only from
// the independent multi-reel hits on non-burst spins, keeping that rate as before.
const COIN_BURST_CHANCE = 0.025;
function generateBurstGrid() {
  const grid = Array.from({ length: REELS }, (_, r) => generateReel(r, false));
  // Clear any value coins that landed independently so the burst is clean.
  for (let r = 0; r < REELS; r++)
    for (let row = 0; row < ROWS; row++)
      if (isValueCoin(grid[r][row])) grid[r][row] = pickWeighted(reelWeights(r, false));
  const burstCount = 3 + Math.floor(Math.random() * 3); // 3..5
  const used = new Set();
  let placed = 0;
  // Place coins at random cells — allows 2-3 to stack on the same reel/line.
  while (placed < burstCount) {
    const r = Math.floor(Math.random() * REELS);
    const row = Math.floor(Math.random() * ROWS);
    if (isValueCoin(grid[r][row])) continue;
    let mult;
    do { mult = VALUE_COIN_MULTS[Math.floor(Math.random() * VALUE_COIN_MULTS.length)]; }
    while (used.has(mult) && used.size < VALUE_COIN_MULTS.length);
    used.add(mult);
    grid[r][row] = valueCoinKey(mult);
    placed++;
  }
  return grid;
}

export function generateGrid(freeSpins = false) {
  if (!freeSpins && Math.random() < COIN_BURST_CHANCE) return generateBurstGrid();
  return Array.from({ length: REELS }, (_, r) => generateReel(r, freeSpins));
}

// Evaluate line wins + scatter/bonus counts.
export function evaluate(grid, lineBet, baseBet) {
  const wins = [];
  PAYLINES.forEach((line, li) => {
    const first = grid[0][line[0]];
    if (isValueCoin(first) || first === 'scatter' || first === 'bonus') return;
    let paySym = first;
    if (paySym === 'wild') {
      paySym = null;
      for (let r = 0; r < REELS; r++) {
        const s = grid[r][line[r]];
        if (s !== 'wild' && s !== 'scatter' && s !== 'bonus' && !isValueCoin(s)) { paySym = s; break; }
      }
      if (!paySym) paySym = 'wild';
    }
    if (!paySym || paySym === 'scatter' || paySym === 'bonus') return;
    let count = 0;
    for (let r = 0; r < REELS; r++) {
      const s = grid[r][line[r]];
      if (isValueCoin(s)) break;
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
  if (roll < 0.80) return { type: 'shield', emoji: '🛡️', prize: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16][Math.floor(Math.random() * 13)] };
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
  // clear any value coins so the forced line is clean
  for (let r = 0; r < REELS; r++)
    for (let row = 0; row < ROWS; row++)
      if (isValueCoin(grid[r][row])) grid[r][row] = pickWeighted(reelWeights(r, false));
  const line = PAYLINES[Math.floor(Math.random() * PAYLINES.length)];
  const sym = ['harp', 'cup', 'potion', 'bow', 'harp', 'cup', 'dove', 'lizard'][Math.floor(Math.random() * 8)];
  for (let r = 0; r < 3; r++) {
    const copy = [...grid[r]];
    copy[line[r]] = sym;
    grid[r] = copy;
  }
  return grid;
}

// ---- Coin round helpers ----
// Trigger: 5+ value coins landed. Bonus symbols count as value coins toward
// the trigger (e.g. 5 coins + 1 bonus = 6 → triggers), but at least one real
// value coin must be present (a pure-bonus grid stays a Golden Fleece bonus).
export function coinTriggered(grid) {
  let coinCount = 0;
  let bonusCount = 0;
  for (let r = 0; r < REELS; r++)
    for (let row = 0; row < ROWS; row++) {
      if (isValueCoin(grid[r][row])) coinCount++;
      else if (grid[r][row] === 'bonus') bonusCount++;
    }
  // 6+ value coins triggers; OR 5 value coins + 1-2 bonus symbols.
  return coinCount >= 5 && coinCount + bonusCount >= 6;
}

export function collectCoins(grid) {
  const map = {};
  for (let r = 0; r < REELS; r++)
    for (let row = 0; row < ROWS; row++) {
      if (isValueCoin(grid[r][row])) {
        map[`${r}-${row}`] = valueCoinMult(grid[r][row]);
      } else if (grid[r][row] === 'bonus') {
        // bonus symbol becomes a value coin with a random multiplier
        const mult = VALUE_COIN_MULTS[Math.floor(Math.random() * VALUE_COIN_MULTS.length)];
        map[`${r}-${row}`] = mult;
      }
    }
  return map;
}

export function spinCoinRound(stuck) {
  const newStuck = { ...stuck };
  // Empty (non-stuck) cells are null — no regular symbols appear in the coin
  // round; only value coins drop. The UI renders a dark ornate placeholder.
  const grid = Array.from({ length: REELS }, (_, r) =>
    Array.from({ length: ROWS }, (_, row) => {
      const k = `${r}-${row}`;
      return newStuck[k] ? valueCoinKey(newStuck[k]) : null;
    })
  );
  const dropped = [];
  for (let r = 0; r < REELS; r++) {
    if (Math.random() < COIN_DROP_CHANCE) {
      const empty = [];
      for (let row = 0; row < ROWS; row++) if (!newStuck[`${r}-${row}`]) empty.push(row);
      if (empty.length) {
        const row = empty[Math.floor(Math.random() * empty.length)];
        const mult = VALUE_COIN_MULTS[Math.floor(Math.random() * VALUE_COIN_MULTS.length)];
        newStuck[`${r}-${row}`] = mult;
        grid[r][row] = valueCoinKey(mult);
        dropped.push(`${r}-${row}`);
      }
    }
  }
  return { grid, stuck: newStuck, dropped };
}

export function coinTotal(stuck, bet) {
  return Object.values(stuck).reduce((a, m) => a + m * bet, 0);
}

export const BETS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 45];