import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export const PERIODS = [
  { id: 'daily',    label: 'Daily' },
  { id: 'weekly',   label: 'Weekly' },
  { id: 'monthly',  label: 'Monthly' },
  { id: 'lifetime', label: 'Lifetime' },
];

// Start timestamp (ms) of the selected period; 0 = all time.
export function periodStart(period) {
  const now = new Date();
  if (period === 'daily') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (period === 'weekly') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - d.getDay()); // week starts Sunday
    return d.getTime();
  }
  if (period === 'monthly') return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return 0;
}

export default function PeriodTabs({ value, onChange }) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {PERIODS.map((p) => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className="py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95"
            style={{
              border: active ? '1px solid rgba(212,175,55,0.85)' : '1px solid rgba(212,175,55,0.28)',
              background: active ? 'linear-gradient(135deg,rgba(255,215,0,0.2),rgba(200,155,60,0.08))' : 'rgba(20,17,13,0.6)',
              color: active ? '#f5c542' : 'rgba(255,255,255,0.65)',
              boxShadow: active ? '0 0 14px rgba(212,175,55,0.25)' : 'none',
            }}
          >
            {t(p.label)}
          </button>
        );
      })}
    </div>
  );
}