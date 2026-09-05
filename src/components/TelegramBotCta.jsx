import React from 'react';
import { Send } from 'lucide-react';
import { isInsideTelegram } from '@/lib/telegram';
import { isStandaloneApp } from '@/lib/isStandaloneApp';

const BOT_URL = 'https://t.me/GoldenBountybot';

// Prominent "Play on Telegram" call-to-action for web visitors arriving from
// search engines. Hidden for players already inside the Telegram mini app or
// the installed app — they are already in, so the button would be noise.
export default function TelegramBotCta() {
  if (isInsideTelegram() || isStandaloneApp()) return null;

  return (
    <section className="relative z-10 max-w-none mx-auto px-4 lg:px-6 pb-3">
      <a
        href={BOT_URL}
        target="_blank"
        rel="noopener"
        className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl transition-transform active:scale-[0.98]"
        style={{
          border: '1px solid rgba(214,178,98,0.7)',
          background: 'linear-gradient(to bottom,#f5c542,#c8881e)',
          boxShadow: '0 8px 26px rgba(0,0,0,0.55), 0 0 18px rgba(214,178,98,0.25)',
        }}
      >
        <Send className="w-5 h-5" style={{ color: '#2a1a06' }} />
        <span
          className="text-base font-black italic"
          style={{ fontFamily: 'Rye, Georgia, serif', color: '#2a1a06' }}
        >
          Play Golden Bounty on Telegram
        </span>
      </a>
    </section>
  );
}