import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '@/lib/useNotifications';

// Facebook/Telegram-style incoming-notification popups: when a new
// notification arrives, a toast slides in from the top, holds a few seconds,
// then slides back up. Multiple new ones stack. Tapping it opens the
// notifications page. The initial load does NOT trigger toasts — only
// genuinely new arrivals after the app is open do.
const HOLD_MS = 1500;

export default function NotificationToaster() {
  const { items } = useNotifications();
  const [toasts, setToasts] = useState([]);
  const seenRef = useRef(new Set());
  const firstRunRef = useRef(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!items || items.length === 0) return;
    if (firstRunRef.current) {
      // Seed seen set on first load so existing notifications don't toast.
      items.forEach((n) => seenRef.current.add(n.id));
      firstRunRef.current = false;
      return;
    }
    const fresh = items.filter((n) => !seenRef.current.has(n.id));
    if (fresh.length === 0) return;
    fresh.forEach((n) => seenRef.current.add(n.id));
    const newToasts = fresh.map((n) => ({
      id: n.id,
      title: n.title || 'Notification',
      body: n.body || '',
      amount: Number(n.amount) || 0,
      link: n.link || '/notifications',
    }));
    // Show only the LATEST notification — replace any current toast so
    // toasts never stack downward. Each one appears at the top and
    // disappears from the same spot.
    setToasts(newToasts.slice(-1));
  }, [items]);

  // Auto-dismiss each toast after HOLD_MS.
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => dismiss(t.id), HOLD_MS)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toasts]);

  const dismiss = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const open = (t) => {
    dismiss(t.id);
    const link = t.link || '/notifications';
    if (/^https?:\/\//.test(link)) window.open(link, '_blank');
    else navigate(link);
  };

  return (
    <div
      className="fixed top-0 inset-x-0 z-[120] flex flex-col items-center px-3 pointer-events-none"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 88px)' }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto w-full max-w-md cursor-pointer"
          style={{
            animation: `notifyLife ${HOLD_MS}ms cubic-bezier(0.16, 1, 0.3, 1) both`,
            willChange: 'transform, opacity',
          }}
          onClick={() => open(t)}
        >
          <div
            className="rounded-xl px-3.5 py-2.5 flex items-start gap-2.5"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,225,150,0.08) 100%)',
              border: '1px solid rgba(245,210,120,0.5)',
              boxShadow: '0 8px 28px rgba(0,0,0,0.35), 0 0 18px rgba(255,200,90,0.18), inset 0 1px 0 rgba(255,255,255,0.28)',
              backdropFilter: 'blur(16px) saturate(160%)',
              WebkitBackdropFilter: 'blur(16px) saturate(160%)',
            }}
          >
            <span
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full"
              style={{ background: 'radial-gradient(circle at 35% 30%, #ffe9a8, #c8881e)', boxShadow: '0 0 10px rgba(255,210,90,0.7)' }}
            >
              <Bell className="w-4 h-4 text-stone-900" strokeWidth={2.5} />
            </span>
            <div className="flex-1 min-w-0 text-left">
              <p
                className="text-white font-black italic leading-tight tracking-wide"
                style={{ fontFamily: 'Rye, Georgia, serif', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
              >
                {t.title}
              </p>
              {t.body && (
                <p className="text-white/80 text-[11px] italic leading-tight mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
                  {t.body}
                </p>
              )}
              {t.amount > 0 && (
                <p className="mt-0.5 text-[12px] font-black tabular-nums" style={{ color: '#f5d77a' }}>
                  +${t.amount.toFixed(2)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
              className="shrink-0 -mr-1 -mt-1 w-6 h-6 rounded-full flex items-center justify-center text-white/60 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}