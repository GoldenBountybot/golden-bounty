import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Loads the current user's notifications (own + broadcasts) and tracks the
// unread count via a per-user `notifications_last_read_at` timestamp stored on
// the user record. Any notification newer than that timestamp is "unread" and
// drives the red dot — this works for broadcasts too, since read state is per
// user, not per notification record.
export function useNotifications() {
  const [items, setItems] = useState([]);
  const [lastReadAt, setLastReadAt] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const me = await base44.auth.me().catch(() => null);
      const lr = Number(me?.notifications_last_read_at || 0);
      setLastReadAt(isFinite(lr) ? lr : 0);
      const rows = await base44.entities.UserNotification.list('-created_date', 50);
      setItems(rows || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Real-time: refresh whenever a notification is created/updated.
    let unsub = null;
    try {
      unsub = base44.entities.UserNotification.subscribe?.(() => { load(); });
    } catch { /* subscribe not available — polling fallback below */ }
    // Light polling fallback so broadcast notifications still arrive timely.
    const t = setInterval(load, 20000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      if (typeof unsub === 'function') unsub();
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  const unreadCount = items.filter(
    (n) => new Date(n.created_date).getTime() > lastReadAt
  ).length;

  const markAllRead = useCallback(async () => {
    const ts = Date.now();
    setLastReadAt(ts);
    try { await base44.auth.updateMe({ notifications_last_read_at: ts }); } catch { /* ignore */ }
  }, []);

  return { items, unreadCount, loading, markAllRead, reload: load };
}