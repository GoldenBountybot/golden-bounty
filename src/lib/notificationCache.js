// Preloads the current account's notifications at app entry so the bell count
// and the Notifications page paint instantly — no spinner, no late pop-in.
import { base44 } from '@/api/base44Client';
import { getAccountKey } from '@/lib/accountKey';

const KEY = 'gb_notif_cache_v1';

export function getNotificationCache() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY));
    const current = getAccountKey();
    // Only trust data that belongs to the account open right now.
    if (c?.account_key && current && c.account_key === current) return c;
  } catch { /* ignore */ }
  return null;
}

export async function warmNotificationCache() {
  try {
    const me = await base44.auth.me();
    const items = await base44.entities.UserNotification.list('-created_date', 50);
    const lastReadAt = Number(me?.notifications_last_read_at || 0) || 0;
    localStorage.setItem(KEY, JSON.stringify({
      account_key: getAccountKey(),
      items: items || [],
      lastReadAt,
    }));
  } catch { /* not logged in — nothing to warm */ }
}