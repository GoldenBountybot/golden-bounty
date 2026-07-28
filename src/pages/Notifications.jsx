import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Gift, CheckCircle2, ArrowDownToLine, ArrowUpFromLine, Megaphone, ArrowLeft } from 'lucide-react';
import { useNotifications } from '@/lib/useNotifications';
import WesternTitleBadge from '@/components/WesternTitleBadge';
import BackButton from '@/components/BackButton';

const TYPE_META = {
  bonus_arrived: { icon: Gift, color: '#f5c542', label: 'Bonus Arrived' },
  bonus_claimed: { icon: CheckCircle2, color: '#7bd88f', label: 'Bonus Claimed' },
  deposit_approved: { icon: ArrowDownToLine, color: '#7bd88f', label: 'Deposit Approved' },
  withdraw_approved: { icon: ArrowUpFromLine, color: '#f0a050', label: 'Withdraw Approved' },
  system: { icon: Megaphone, color: '#c5a059', label: 'System' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Full date + time string for a notification's creation date.
function fullTime(d) {
  const dt = new Date(d);
  const day = WEEKDAYS[dt.getDay()];
  const date = dt.getDate();
  const mon = dt.toLocaleString('en-US', { month: 'short' });
  const yr = dt.getFullYear();
  let h = dt.getHours();
  const m = String(dt.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${day}, ${date} ${mon} ${yr} · ${h}:${m} ${ap}`;
}

export default function Notifications() {
  const { items, unreadCount, markAllRead, reload, loading } = useNotifications();
  const [filter, setFilter] = useState('all');

  React.useEffect(() => { markAllRead(); reload(); /* eslint-disable-next-line */ }, []);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'bonus', label: 'Bonus' },
    { id: 'deposit', label: 'Deposit' },
    { id: 'withdraw', label: 'Withdraw' },
    { id: 'system', label: 'System' },
  ];

  const matchFilter = (n) => {
    if (filter === 'all') return true;
    if (filter === 'bonus') return n.type === 'bonus_arrived' || n.type === 'bonus_claimed';
    if (filter === 'deposit') return n.type === 'deposit_approved';
    if (filter === 'withdraw') return n.type === 'withdraw_approved';
    return n.type === 'system';
  };

  const shown = items.filter(matchFilter);

  return (
    <div className="min-h-screen pb-24 bg-[#0b0b0d]">
      {/* Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur-xl"
        style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(214,178,98,0.22)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <BackButton to="/" />
          <WesternTitleBadge size="lg">Notifications</WesternTitleBadge>
          <div className="w-8" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-5">
        <p className="text-center text-[11px] text-amber-100/55 italic mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          {items.length} total · {unreadCount} unread
        </p>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-4 py-1.5 rounded-[7px] text-xs font-bold italic whitespace-nowrap transition-colors"
              style={{
                fontFamily: 'Georgia, serif',
                border: filter === f.id ? '1px solid rgba(214,178,98,0.85)' : '1px solid rgba(214,178,98,0.3)',
                background: filter === f.id ? 'linear-gradient(to bottom,#f5c542,#c8881e)' : 'rgba(20,17,13,0.6)',
                color: filter === f.id ? '#2a1a06' : '#e8c878',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {loading ? (
          <div className="text-center py-10 text-[12px] text-amber-100/50 italic" style={{ fontFamily: 'Georgia, serif' }}>
            Loading…
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <Bell className="w-10 h-10 text-amber-200/30" />
            <p className="text-[12px] text-amber-100/50 italic" style={{ fontFamily: 'Georgia, serif' }}>
              No notifications here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {shown.map((n) => {
              const m = TYPE_META[n.type] || TYPE_META.system;
              const Icon = m.icon;
              return (
                <div
                  key={n.id}
                  className="rounded-xl p-3.5 flex gap-3"
                  style={{
                    background: 'rgba(20,17,13,0.6)',
                    border: '1px solid rgba(214,178,98,0.28)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  <div
                    className="shrink-0 mt-0.5 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${m.color}66` }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: m.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[11px] font-black italic" style={{ fontFamily: 'Georgia, serif', color: m.color }}>
                        {m.label}
                      </p>
                      {n.amount > 0 && (
                        <span
                          className="text-[10px] font-black italic px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(245,197,66,0.18)', color: '#f5c542', fontFamily: 'Georgia, serif' }}
                        >
                          ${n.amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] font-bold italic" style={{ fontFamily: 'Georgia, serif', color: '#f3e2b3' }}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-[11px] text-amber-100/65 italic leading-snug mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
                        {n.body}
                      </p>
                    )}
                    {n.created_date && (
                      <p className="text-[9px] text-amber-100/45 mt-1.5 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                        {fullTime(n.created_date)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}