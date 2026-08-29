import React from 'react';
import { Wallet, Layers, Crown, ArrowLeftRight, Shield } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

// Vertical dropdown list for the Dashboard header menu.
export default function DashboardMenu({ open, tab, onSelectTab, onClose, role }) {
  const { t } = useLanguage();
  if (!open) return null;

  const items = [
    { id: 'wallet', label: t("Wallet"), Icon: Wallet },
    { id: 'stack', label: t("Stack"), Icon: Layers },
    { id: 'vip', label: t("VIP"), Icon: Crown },
    { href: '/swap', label: t("Swap"), Icon: ArrowLeftRight },
    ...(role === 'agent' || role === 'admin' ? [{ href: '/agent', label: t("Agent"), Icon: Shield }] : []),
    ...(role === 'admin' ? [{ href: '/admin', label: t("Admin Panel"), Icon: Shield }] : []),
  ];

  return (
    <div className="max-w-none mx-auto px-4 pb-3" style={{ animation: 'dashFadeIn 200ms ease both' }}>
      <div
        className="flex flex-col rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(16,16,16,0.96)', boxShadow: '0 14px 36px rgba(0,0,0,0.6)' }}
      >
        {items.map((it, i) => {
          const active = it.id && tab === it.id;
          return (
            <button
              key={it.label}
              onClick={() => { if (it.id) { onSelectTab(it.id); onClose(); } else { window.location.href = it.href; } }}
              className="flex items-center gap-2.5 px-4 py-3 text-[13px] font-semibold text-left transition-colors hover:bg-white/[0.06]"
              style={{
                color: active ? '#1a1408' : 'rgba(255,255,255,0.9)',
                background: active ? 'linear-gradient(135deg,#FFD700,#C89B3C)' : 'transparent',
                borderTop: i === 0 ? 'none' : '1px solid rgba(212,175,55,0.14)',
              }}
            >
              <it.Icon className="w-4 h-4 shrink-0" style={{ color: active ? '#1a1408' : 'rgba(212,175,55,0.9)' }} />
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}