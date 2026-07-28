import React, { useState, useRef, useEffect } from 'react';
import { Bell, Gift, CheckCircle2, ArrowDownToLine, ArrowUpFromLine, Megaphone } from 'lucide-react';
import { useNotifications } from '@/lib/useNotifications';

const TYPE_META = {
  bonus_arrived: { icon: Gift, color: '#f5c542' },
  bonus_claimed: { icon: CheckCircle2, color: '#7bd88f' },
  deposit_approved: { icon: ArrowDownToLine, color: '#7bd88f' },
  withdraw_approved: { icon: ArrowUpFromLine, color: '#f0a050' },
  system: { icon: Megaphone, color: '#c5a059' },
};

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Bell icon with a red unread dot. Opens a dropdown listing the user's
// notifications (bonus arrived/claimed, deposit/withdraw approval, admin
// notices). Opening the panel marks everything read.
export default function NotificationBell() {
  const { items, unreadCount, markAllRead, reload } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) { markAllRead(); reload(); }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        title="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
        style={{ border: '1px solid rgba(214,178,98,0.45)', background: 'rgba(20,17,13,0.6)' }}
      >
        <Bell className="w-4 h-4 text-amber-300" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black animate-pulse"
            style={{ background: '#e63946', color: '#fff', boxShadow: '0 0 0 1.5px #0b0b0d' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 w-80 max-w-[86vw] rounded-xl overflow-hidden"
          style={{ background: 'rgba(15,12,9,0.97)', border: '1px solid rgba(214,178,98,0.5)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
        >
          <div
            className="px-3 py-2 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(214,178,98,0.25)' }}
          >
            <span className="text-xs font-black italic" style={{ fontFamily: 'Rye, Georgia, serif', color: '#f3e2b3' }}>Notifications</span>
            <span className="text-[10px] text-amber-200/60 italic" style={{ fontFamily: 'Georgia, serif' }}>{items.length} total</span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-3 py-6 text-center text-[11px] text-amber-100/50 italic" style={{ fontFamily: 'Georgia, serif' }}>
                No notifications yet
              </div>
            ) : items.map((n) => {
              const m = TYPE_META[n.type] || TYPE_META.system;
              const Icon = m.icon;
              return (
                <div key={n.id} className="px-3 py-2 flex gap-2.5" style={{ borderBottom: '1px solid rgba(214,178,98,0.12)' }}>
                  <div
                    className="shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${m.color}55` }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold italic" style={{ fontFamily: 'Georgia, serif', color: '#f3e2b3' }}>{n.title}</p>
                    {n.body && (
                      <p className="text-[10px] text-amber-100/65 italic leading-snug" style={{ fontFamily: 'Georgia, serif' }}>{n.body}</p>
                    )}
                    {n.created_date && (
                      <p className="text-[8px] text-amber-100/40 mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>{timeAgo(n.created_date)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}