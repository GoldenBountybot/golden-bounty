import React, { useState, useEffect } from 'react';
import { X, Lock, Coins, Unlock, History } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { formatDateTime } from '@/lib/dateFormat';

const KIND_META = {
  stack_lock:   { icon: Lock,   color: '#D4AF37', label: 'Stacked',        sign: '' },
  stack_claim:  { icon: Coins,  color: '#34d399', label: 'Profit Claimed', sign: '+' },
  stack_unlock: { icon: Unlock, color: '#60a5fa', label: 'Unlocked',       sign: '+' },
};

// Full stack history (locks, profit claims with time, unlocks) in a modal.
export default function StackHistoryModal({ open, onClose }) {
  const { t } = useLanguage();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const me = await base44.auth.me();
        const list = await base44.entities.Transaction.filter({ user_id: me.id, method: 'stack' }, '-created_date', 100);
        if (alive) setRows(list || []);
      } catch { if (alive) setRows([]); }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full sm:max-w-md max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden" style={{ background: '#121212', border: '1px solid rgba(212,175,55,0.35)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(212,175,55,0.22)' }}>
          <History className="w-4 h-4" style={{ color: '#D4AF37' }} />
          <h2 className="flex-1 text-sm font-bold" style={{ color: '#D4AF37' }}>{t("Stack History")}</h2>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-lg active:scale-95" style={{ border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {loading ? (
            <p className="text-[12px] text-center py-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{t("Loading...")}</p>
          ) : rows.length === 0 ? (
            <p className="text-[12px] text-center py-6" style={{ color: 'rgba(255,255,255,0.5)' }}>{t("No stack history yet.")}</p>
          ) : rows.map(r => {
            const m = KIND_META[r.note] || KIND_META.stack_claim;
            const Icon = m.icon;
            return (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.16)' }}>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: `${m.color}22`, border: `1px solid ${m.color}55` }}>
                  <Icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold" style={{ color: '#fff' }}>{t(m.label)}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {formatDateTime(r.created_date, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: m.color }}>
                  {m.sign}${Number(r.amount).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}