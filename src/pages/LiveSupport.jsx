import React from 'react';
import { Headphones } from 'lucide-react';
import LiveSupportChat from '@/components/LiveSupportChat';
import BackButton from '@/components/BackButton';
import { useLanguage } from '@/lib/LanguageContext';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

export default function LiveSupport() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(circle at 50% 0%, #1a1408 0%, #0a0908 60%)', fontFamily: SANS }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur-xl"
        style={{ background: 'rgba(10,9,8,0.78)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <BackButton href="/profile" label={t('Back')} />
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full"
              style={{ background: 'linear-gradient(135deg, #FFD700, #C89B3C)', boxShadow: '0 0 10px rgba(212,175,55,0.3)' }}>
              <Headphones className="w-4 h-4" style={{ color: '#1a1408' }} />
            </div>
            <h1 className="text-base font-bold" style={{ color: '#D4AF37', fontFamily: 'Georgia, serif' }}>{t('Live Support')}</h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Chat body */}
      <main className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto px-4 py-6">
        <LiveSupportChat />
      </main>
    </div>
  );
}