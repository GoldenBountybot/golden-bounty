import React from 'react';
import { Lock } from 'lucide-react';

// Shared 4-digit Pay PIN field used on every withdrawal flow.
export default function PayPinInput({ value, onChange, label = 'Pay Pin' }) {
  return (
    <div className="flex items-center gap-2">
      <Lock className="w-4 h-4 shrink-0" style={{ color: 'rgba(212,175,55,0.8)' }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        inputMode="numeric"
        type="password"
        maxLength={4}
        placeholder={label}
        className="dash-input flex-1 px-3 py-3 text-sm tracking-[0.5em] tabular-nums"
      />
    </div>
  );
}