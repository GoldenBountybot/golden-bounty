import React from 'react';
import { Bot } from 'lucide-react';
import LiveSupportChat from '@/components/LiveSupportChat';
import BackButton from '@/components/BackButton';
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
        <div className="flex items-center justify-between px-4 py-3">
          <BackButton href="/profile" label={t('Back')} />
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 10px rgba(99,102,241,0.3)' }}>
              <Bot className="w-4 h-4" style={{ color: '#fff' }} />
            </div>
            <h1 className="text-base font-bold" style={{ color: '#D4AF37', fontFamily: 'Georgia, serif' }}>{t('Live Support')}</h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Chat body — fills the rest of the viewport up to the header */}
      <main className="flex-1 min-h-0 max-w-2xl w-full mx-auto px-4 py-4 pb-[env(safe-area-inset-bottom)]">
        <LiveSupportChat />
      </main>
    </div>
  );
}