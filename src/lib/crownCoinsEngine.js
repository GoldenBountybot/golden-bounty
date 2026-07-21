// Crown Coins slot engine — 3x3 grid, 5 fixed paylines, 10 glossy 3D symbols.
// Crown Coin (scatter/bonus) triggers the Royal Treasury hold-and-win round.

// Bonus coin assets — blank value coin (text overlaid dynamically) + 4 jackpot coins.
export const VALUE_COIN_IMG = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/09f3a23e1_generated_image.png';

// Value coins — reel symbols that fly to the Crown Coins banner with a sound.
// Purely visual; do NOT add to balance. Dollar value = mult × bet.
export const VALUE_COIN_MULTS = [1, 3, 5, 7, 10, 15, 20];
export const VALUE_COIN_KEYS = VALUE_COIN_MULTS.map(m => 'vc' + m);
export function isValueCoin(key) { return typeof key === 'string' && key.startsWith('vc'); }
export function valueCoinMult(key) { return Number(String(key).slice(2)) || 0; }
// True for a Royal Treasury bonus cell that upgraded to a fixed jackpot coin.
// Accepts a bonus cell object ({ type: 'jackpot', tier }) — kept for legacy imports.
export function isJackpotCoin(cell) {
  return !!cell && cell.type === 'jackpot';
}
// Fixed dollar amount for a jackpot tier — kept for legacy imports.
export function jackpotMult(tier) {
  const j = JACKPOTS.find(x => x.tier === tier);
  return j ? j.amount : 0;
}
export const JACKPOT_COINS = {
  MIN: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f672115c5_generated_image.png',
  MID: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/462282802_generated_image.png',
  MAX: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/d95929e49_generated_image.png',
  ULTRA: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/681750740_generated_image.png',
};
// Display value for a bonus cell in dollars. (JACKPOTS defined below.)
export function cellValue(cell, bet) {
  if (cell.type === 'jackpot') {
    const j = JACKPOTS.find(x => x.tier === cell.tier);
    return j ? j.amount : 0;
  }
  return cell.mult * bet;
}

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

export const SYMBOLS = [
  { key: 'cherry',     image: IMG.cherry,     pay: 4,  name: 'Cherries' },
  { key: 'lemon',      image: IMG.lemon,      pay: 6,  name: 'Lemons' },
  { key: 'orange',     image: IMG.orange,     pay: 8,  name: 'Oranges' },
  { key: 'plum',       image: IMG.plum,       pay: 10, name: 'Plums' },
  { key: 'watermelon', image: IMG.watermelon, pay: 15, name: 'Watermelon' },
  { key: 'grape',      image: IMG.grape,      pay: 20, name: 'Grapes' },
  { key: 'bell',       image: IMG.bell,       pay: 30, name: 'Bell' },
  { key: 'bar',        image: IMG.bar,        pay: 40, name: 'BAR' },
  { key: 'seven',      image: IMG.seven,      pay: 50, name: 'Lucky 7' },
  { key: 'coin',       image: IMG.coin,       pay: 0,  bonus: true, scatter: 2, name: 'Crown Coin' },
];

const SYMBOL_MAP = Object.fromEntries(SYMBOLS.map(s => [s.key, s]));
export const symbolByKey = (k) => SYMBOL_MAP[k];

// 5 fixed paylines over a 3x3 grid (indices 0..8, row-major).
export const PAYLINES = [
  { name: 'Line 1', idxs: [0, 4, 8] }, // top-left -> center -> bottom-right
  { name: 'Line 2', idxs: [2, 4, 6] }, // top-right -> center -> bottom-left
  { name: 'Line 3', idxs: [0, 1, 2] }, // top row
  { name: 'Line 4', idxs: [3, 4, 5] }, // middle row
  { name: 'Line 5', idxs: [6, 7, 8] }, // bottom row
];

