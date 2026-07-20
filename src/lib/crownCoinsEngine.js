// Crown Coins — Endorphina-inspired 3x3 slot engine.
// 3 reels x 3 rows, 5 fixed paylines, 8 symbols, RTP-biased spin generation,
// and a simplified Royal Treasury hold-and-win bonus.

export const SYMBOLS = [
  { key: 'wild',   emoji: '👑', label: 'Wild Crown',  pay: 50, wild: true,  bonus: false, ring: '#f5d590', bg: 'linear-gradient(135deg,#6b4310,#2a1606)', text: '#fbe6a8' },
  { key: 'bar',    emoji: 'BAR', label: 'Golden Bars', pay: 30, wild: false, bonus: false, ring: '#e8c873', bg: 'linear-gradient(135deg,#4a3416,#211608)', text: '#f5d590' },
  { key: 'bell',   emoji: '🔔', label: 'Golden Bell',  pay: 20, wild: false, bonus: false, ring: '#f0c040', bg: 'linear-gradient(135deg,#3a2a12,#1a1208)', text: '#ffe9a0' },
  { key: 'cherry', emoji: '🍒', label: 'Cherry',       pay: 10, wild: false, bonus: false, ring: '#d83a3a', bg: 'linear-gradient(135deg,#3a1212,#180808)', text: '#ffc0c0' },
  { key: 'plum',   emoji: '🍇', label: 'Plum',          pay: 8,  wild: false, bonus: false, ring: '#9a5fd0', bg: 'linear-gradient(135deg,#241038,#120820)', text: '#e6c0f5' },
  { key: 'orange', emoji: '🍊', label: 'Orange',       pay: 5,  wild: false, bonus: false, ring: '#f5923a', bg: 'linear-gradient(135deg,#3a200c,#1a1006)', text: '#ffd9a0' },
  { key: 'lemon',  emoji: '🍋', label: 'Lemon',        pay: 3,  wild: false, bonus: false, ring: '#f5d83a', bg: 'linear-gradient(135deg,#3a3412,#1a1608)', text: '#fff3a0' },
  { key: 'coin',   emoji: '🪙', label: 'Royal Coin',   pay: 0,  wild: false, bonus: true,  ring: '#ffd24a', bg: 'linear-gradient(135deg,#7a5210,#2a1a06)', text: '#ffe9a0' },
];

const BY_KEY = Object.fromEntries(SYMBOLS.map(s => [s.key, s]));

// Grid layout: index = reel * 3 + row  (reel 0..2, row 0..2 top->bottom)
// 5 fixed paylines (arrays of 3 grid indices)
export const PAYLINES = [
  [0, 3, 6], // top row
  [1, 4, 7], // middle row
  [2, 5, 8], // bottom row
  [0, 4, 8], // diagonal top-left -> bottom-right
  [2, 4, 6], // diagonal bottom-left -> top-right
];

const PAYING = SYMBOLS.filter(s => !s.bonus && s.key !== 'coin' && !s.wild).map(s => s.key);
const ALL_KEYS = SYMBOLS.map(s => s.key);

function rand(n) { return Math.floor(Math.random() * n); }
function pick(arr) { return arr[rand(arr.length)]; }
function weightedPick(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return i; }
  return weights.length - 1;
}

function randomSymbolKey() {
  // Higher pays rarer; coin moderate; lower pays common.
  const keys = ['lemon', 'orange', 'plum', 'cherry', 'bell', 'bar', 'wild', 'coin'];
  const w = [22, 18, 16, 14, 10, 8, 5, 7];
  return keys[weightedPick(w)];
}

function randomGrid() {
  const g = [];
  for (let i = 0; i < 9; i++) g.push(randomSymbolKey());
  return g;
}

