import React from 'react';

import LiveSupportChat from '@/components/LiveSupportChat';
import BackButton from '@/components/BackButton';
import SupportPanel from '@/components/SupportPanel';
import { useLanguage } from '@/lib/LanguageContext';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

export default function LiveSupport() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col h-screen" style={{ background: 'radial-gradient(circle at 50% 0%, #1a1408 0%, #0a0908 60%)', fontFamily: SANS }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur-xl shrink-0"
        style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div className="max-w-md lg:max-w-5xl mx-auto w-full flex items-center justify-between px-4 py-3">
          <BackButton href="/profile" label={t('Back')} />
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 10px rgba(99,102,241,0.3)' }}>
              <img src="https://media.base44.com/images/public/6a5698edffaa42a5b6637776/89345e410_file_00000000f5f88207ba2a1422c54f7ec0.png" alt="Bounty Bot" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-base font-bold" style={{ color: '#D4AF37', fontFamily: 'Georgia, serif' }}>{t('Live Support')}</h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Quick support channels — WhatsApp / Telegram / Email */}
      <div className="shrink-0 max-w-md lg:max-w-5xl w-full mx-auto px-4 pt-3">
        <SupportPanel />
      </div>

      {/* Chat body — fills the rest of the viewport up to the header */}
      <main className="flex-1 min-h-0 max-w-md lg:max-w-5xl w-full mx-auto px-4 pt-4 pb-[calc(88px+env(safe-area-inset-bottom))] lg:pb-4">
        <LiveSupportChat />
      </main>
    </div>
  );
}