// Build a biased 3x3 grid for the given RTP (0-100). Higher-value symbols
// appear less often; the RTP gates wins so losing spins are common.
export function spinGrid(rtp = 50) {
  // weighted reel strips — low symbols land more often
  const strip = ['cherry','cherry','lemon','lemon','orange','orange','plum','watermelon','grape','bell','bar','seven','coin','cherry','lemon','orange','plum','watermelon','grape','bell','coin','vc1','vc5','vc20','vc3','vc15'];
  const pick = () => strip[Math.floor(Math.random() * strip.length)];
  const grid = Array.from({ length: 9 }, () => pick());

  // Crown Coin falls with 20% chance, only in the center cell (single coin).
  // Any coin that landed elsewhere is replaced with a regular symbol.
  const REG = ['cherry', 'lemon', 'orange', 'plum', 'watermelon', 'grape', 'bell', 'bar', 'seven'];
  const rReg = () => REG[Math.floor(Math.random() * REG.length)];
  if (Math.random() < 0.05) {
    grid[4] = 'coin';
  } else {
    grid[4] = rReg();
  }
  [0, 1, 2, 3, 5, 6, 7, 8].forEach(i => { if (grid[i] === 'coin') grid[i] = rReg(); });

  // Value Coins: 20% chance per column, at most one per column (never
  // overriding a Crown Coin cell).
  [0, 1, 2].forEach(col => {
    const rows = [col, col + 3, col + 6];
    rows.forEach(i => { if (isValueCoin(grid[i])) grid[i] = rReg(); });
    const avail = rows.filter(i => grid[i] !== 'coin');
    // Center column: when the Crown Coin is present, value coin chance drops to 0.05%.
    const chance = (col === 1 && grid[4] === 'coin') ? 0.0005 : 0.10;
    if (Math.random() < chance && avail.length) {
      grid[avail[Math.floor(Math.random() * avail.length)]] = VALUE_COIN_KEYS[Math.floor(Math.random() * VALUE_COIN_KEYS.length)];
    }
  });

  // Free Spin trigger: temporarily 50% chance — Crown Coin in center + a value
  // coin in each side column.
  if (Math.random() < 0.50) {
    grid[4] = 'coin';
    [0, 3, 6].forEach(i => { if (isValueCoin(grid[i])) grid[i] = rReg(); });
    [2, 5, 8].forEach(i => { if (isValueCoin(grid[i])) grid[i] = rReg(); });
    grid[[0, 3, 6][Math.floor(Math.random() * 3)]] = VALUE_COIN_KEYS[Math.floor(Math.random() * VALUE_COIN_KEYS.length)];
    grid[[2, 5, 8][Math.floor(Math.random() * 3)]] = VALUE_COIN_KEYS[Math.floor(Math.random() * VALUE_COIN_KEYS.length)];
  }

  // RTP gate: with probability (1 - rtp/100) force a losing board, otherwise
  // guarantee at least one winning line so the win rate equals rtp/100.
  const forceLoss = Math.random() * 100 > rtp;
  if (forceLoss) {
    for (let iter = 0; iter < 4; iter++) {
      const { lines } = evaluateGrid(grid);
      if (!lines.length) break;
      for (const ln of lines) {
        const last = ln.idxs[ln.idxs.length - 1];
        const alt = ['cherry','lemon','orange'][Math.floor(Math.random() * 3)];
        if (grid[last] !== alt) grid[last] = alt;
      }
    }
  } else {
    const { lines } = evaluateGrid(grid);
    if (!lines.length) {
      // build a winning line of a regular symbol, avoiding Crown Coin / value coin cells
      const candLines = PAYLINES.filter(ln => ln.idxs.every(i => grid[i] !== 'coin' && !isValueCoin(grid[i])));
      const ln = candLines.length ? candLines[Math.floor(Math.random() * candLines.length)] : PAYLINES[Math.floor(Math.random() * PAYLINES.length)];
      const sym = REG[Math.floor(Math.random() * REG.length)];
      ln.idxs.forEach(i => { grid[i] = sym; });
    }
  }
  return grid;
}

// Free spin trigger: Crown Coin in center + a value coin in each side column.
export function isFreeSpinTrigger(grid) {
  if (grid[4] !== 'coin') return false;
  const col0 = [0, 3, 6].some(i => isValueCoin(grid[i]));
  const col2 = [2, 5, 8].some(i => isValueCoin(grid[i]));
  return col0 && col2;
}

