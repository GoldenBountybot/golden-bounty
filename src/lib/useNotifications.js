import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { playNotificationSound } from '@/lib/notificationSound';

// Loads the current user's notifications (own + broadcasts) and tracks the
// unread count via a per-user `notifications_last_read_at` timestamp stored on
// the user record. Any notification newer than that timestamp is "unread" and
// drives the red dot — this works for broadcasts too, since read state is per
// user, not per notification record.
export function useNotifications() {
  const [items, setItems] = useState([]);
  const [lastReadAt, setLastReadAt] = useState(0);
  const [loading, setLoading] = useState(true);
  // Track the newest created_date we've already seen so we only chime for
  // genuinely new arrivals (not the initial load or re-fetched existing ones).
  const seenNewestRef = useRef(0);
  const firstLoadRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const me = await base44.auth.me().catch(() => null);
      const lr = Number(me?.notifications_last_read_at || 0);
      setLastReadAt(isFinite(lr) ? lr : 0);
      const rows = await base44.entities.UserNotification.list('-created_date', 50);
      setItems(rows || []);
      // Detect a newly arrived notification: a row newer than the last seen
      // newest — but only after the very first load completes.
      if (rows && rows.length > 0) {
        const newest = new Date(rows[0].created_date).getTime();
        if (firstLoadRef.current) {
          firstLoadRef.current = false;
          seenNewestRef.current = newest;
        } else if (newest > seenNewestRef.current) {
          seenNewestRef.current = newest;
          playNotificationSound();
        }
      }
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
      unsub = base44.entities.UserNotification.subscribe?.((event) => {
        // Show the new notification INSTANTLY from the realtime payload —
        // no waiting for a refetch round-trip.
        if (event?.type === 'create' && event?.data?.id) {
          setItems((prev) => (prev.some((n) => n.id === event.data.id) ? prev : [event.data, ...prev]));
          if (!firstLoadRef.current) {
            const ts = new Date(event.data.created_date || Date.now()).getTime();
            if (ts > seenNewestRef.current) {
              seenNewestRef.current = ts;
              playNotificationSound();
            }
          }
        }
        load();
      });
    } catch { /* subscribe not available — polling fallback below */ }
    // Light polling fallback so broadcast notifications still arrive timely.
    const t = setInterval(load, 5000);
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