// Crown Coins slot engine — 3x3 grid, 5 fixed paylines, 10 glossy 3D symbols.
// Crown Coin (scatter/bonus) triggers the Royal Treasury hold-and-win round.

const IMG = {
  cherry: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/385620fcf_generated_image.png',
  seven: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/a521e45ad_generated_image.png',
  lemon: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f325764b6_generated_image.png',
  plum: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e7a71f6c6_generated_image.png',
  watermelon: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/318de057b_generated_image.png',
  orange: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9f2d1a373_generated_image.png',
  bell: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/2b0f3d600_generated_image.png',
  bar: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/54eb8919d_generated_image.png',
  grape: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/bc6b40d49_generated_image.png',
  coin: 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/9abc913fd_generated_image.png',
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
  const strip = ['cherry','cherry','lemon','lemon','orange','orange','plum','watermelon','grape','bell','bar','seven','coin','cherry','lemon','orange','plum','watermelon','grape','bell','coin'];
  const pick = () => strip[Math.floor(Math.random() * strip.length)];
  const grid = Array.from({ length: 9 }, () => pick());

  // RTP gate: with probability (1 - rtp/100) force a losing board by
  // making sure no line completes 3-of-a-kind.
  const forceLoss = Math.random() * 100 > rtp;
  if (forceLoss) {
    // nudge one symbol on each winning line so it no longer matches
    for (let iter = 0; iter < 4; iter++) {
      const { lines } = evaluateGrid(grid);
      if (!lines.length) break;
      for (const ln of lines) {
        // replace the last cell of the line with a different low symbol
        const last = ln.idxs[ln.idxs.length - 1];
        const alt = ['cherry','lemon','orange'][Math.floor(Math.random() * 3)];
        if (grid[last] !== alt) grid[last] = alt;
      }
    }
  }
  return grid;
}

export function evaluateGrid(grid) {
  const betPerLine = 1; // caller scales by bet/5
  const lines = [];
  let totalMul = 0;
  for (const ln of PAYLINES) {
    const keys = ln.idxs.map(i => grid[i]);
    if (keys[0] === keys[1] && keys[1] === keys[2] && keys[0] !== 'coin') {
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

// Royal Treasury hold-and-win: 9 cells, tap to reveal coin values. Reel-3
// (last 3 cells) has the royal jackpot coins. Royal = all reels filled.
export function runBonus(bet, rtp = 50) {
  const lowVals = [0.5, 1, 1.5, 2, 2.5, 3];
  const midVals = [3, 4, 5, 6, 7];
  const royalVals = [7.5, 12, 20, 50]; // includes ULTRA jackpot
  const r = () => Math.random();
  const cells = [];
  for (let i = 0; i < 9; i++) {
    if (i < 6) cells.push(lowVals[Math.floor(r() * lowVals.length)] * (rtp / 50));
    else cells.push(midVals[Math.floor(r() * midVals.length)] * (rtp / 50));
  }
  // randomly upgrade one cell to a royal jackpot
  if (r() < 0.35 + rtp / 250) {
    cells[6 + Math.floor(r() * 3)] = royalVals[Math.floor(r() * royalVals.length)];
  }
  // guarantee at least a small payout floor
  cells[0] = Math.max(cells[0], 0.5);
  const total = cells.reduce((a, b) => a + b, 0);
  const royal = cells.slice(6).some(v => v >= 7.5);
  return { cells, total: +total.toFixed(2), royal };
}

export const JACKPOTS = [
  { tier: 'MIN', amount: 1.25, color: '#1a8a25' },
  { tier: 'MID', amount: 2.5, color: '#1d579b' },
  { tier: 'MAX', amount: 7.5, color: '#9528aa' },
  { tier: 'ULTRA', amount: 50.0, color: '#a11f26' },
];