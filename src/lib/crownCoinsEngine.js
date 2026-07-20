// Crown Coins slot engine — 3x3 grid, 5 fixed paylines.
// Merged design:
//   - Wild Seven substitutes for all line symbols except the Crown Coin.
//   - Crown Coin lands ONLY on reel 2 (cells 1,4,7). 3 coins (full center
//     column) trigger the Royal Treasury FREE SPINS round (10 free spins).
//   - Value Coins (gold, prize value) and Jackpot Coins (MIN/MID/MAX/ULTRA)
//     drop on reels 1 & 3. Value Coins fly to the banner and are collected;
//     Jackpot Coins pay their tier multiplier × total bet on the spot.
//   - Classic Risk Game doubles winnings (handled in the UI).

// Coin assets.
export const GOLD_COIN_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/09f3a23e1_generated_image.png';
export const ROYAL_COIN_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/7b32fae4a_generated_image.png';

// Jackpot coins — scaled by TOTAL bet.
export const JACKPOT_MULTS = { MIN: 25, MID: 50, MAX: 150, ULTRA: 1000 };
export const JACKPOT_COINS = {
  MIN: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f672115c5_generated_image.png',
  MID: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/462282802_generated_image.png',
  MAX: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d95929e49_generated_image.png',
  ULTRA: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/681750740_generated_image.png',
};

// Gold / Value coin prize values (x total bet).
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

// Line symbols (pay is x base bet = totalBet / 5). Wild Seven substitutes for
// every line symbol. Crown Coin is a special (reel 2 only).
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

// Regular line symbols (reel strips / forced wins — excludes the crown coin).
export const LINE_SYMBOLS = SYMBOLS.filter(s => !s.special);

// A grid cell is either a string key (line symbol or 'coin') or a coin object
// {type:'value'|'jackpot', mult, tier?}.
export const isCoinCell = (c) => c && typeof c === 'object';
export const isLineKey = (c) => typeof c === 'string' && c !== 'coin';

// 5 fixed paylines over a 3x3 grid (indices 0..8, row-major).
export const PAYLINES = [
  { name: 'Line 1', idxs: [0, 4, 8] },
  { name: 'Line 2', idxs: [2, 4, 6] },
  { name: 'Line 3', idxs: [0, 1, 2] },
  { name: 'Line 4', idxs: [3, 4, 5] },
  { name: 'Line 5', idxs: [6, 7, 8] },
];

// Weighted jackpot tier for a jackpot coin drop.
function weightedJackpot() {
  const r = Math.random();
  if (r < 0.01) return 'ULTRA';
  if (r < 0.06) return 'MAX';
  if (r < 0.20) return 'MID';
  return 'MIN';
}

// Build a 3x3 grid biased by RTP. In free spins the coin drop rates are boosted.
export function spinGrid(rtp = 50, freeSpin = false) {
  const REG = LINE_SYMBOLS.map(s => s.key);
  const rReg = () => REG[Math.floor(Math.random() * REG.length)];
  const grid = Array.from({ length: 9 }, () => rReg());

  // Crown Coin only on reel 2 (cells 1,4,7). Lower chance in free spins so the
  // re-trigger is rare but possible.
  const COIN_CHANCE = freeSpin ? 0.22 : 0.34;
  [1, 4, 7].forEach(i => { if (Math.random() < COIN_CHANCE) grid[i] = 'coin'; });

  // Value Coins + Jackpot Coins drop on reels 1 & 3 (cells 0,2,3,5,6,8).
  const VALUE_CHANCE = freeSpin ? 0.30 : 0.20;
  const JACKPOT_CHANCE = freeSpin ? 0.045 : 0.022;
  [0, 2, 3, 5, 6, 8].forEach(i => {
    if (!isLineKey(grid[i])) return; // don't overwrite a crown coin
    if (Math.random() < JACKPOT_CHANCE) {
      const tier = weightedJackpot();
      grid[i] = { type: 'jackpot', tier, mult: JACKPOT_MULTS[tier] };
    } else if (Math.random() < VALUE_CHANCE) {
      const mult = GOLD_VALUES[Math.floor(Math.random() * GOLD_VALUES.length)];
      grid[i] = { type: 'value', mult };
    }
  });

  // RTP gate on line symbols only.
  const forceLoss = Math.random() * 100 > rtp;
  if (forceLoss) {
    for (let iter = 0; iter < 5; iter++) {
      const { lines } = evaluateGrid(grid);
      if (!lines.length) break;
      for (const ln of lines) {
        const idx = ln.idxs.find(i => isLineKey(grid[i])) ?? ln.idxs[0];
        if (isLineKey(grid[idx])) grid[idx] = rReg();
      }
    }
  } else {
    const { lines } = evaluateGrid(grid);
    if (!lines.length) {
      const cand = PAYLINES.filter(ln => ln.idxs.every(i => isLineKey(grid[i])));
      const ln = cand.length ? cand[Math.floor(Math.random() * cand.length)] : PAYLINES[0];
      const sym = REG[Math.floor(Math.random() * REG.length)];
      ln.idxs.forEach(i => { if (isLineKey(grid[i])) grid[i] = sym; });
    }
  }
  return grid;
}

// Royal Treasury trigger: 3 Crown Coins on reel 2 (full center column).
export function isBonusTrigger(grid) {
  return grid[1] === 'coin' && grid[4] === 'coin' && grid[7] === 'coin';
}

// Evaluate 5 paylines with Wild substitution. Coin cells never form a line.
export function evaluateGrid(grid) {
  const lines = [];
  let totalMul = 0;
  for (const ln of PAYLINES) {
    const cells = ln.idxs.map(i => grid[i]);
    if (cells.some(c => c === 'coin' || isCoinCell(c))) continue;
    const keys = cells;
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
  return { lines, totalMul };
}

// Sum Value + Jackpot coin prizes on the grid (x total bet). Returns the total
// and a list of coin cells for the flying animation.
export function collectCoins(grid, bet) {
  let coinWin = 0;
  const coins = [];
  grid.forEach((c, i) => {
    if (!isCoinCell(c)) return;
    const amt = +(c.mult * bet).toFixed(2);
    coinWin += amt;
    coins.push({ cell: i, type: c.type, mult: c.mult, tier: c.tier, amount: amt });
  });
  return { coinWin: +coinWin.toFixed(2), coins };
}

// Header jackpot badges (mult x total bet).
export const JACKPOTS = [
  { tier: 'MIN', mult: 25, color: '#1a8a25' },
  { tier: 'MID', mult: 50, color: '#1d579b' },
  { tier: 'MAX', mult: 150, color: '#9528aa' },
  { tier: 'ULTRA', mult: 1000, color: '#a11f26' },
];