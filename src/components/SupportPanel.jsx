import React from 'react';

const CHANNELS = [
  {
    label: 'WhatsApp',
    href: 'https://wa.me/966576757138',
    img: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
  },
  {
    label: 'Telegram',
    href: 'https://t.me/golden_bounty_tg',
    img: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg',
  },
  {
    label: 'Email',
    href: 'mailto:goldenbountysupport@gmail.com',
    img: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
  },
];

export default function SupportPanel() {
  return (
    <div className="flex items-center justify-center gap-5" style={{ animation: 'dashFadeIn 400ms ease both' }}>
      {CHANNELS.map((c) => (
        <a
          key={c.label}
          href={c.href}
          target="_blank"
          rel="noopener noreferrer"
          title={c.label}
          className="transition-transform active:scale-90 hover:scale-105"
          style={{ width: 30, height: 30 }}
        >
          <img
            src={c.img}
            alt={c.label}
            className="w-full h-full object-contain"
            style={{ borderRadius: 8 }}
          />
        </a>
      ))}
    </div>
  );
}