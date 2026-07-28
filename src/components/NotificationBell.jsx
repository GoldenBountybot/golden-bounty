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
    </Link>
  );
}