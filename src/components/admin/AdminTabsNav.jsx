import React from 'react';

// Professional admin navigation: a horizontally scrollable pill bar with a
// clear active state, grouped by section label.
export default function AdminTabsNav({ tabs, active, onChange }) {
  const groups = [...new Set(tabs.map((t) => t.group || 'General'))];

  return (
    <nav className="flex flex-col gap-3">
      {groups.map((gr) => (
        <div key={gr} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-0.5">
            <span className="text-[9px] font-bold uppercase tracking-[0.28em]" style={{ color: 'rgba(232,200,120,0.6)' }}>{gr}</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(214,178,98,0.28), transparent)' }} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {tabs.filter((t) => (t.group || 'General') === gr).map((t) => {
              const Icon = t.icon;
              const on = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onChange(t.id)}
                  className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl shrink-0 whitespace-nowrap transition-all active:scale-95"
                  style={{
                    border: on ? '1px solid rgba(245,197,66,0.85)' : '1px solid rgba(214,178,98,0.22)',
                    background: on ? 'linear-gradient(135deg,#f5c542,#c8881e)' : 'rgba(255,255,255,0.03)',
                    color: on ? '#2a1a06' : '#e8c878',
                    boxShadow: on ? '0 6px 18px rgba(200,136,30,0.35)' : 'none',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}