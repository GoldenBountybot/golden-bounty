// Crown Coins slot engine — 3x3 grid, 5 fixed paylines.
// Faithful to Endorphina "Crown Coins":
//   - Wild (Wild Seven) substitutes for all line symbols except the Crown Coin.
//   - Crown Coin (special) lands ONLY on reel 2. 3 coins on reel 2 (full center
//     column) trigger the Royal Treasury hold-and-win bonus.
//   - Royal Treasury: 3x3 grid, Royal Coins on reel 2 (sticky), Gold Coins on
//     reels 1 & 3 carry prize values + MIN/MID/MAX/ULTRA jackpots (up to 1000x
//     total bet). 3 attempts, reset on any new coin, ends when attempts run out.
//   - Classic Risk Game doubles winnings up to 10 times (handled in the UI).

// Coin assets.
export const GOLD_COIN_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/09f3a23e1_generated_image.png';
export const ROYAL_COIN_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/7b32fae4a_generated_image.png';

// Jackpot coins — bonus-only prizes, scaled by TOTAL bet.
export const JACKPOT_MULTS = { MIN: 25, MID: 50, MAX: 150, ULTRA: 1000 };
export const JACKPOT_COINS = {
  MIN: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f672115c5_generated_image.png',
  MID: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/462282802_generated_image.png',
  MAX: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d95929e49_generated_image.png',
  ULTRA: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/681750740_generated_image.png',
};

// Gold coin prize values (x total bet).
export const GOLD_VALUES = [1, 2, 3, 5, 8, 10, 15, 20];

const IMG = {
  cherry: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e193ac3ef_generated_image.png',
  seven: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9190b625b_generated_image.png',
  lemon: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/7e3526539_generated_image.png',
  plum: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/b17d8bc3d_generated_image.png',
  watermelon: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/478f58171_generated_image.png',
  orange: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d06a66723_generated_image.png',
  bell: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/32ed52293_generated_image.png',
  bar: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/3a13fd6fd_generated_image.png',
  grape: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/fdc47a05f_generated_image.png',
  coin: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/7b32fae4a_generated_image.png',
};

// Line symbols (pays are x base bet = totalBet / 5). Wild Seven is the top symbol
// and substitutes for every line symbol. Crown Coin is a special (reel 2 only).
export const SYMBOLS = [
  { key: 'cherry',     image: IMG.cherry,     pay: 3,  name: 'Cherries' },
  { key: 'lemon',      image: IMG.lemon,      pay: 5,  name: 'Lemons' },
  { key: 'orange',     image: IMG.orange,     pay: 8,  name: 'Oranges' },
  { key: 'plum',       image: IMG.plum,       pay: 10, name: 'Plums' },
  { key: 'watermelon', image: IMG.watermelon, pay: 12, name: 'Watermelon' },
  { key: 'grape',      image: IMG.grape,      pay: 15, name: 'Grapes' },
  { key: 'bell',       image: IMG.bell,       pay: 20, name: 'Bell' },
  { key: 'bar',        image: IMG.bar,        pay: 30, name: 'BAR' },
  { key: 'wild',       image: IMG.seven,      pay: 50, wild: true, name: 'Wild Seven' },
  { key: 'coin',       image: IMG.coin,       pay: 0,  special: true, name: 'Crown Coin' },
];

const SYMBOL_MAP = Object.fromEntries(SYMBOLS.map(s => [s.key, s]));
export const symbolByKey = (k) => SYMBOL_MAP[k];

// Regular line symbols (used for reel strips / forced wins — excludes the coin).
export const LINE_SYMBOLS = SYMBOLS.filter(s => !s.special);

// 5 fixed paylines over a 3x3 grid (indices 0..8, row-major).
export const PAYLINES = [
  { name: 'Line 1', idxs: [0, 4, 8] },
  { name: 'Line 2', idxs: [2, 4, 6] },
  { name: 'Line 3', idxs: [0, 1, 2] },
  { name: 'Line 4', idxs: [3, 4, 5] },
  { name: 'Line 5', idxs: [6, 7, 8] },
];