// Evaluate a single payline given 3 symbol keys.
function linePayout(keys) {
  const nonWild = keys.filter(k => k !== 'wild');
  if (nonWild.length === 0) return BY_KEY['wild'].pay; // 3 wilds
  const first = nonWild[0];
  if (!nonWild.every(k => k === first)) return 0;
  if (first === 'coin') return 0; // coin is bonus-only, no line pay
  return BY_KEY[first].pay || 0;
}

// Evaluate all winning lines for a grid. Returns { lines: [{line, keys, pay, mul}], totalMul, coins }
export function evaluateGrid(grid) {
  const lines = [];
  let totalMul = 0;
  for (let i = 0; i < PAYLINES.length; i++) {
    const idxs = PAYLINES[i];
    const keys = idxs.map(idx => grid[idx]);
    const mul = linePayout(keys);
    if (mul > 0) {
      lines.push({ line: i, idxs, keys, mul });
      totalMul += mul;
    }
  }
  const coins = grid.filter(k => k === 'coin').length;
  return { lines, totalMul, coins };
}

// Generate an RTP-biased grid. `rtp` is 0..100 winning chance.
export function spinGrid(rtp) {
  const roll = Math.random() * 100;
  const wantWin = roll < rtp;
  const grid = randomGrid();

  if (wantWin) {
    // Force at least one winning line.
    const lineIdx = rand(PAYLINES.length);
    const idxs = PAYLINES[lineIdx];
    // Weighted paying symbol (lower pays more likely to keep payouts sane).
    const symKeys = ['lemon', 'orange', 'plum', 'cherry', 'bell', 'bar', 'wild'];
    const symW = [30, 24, 18, 14, 9, 4, 1];
    const sym = symKeys[weightedPick(symW)];
    idxs.forEach(idx => { grid[idx] = sym; });
    // Occasionally break extra accidental big wins on other lines is fine; keep simple.
  } else {
    // Ensure no winning line: perturb any winning line.
    let guard = 0;
    while (guard++ < 20) {
      const { lines } = evaluateGrid(grid);
      if (lines.length === 0) break;
      for (const ln of lines) {
        // change the middle cell of the line to a different symbol
        const idx = ln.idxs[1];
        let nk;
        do { nk = randomSymbolKey(); } while (nk === grid[idx]);
        grid[idx] = nk;
      }
    }
  }
  return grid;
}

// Bonus (Royal Treasury): 3x3 grid of coin values (in totalBet units) + empties.
// A coin on reel 2 (indices 6,7,8) is a Royal Coin that boosts the total.
export function runBonus(totalBet, rtp) {
  const scale = Math.max(0.4, (rtp || 50) / 96); // dampen payouts when rtp low
  const cells = Array(9).fill(null); // null = empty, number = coin value (x totalBet)
  let coinCount = 0;
  let royal = false;

  // guarantee at least 3 coins (the trigger)
  const positions = [0,1,2,3,4,5,6,7,8].sort(() => Math.random() - 0.5);
  const minCoins = 3 + rand(3); // 3..5 coins
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const isReel2 = pos >= 6;
    if (i < minCoins || Math.random() < 0.35) {
      let v;
      const r = Math.random();
      if (r < 0.55) v = 2 + rand(4);            // 2..5x
      else if (r < 0.80) v = 6 + rand(5);       // 6..10x
      else if (r < 0.90) v = 12 + rand(9);      // 12..20x
      else if (r < 0.965) v = 50;               // MIN jackpot
      else if (r < 0.992) v = 150;              // MID jackpot
      else if (r < 0.998) v = 500;               // MAX jackpot
      else v = 1000;                             // ULTRA jackpot
      cells[pos] = v;
      coinCount++;
      if (isReel2) royal = true;
    }
  }

  let total = cells.reduce((a, b) => a + (b || 0), 0);
  if (royal) total = Math.round(total * 1.5);
  total = Math.round(total * scale);
  return { cells, total, royal, coinCount };
}

export function symbolByKey(key) { return BY_KEY[key]; }