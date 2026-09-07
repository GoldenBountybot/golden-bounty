import { useUserBonus } from '@/lib/useUserBonus';

// Withdrawals are blocked while an active deposit bonus still has turnover
// (wagering) left to complete.
export function useBonusWagerLock() {
  const { bonus, loading } = useUserBonus();
  const required = Number(bonus?.required_turnover) || 0;
  const completed = Number(bonus?.completed_turnover) || 0;
  const remaining = Math.max(0, required - completed);
  return {
    loading,
    locked: !!bonus && bonus.status === 'active' && remaining > 0,
    required,
    completed,
    remaining,
  };
}