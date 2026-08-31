import React from 'react';

// Single KPI tile used by the Provider Report — label, big value, optional hint.
export default function ProviderStatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-xl p-4" style={{ border: '1px solid rgba(214,178,98,0.3)', background: 'rgba(20,17,13,0.6)' }}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4 text-amber-300" />}
        <span className="text-[10px] font-bold tracking-wider uppercase text-stone-400">{label}</span>
      </div>
      <p className="text-xl font-black text-amber-100 tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-stone-500 mt-0.5">{hint}</p>}
    </div>
  );
}