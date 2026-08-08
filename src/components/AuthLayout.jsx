import React from "react";

// Minimal premium auth shell — dark canvas, sharp golden-frame card.
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b0d] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-[12px] mb-4"
            style={{
              border: '1px solid rgba(214,178,98,0.6)',
              background: 'linear-gradient(to bottom,#f5c542,#c8881e)',
              boxShadow: 'inset 0 1px 0 rgba(255,240,200,0.5), 0 6px 18px rgba(200,136,30,0.35)',
            }}
          >
            <Icon className="w-7 h-7 text-stone-950" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-black italic tracking-tight text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>{title}</h1>
          {subtitle && <p className="text-amber-100/55 text-sm mt-2">{subtitle}</p>}
        </div>
        <div
          className="rounded-[10px] p-6 sm:p-8"
          style={{
            border: '1px solid rgba(214,178,98,0.4)',
            background: 'rgba(20,18,15,0.6)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: 'inset 0 1px 0 rgba(255,240,200,0.12), 0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          {children}
        </div>
        {footer && (
          <div className="text-center text-sm text-amber-100/55 mt-6">{footer}</div>
        )}
      </div>
    </div>
  );
}