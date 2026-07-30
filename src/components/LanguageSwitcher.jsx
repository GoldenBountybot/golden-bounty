import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { LANGUAGES } from '@/lib/i18n';

// Compact language dropdown — shows the current language's native name with
// a globe icon. Used on the signup page and inside the profile menu.
export default function LanguageSwitcher({ variant = 'default' }) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isAuth = variant === 'auth';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={isAuth
          ? "w-full h-9 flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors"
          : "w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"}
        style={isAuth
          ? { border: '1px solid rgba(214,178,98,0.45)', background: 'rgba(20,17,13,0.6)', color: '#e8c878' }
          : { border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(255,255,255,0.03)', color: '#D4AF37' }
        }
      >
        <span className="flex items-center gap-2">
          <Globe className={isAuth ? 'w-4 h-4' : 'w-4 h-4'} />
          <span className="text-lg leading-none">{current.flag}</span>
          <span>{current.native}</span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-xl overflow-hidden max-h-72 overflow-y-auto"
          style={{
            border: '1px solid rgba(212,175,55,0.4)',
            background: 'rgba(13,13,13,0.97)',
            boxShadow: '0 14px 40px rgba(0,0,0,0.7)',
            animation: 'dashFadeIn 200ms ease both',
          }}
        >
          {LANGUAGES.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                style={{
                  color: active ? '#D4AF37' : 'rgba(255,255,255,0.85)',
                  borderBottom: '1px solid rgba(212,175,55,0.12)',
                }}
              >
                <span className="text-lg leading-none">{l.flag}</span>
                <span className="flex-1 text-left">
                  <span className="font-bold">{l.native}</span>
                  <span className="ml-2 text-[11px] opacity-60">{l.name}</span>
                </span>
                {active && <Check className="w-4 h-4" style={{ color: '#D4AF37' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}