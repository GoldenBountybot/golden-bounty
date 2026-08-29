import { base44 } from '@/api/base44Client';

// Single entry point for every agent-system operation (Supabase edge function).
export async function agentOps(action, payload = {}) {
  try {
    const res = await base44.functions.invoke('agent-ops', { action, ...payload });
    return res?.data || {};
  } catch (e) {
    return { error: e?.data?.error || e?.message || 'failed', ...(e?.data || {}) };
  }
}

const MESSAGES = {
  'user-not-found': 'No user found with that username or ID.',
  'agent-not-found': 'No agent found with that username or ID.',
  'not-an-agent': 'That user is not an agent.',
  'invalid-amount': 'Enter a valid amount.',
  'insufficient-balance': 'Not enough balance.',
  'wager-required': 'Play through your deposit before withdrawing.',
  'same-user': "You can't send funds to yourself.",
  'banned': 'This account is blocked.',
  'below-minimum': 'Amount is below the minimum withdrawal.',
  'forbidden': 'You are not allowed to do this.',
  'cannot-change-admin': "An admin's role can't be changed.",
};

export function agentError(res) {
  const code = res?.error || '';
  let msg = MESSAGES[code] || code || 'Something went wrong.';
  if (code === 'insufficient-balance' && res.balance != null) msg += ` Available: $${Number(res.balance).toFixed(2)}.`;
  if (code === 'wager-required' && res.withdrawable != null) msg += ` Withdrawable now: $${Number(res.withdrawable).toFixed(2)}.`;
  if (code === 'below-minimum' && res.min != null) msg = `Minimum withdrawal is $${Number(res.min).toFixed(2)}.`;
  return msg;
}