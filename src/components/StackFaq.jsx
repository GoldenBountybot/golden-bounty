import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

const FAQS = [
  {
    q: 'What do you do with the amount we invest?',
    a: 'The funds invested by our users are allocated to selected investment activities. We evaluate opportunities across international markets and platforms with the aim of generating returns, and a portion of the returns may be distributed to users as daily profits.',
  },
  {
    q: 'How do I earn profits from my investment?',
    a: 'Your profits are calculated according to the investment plan you select. A portion of the returns generated through our investment activities may be distributed to users based on the applicable plan terms.',
  },
  {
    q: 'Will I receive profits every day?',
    a: 'Daily profits may be credited according to the terms of your selected investment plan. Profit rates, duration, and other conditions may vary depending on the plan.',
  },
  {
    q: 'Where do you invest?',
    a: 'We evaluate investment opportunities across selected international markets and platforms according to our investment strategy. The areas and strategies we use may change over time.',
  },
  {
    q: 'How does your platform generate profits?',
    a: 'Our business model aims to generate returns through various investment activities. After considering applicable operating costs and other expenses, a portion of the returns may be distributed to users according to the applicable terms.',
  },
  {
    q: 'Will I earn more if I invest a larger amount?',
    a: 'Potential returns generally depend on your selected investment plan and the amount invested. Each plan has its own applicable terms and conditions.',
  },
  {
    q: 'When will my profits be added to my account?',
    a: 'Profits may be credited to your account according to the schedule specified in your selected investment plan.',
  },
  {
    q: 'Can I withdraw my investment at any time?',
    a: "Withdrawal rules depend on the terms of your selected investment plan. Please review the plan's duration and withdrawal policy before investing.",
  },
  {
    q: 'How are profits calculated?',
    a: 'Profits are calculated according to the investment amount, selected plan, applicable profit rate, and duration of the investment, subject to the plan\'s terms.',
  },
  {
    q: 'Are the profits guaranteed?',
    a: 'No investment can be considered completely risk-free or guaranteed to generate profits. Our objective is to pursue sustainable returns through responsible investment management.',
  },
];

export default function StackFaq() {
  const [open, setOpen] = useState(0);

  return (
    <div className="flex flex-col gap-3" style={{ fontFamily: SANS }}>
      <div className="flex items-center gap-2 px-1">
        <HelpCircle className="w-4 h-4" style={{ color: '#D4AF37' }} />
        <h2 className="text-sm font-bold" style={{ color: '#D4AF37' }}>Frequently Asked Questions (FAQ)</h2>
      </div>

      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className="dash-card overflow-hidden"
            style={{ animation: 'dashFadeIn 400ms ease both' }}
          >
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="flex items-start gap-2.5 min-w-0">
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0 text-[11px] font-extrabold"
                  style={{ background: 'linear-gradient(135deg,#FFD700,#C89B3C)', color: '#1a1408' }}
                >
                  {i + 1}
                </span>
                <span className="text-[13px] font-bold" style={{ color: '#fff' }}>{item.q}</span>
              </span>
              <ChevronDown
                className="w-4 h-4 shrink-0 transition-transform duration-300"
                style={{ color: '#D4AF37', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
            <div
              className="px-4 transition-all duration-300 ease-out"
              style={{
                maxHeight: isOpen ? 300 : 0,
                opacity: isOpen ? 1 : 0,
                overflow: 'hidden',
              }}
            >
              <p className="text-[12px] leading-relaxed pb-4 pl-8.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}