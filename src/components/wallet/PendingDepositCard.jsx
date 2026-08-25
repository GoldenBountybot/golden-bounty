import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Clock, ArrowRight } from 'lucide-react';

// Shows any live unique-amount deposit request the player created, so leaving
// the app (or a webview reload) never makes them fear the payment is lost —
// tapping the card reopens the exact same deposit screen and countdown.
export default function PendingDepositCard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await base44.auth.me().catch(() => null);
        if (!me) return;
        const list = await base44.entities.ManualDepositRequest.filter(
          { user_id: me.id, status: 'pending' }, '-created_date', 10
        );
        if (active) setRows(list.filter(r => new Date(r.expires_at).getTime() > Date.now()));
      } catch { /* ignore */ }
    })();
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => { active = false; clearInterval(iv); };
  }, []);

  const resume = (r) => {
    try {
      sessionStorage.setItem(`gb_mdr_${r.method}_${r.network_label}`, JSON.stringify({
        id: r.id, pay_amount: r.pay_amount, coin: r.coin, decimals: r.decimals,
        address: r.address, expires_at: r.expires_at, amount_usd: r.amount_usd,
      }));
      sessionStorage.setItem('gb_pay_view', r.method);
      sessionStorage.setItem('gb_pay_net', JSON.stringify({
        name: r.network_label, address: r.address, network: r.network_key,
        symbol: r.coin === 'USDC' ? '$' : '₮', color: '#26a17b',
      }));
    } catch { /* private mode */ }
    navigate(`/pay?amount=${encodeURIComponent(r.amount_usd)}`);
  };

  const live = rows.filter(r => new Date(r.expires_at).getTime() > now);
  if (!live.length) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {live.map(r => {
        const ms = new Date(r.expires_at).getTime() - now;
        const mm = String(Math.floor(ms / 60000)).padStart(2, '0');
        const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
        return (
          <button key={r.id} onClick={() => resume(r)}
            className="dash-card p-4 flex items-center gap-3 text-left transition-all active:scale-[0.98]"
            style={{ border: '1px solid rgba(251,146,60,0.45)', background: 'linear-gradient(135deg, rgba(251,146,60,0.10), rgba(255,255,255,0.03))' }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{ background: 'rgba(251,146,60,0.14)', border: '1px solid rgba(251,146,60,0.35)' }}>
              <Clock className="w-4 h-4" style={{ color: '#fb923c' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: '#fff' }}>
                {t('Pending deposit')} · ${Number(r.amount_usd).toFixed(2)}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {t('Send exactly')} {r.pay_amount} {r.coin} · {r.network_label}
              </p>
              <p className="text-[11px] font-bold tabular-nums" style={{ color: '#fb923c' }}>{mm}:{ss} {t('left')}</p>
            </div>
            <ArrowRight className="w-5 h-5 shrink-0" style={{ color: '#D4AF37' }} />
          </button>
        );
      })}
    </div>
  );
}