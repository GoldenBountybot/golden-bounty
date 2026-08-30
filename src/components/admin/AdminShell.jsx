import React from 'react';

// Professional container used to frame every admin section's content:
// a titled glass panel with a subtle gold header rule.
export default function AdminShell({ title, description, icon: Icon, children }) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        borderRadius: 18,
        border: '1px solid rgba(214,178,98,0.24)',
        background: 'linear-gradient(180deg, rgba(24,20,14,0.9), rgba(13,12,10,0.92))',
        boxShadow: '0 14px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <header
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(214,178,98,0.18)', background: 'rgba(214,178,98,0.05)' }}
      >
        {Icon && (
          <span
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#f5c542,#c8881e)', boxShadow: '0 0 14px rgba(214,178,98,0.35)' }}
          >
            <Icon className="w-4 h-4" style={{ color: '#2a1a06' }} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-extrabold tracking-tight truncate" style={{ color: '#f0d79a', fontFamily: 'Georgia, serif' }}>{title}</h2>
          {description && <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{description}</p>}
        </div>
      </header>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}