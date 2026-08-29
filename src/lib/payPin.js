import { base44 } from '@/api/base44Client';

// 4-digit withdrawal (Pay) PIN stored on the user record.
export async function getPayPin() {
  const me = await base44.auth.me().catch(() => null);
  return me?.pay_pin || '';
}

export async function savePayPin(pin) {
  await base44.auth.updateMe({ pay_pin: String(pin) });
}

// Returns 'ok' | 'not_set' | 'invalid'
export async function verifyPayPin(pin) {
  const stored = await getPayPin();
  if (!stored) return 'not_set';
  return String(pin) === stored ? 'ok' : 'invalid';
}