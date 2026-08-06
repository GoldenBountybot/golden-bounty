import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/lib/useNotifications';

// Bell icon with a red unread dot. Links to a dedicated notifications page
// instead of opening a dropdown, so each notification shows full details with
// the exact time of the approve / bonus claim event.
export default function NotificationBell() {
  const { unreadCount } = useNotifications();

  return (
    <Link
      to="/notifications"
      title="Notifications"
      className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-95"
      style={{
        border: '1px solid rgba(214,178,98,0.5)',
        background: 'linear-gradient(135deg, rgba(28,25,23,0.92), rgba(10,9,8,0.95))',
        boxShadow: '0 2px 10px rgba(0,0,0,0.6), 0 0 8px rgba(214,178,98,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <Bell className="w-4 h-4 text-amber-400" style={{ filter: 'drop-shadow(0 0 3px rgba(214,178,98,0.5))' }} />
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 0 0 1.5px #0b0b0d, 0 0 8px rgba(239,68,68,0.6)',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}