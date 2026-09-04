// A synchronous key identifying WHICH account the app is showing right now.
//
// Inside Telegram, several accounts can share the same client. When the user
// switches account, the stored Supabase session still belongs to the PREVIOUS
// account for a moment (re-auth with the new initData happens right after) —
// so keying cached data by the Supabase user id let the old account's details
// show for a few seconds. Telegram's own user id from the WebApp bridge is
// correct instantly, so it takes priority; outside Telegram we fall back to
// the Supabase session id.
import { tgUserId } from '@/lib/telegram';
import { getCurrentUserIdSync } from '@/lib/currentUserId';

export function getAccountKey() {
  const tg = tgUserId();
  if (tg) return 'tg:' + tg;
  const id = getCurrentUserIdSync();
  return id ? 'sb:' + id : null;
}