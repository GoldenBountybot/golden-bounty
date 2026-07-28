// Shared bet stepper used by every game.
// Range: $0.10 – $500, step $0.10. The plus / minus controls increment or
// decrement the current bet by exactly $0.10, clamped to the range.
export const MIN_BET = 0.10;
export const MAX_BET = 500;
export const BET_STEP = 0.10;

export const clampBet = (v) => {
  const n = Number(v);
  if (!isFinite(n)) return MIN_BET;
  return Math.max(MIN_BET, Math.min(MAX_BET, Math.round(n * 100) / 100));
};

export const incBet = (v) => clampBet((Number(v) || MIN_BET) + BET_STEP);
export const decBet = (v) => clampBet((Number(v) || MIN_BET) - BET_STEP);