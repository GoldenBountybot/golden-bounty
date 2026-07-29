// VIP level system based on total approved deposits.
// Each tier unlocks a higher daily Stack profit rate.
export const BASE_RATE = 0.025; // below Bronze — regular user

export const VIP_LEVELS = [
  { level: 1, name: 'Bronze',   minDeposit: 100,    rate: 0.03,   color: '#cd7f32' },
  { level: 2, name: 'Silver',   minDeposit: 500,    rate: 0.033,  color: '#c0c0c0' },
  { level: 3, name: 'Gold',     minDeposit: 1000,   rate: 0.036,  color: '#ffd700' },
  { level: 4, name: 'Platinum', minDeposit: 10000, rate: 0.04,   color: '#e5e4e2' },
  { level: 5, name: 'Diamond',  minDeposit: 50000, rate: 0.045,  color: '#b9f2ff' },
];

export function getVipLevel(totalDeposits) {
  let current = null;
  for (const lv of VIP_LEVELS) {
    if (totalDeposits >= lv.minDeposit) current = lv;
  }
  return current;
}

export function getNextVipLevel(totalDeposits) {
  for (const lv of VIP_LEVELS) {
    if (totalDeposits < lv.minDeposit) return lv;
  }
  return null;
}

export function getRateForDeposits(totalDeposits) {
  return getVipLevel(totalDeposits)?.rate ?? BASE_RATE;
}