// Free spin accumulation: value coins that land stick across spins; remaining
// cells keep spinning regular symbols. `stuck` is a 9-array (null or value-coin
// key). Each column has a chance per spin to drop one new value coin in an
// empty cell of that column. Returns { grid, stuck }.
const FREE_COIN_CHANCE = 0.15; // per column per spin — 15% chance a value coin drops
export function spinFreeAccum(stuck) {
  const REG = ['cherry', 'lemon', 'orange', 'plum', 'watermelon', 'grape', 'bell', 'bar', 'seven'];
  const rReg = () => REG[Math.floor(Math.random() * REG.length)];
  const newStuck = [...stuck];
  const grid = Array.from({ length: 9 }, () => rReg());
  newStuck.forEach((k, i) => { if (k) grid[i] = k; });
  let dropped = 0;
  [0, 1, 2].forEach(col => {
    const rows = [col, col + 3, col + 6];
    const empty = rows.filter(i => !newStuck[i]);
    if (empty.length && Math.random() < FREE_COIN_CHANCE) {
      const cell = empty[Math.floor(Math.random() * empty.length)];
      const k = VALUE_COIN_KEYS[Math.floor(Math.random() * VALUE_COIN_KEYS.length)];
      newStuck[cell] = k;
      grid[cell] = k;
      dropped += 1;
    }
  });
  return { grid, stuck: newStuck, dropped };
}

// Sum of all stuck value coins in dollars.
export function freeTotal(stuck, bet) {
  return stuck.reduce((a, k) => a + (k ? valueCoinMult(k) * bet : 0), 0);
}

export function evaluateGrid(grid) {
  const betPerLine = 1; // caller scales by bet/5
  const lines = [];
  let totalMul = 0;
  for (const ln of PAYLINES) {
    const keys = ln.idxs.map(i => grid[i]);
    if (keys[0] === keys[1] && keys[1] === keys[2] && keys[0] !== 'coin' && !isValueCoin(keys[0])) {
      const sym = symbolByKey(keys[0]);
      if (sym && sym.pay) {
        lines.push({ ...ln, symbol: keys[0], mul: sym.pay });
        totalMul += sym.pay;
      }
    }
  }
  // scatter coins
  const coins = grid.filter(k => k === 'coin').length;
  let scatterMul = 0;
  if (coins >= 3) scatterMul = symbolByKey('coin').scatter; // 2x total bet
  return { lines, totalMul, coins, scatterMul };
}

// Royal Treasury hold-and-win: 9 cells, tap to reveal coin values.
// First 6 cells = value coins (multipliers of the current bet, so displayed
// dollar values scale with the bet). Last 3 cells (royal reels) may upgrade
// to a fixed MIN/MID/MAX/ULTRA jackpot coin. Royal = a jackpot landed.
const VALUE_MULTS = [1, 3, 5, 7, 10, 15, 20];
const ROYAL_MULT = 20;
const JACKPOT_TIERS = ['MIN', 'MID', 'MAX', 'ULTRA'];

export function runBonus(bet, rtp = 50) {
  const r = () => Math.random();
  const factor = rtp / 50;
  const cells = [];
  for (let i = 0; i < 6; i++) {
    cells.push({ type: 'value', mult: VALUE_MULTS[Math.floor(r() * VALUE_MULTS.length)] * factor });
  }
  for (let i = 6; i < 9; i++) {
    cells.push({ type: 'value', mult: ROYAL_MULT * factor });
  }
  // chance to upgrade a royal cell to a fixed jackpot coin
  if (r() < 0.35 + rtp / 250) {
    const idx = 6 + Math.floor(r() * 3);
    cells[idx] = { type: 'jackpot', tier: JACKPOT_TIERS[Math.floor(r() * JACKPOT_TIERS.length)] };
  }
  // guarantee at least a small payout floor on the first cell
  if (cells[0].type === 'value') cells[0].mult = Math.max(cells[0].mult, 1);
  const total = cells.reduce((a, c) => a + cellValue(c, bet), 0);
  const royal = cells.slice(6).some(c => c.type === 'jackpot');
  return { cells, total: +total.toFixed(2), royal };
}

export const JACKPOTS = [
  { tier: 'MIN', amount: 1.25, color: '#1a8a25' },
  { tier: 'MID', amount: 2.5, color: '#1d579b' },
  { tier: 'MAX', amount: 7.5, color: '#9528aa' },
  { tier: 'ULTRA', amount: 50.0, color: '#a11f26' },
];