// Build a 3x3 grid biased by the given RTP (0-100). Crown Coins only land on
// reel 2 (cells 1, 4, 7). The RTP gate forces losing boards with probability
// (1 - rtp/100) and guarantees a winning line otherwise.
export function spinGrid(rtp = 50) {
  const REG = LINE_SYMBOLS.map(s => s.key);
  const rReg = () => REG[Math.floor(Math.random() * REG.length)];
  const grid = Array.from({ length: 9 }, () => rReg());

  // Crown Coins only on reel 2. p^3 ≈ trigger rate; p≈0.34 → ~1/25 spins.
  const COIN_CHANCE = 0.34;
  [1, 4, 7].forEach(i => { if (Math.random() < COIN_CHANCE) grid[i] = 'coin'; });

  const forceLoss = Math.random() * 100 > rtp;
  if (forceLoss) {
    for (let iter = 0; iter < 5; iter++) {
      const { lines } = evaluateGrid(grid);
      if (!lines.length) break;
      for (const ln of lines) {
        const idx = ln.idxs.find(i => grid[i] !== 'coin') ?? ln.idxs[0];
        if (grid[idx] !== 'coin') grid[idx] = rReg();
      }
    }
  } else {
    const { lines } = evaluateGrid(grid);
    if (!lines.length) {
      const cand = PAYLINES.filter(ln => ln.idxs.every(i => grid[i] !== 'coin'));
      const ln = cand.length ? cand[Math.floor(Math.random() * cand.length)] : PAYLINES[0];
      const sym = REG[Math.floor(Math.random() * REG.length)];
      ln.idxs.forEach(i => { grid[i] = sym; });
    }
  }
  return grid;
}

// Royal Treasury trigger: 3 Crown Coins on reel 2 (full center column).
export function isBonusTrigger(grid) {
  return grid[1] === 'coin' && grid[4] === 'coin' && grid[7] === 'coin';
}

// Evaluate 5 paylines with Wild substitution. Crown Coin never forms a line.
export function evaluateGrid(grid) {
  const lines = [];
  let totalMul = 0;
  for (const ln of PAYLINES) {
    const keys = ln.idxs.map(i => grid[i]);
    if (keys.some(k => k === 'coin')) continue; // coin is special, not a line symbol
    const wildCount = keys.filter(k => k === 'wild').length;
    let winSym = null;
    if (wildCount === 3) {
      winSym = 'wild';
    } else {
      const nonWild = keys.filter(k => k !== 'wild');
      if (nonWild.length && new Set(nonWild).size === 1) winSym = nonWild[0];
    }
    if (winSym) {
      const sym = symbolByKey(winSym);
      if (sym && sym.pay) {
        lines.push({ ...ln, symbol: winSym, mul: sym.pay });
        totalMul += sym.pay;
      }
    }
  }
  const coins = grid.filter(k => k === 'coin').length;
  return { lines, totalMul, coins };
}

// Weighted jackpot tier for a gold coin in the bonus round.
function weightedJackpot() {
  const r = Math.random();
  if (r < 0.01) return 'ULTRA';
  if (r < 0.06) return 'MAX';
  if (r < 0.20) return 'MID';
  return 'MIN';
}

// Pre-simulate the Royal Treasury hold-and-win round into a list of spins the
// UI plays back. Reel 2 (cells 1,4,7) starts filled with Royal Coins. Each spin
// may land Gold Coins (reels 1 & 3) or Royal Coins (reel 2) on empty cells. Any
// new coin resets attempts to 3; an empty spin decrements attempts. The round
// ends when attempts reach 0 or the grid is full.
export function runBonus(bet, rtp = 50) {
  const cells = Array(9).fill(null);
  cells[1] = cells[4] = cells[7] = { type: 'royal' };
  let attempts = 3;
  let total = 0;
  const spins = [];
  const LAND_CHANCE = 0.30 + (rtp / 100) * 0.10; // 30–40% per empty cell

  for (let step = 0; step < 40 && attempts > 0; step++) {
    const landings = [];
    [0, 1, 2].forEach(col => {
      [col, col + 3, col + 6].forEach(i => {
        if (cells[i]) return;
        if (Math.random() < LAND_CHANCE) {
          if (col === 1) {
            cells[i] = { type: 'royal' };
            landings.push({ cell: i, type: 'royal' });
          } else if (Math.random() < 0.03) {
            const tier = weightedJackpot();
            const mult = JACKPOT_MULTS[tier];
            cells[i] = { type: 'jackpot', tier, mult };
            landings.push({ cell: i, type: 'jackpot', tier, mult });
            total += mult * bet;
          } else {
            const mult = GOLD_VALUES[Math.floor(Math.random() * GOLD_VALUES.length)];
            cells[i] = { type: 'gold', mult };
            landings.push({ cell: i, type: 'gold', mult });
            total += mult * bet;
          }
        }
      });
    });
    attempts = landings.length ? 3 : attempts - 1;
    spins.push({ landings, attemptsAfter: attempts, runningTotal: +total.toFixed(2) });
    if (cells.every(c => c)) break;
  }
  return { spins, total: +total.toFixed(2), finalCells: cells };
}

// Header jackpot badges (mult x total bet).
export const JACKPOTS = [
  { tier: 'MIN', mult: 25, color: '#1a8a25' },
  { tier: 'MID', mult: 50, color: '#1d579b' },
  { tier: 'MAX', mult: 150, color: '#9528aa' },
  { tier: 'ULTRA', mult: 1000, color: '#a11f26' },
];