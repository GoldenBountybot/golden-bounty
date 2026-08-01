import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import InfoLayout from '@/components/InfoLayout';

const FAQS = [
  { q: 'How do I create an account?', a: 'Click Register, enter your email, create a password, and verify your email. New players receive 1 Free Spin instantly.' },
  { q: 'Is KYC required for withdrawals?', a: 'No. Golden Bounty does not require KYC for withdrawals.' },
  { q: 'How many games are available?', a: 'We currently offer 12 carefully selected casino games.' },
  { q: 'How does the Free Spin work?', a: 'Every new player gets 1 Free Spin after registration. It can be used on selected games. Wagering requirements apply as stated.' },
  { q: 'How does Staking work?', a: 'Choose a staking plan. You receive daily profit according to the selected plan. Full details (rates, duration, conditions) are shown before you confirm.' },
  { q: 'How long do withdrawals take?', a: 'Withdrawals are processed as quickly as possible after request.' },
  { q: 'Is Golden Bounty licensed?', a: 'Yes. Authorized by BDS INFO S.A. under CONAJZAR Resolution No. 07/2026 (31 January 2026). Certificate issued on 24 April 2026.' },
  { q: 'How can I contact Support?', a: 'Our 24/7 Support team is available through the Platform.' },
  { q: 'Can I set limits?', a: 'Yes. Go to Account Settings → Responsible Gaming to set deposit, loss, or session limits, or request self-exclusion.' },
];

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <InfoLayout title="FAQ" icon={HelpCircle}>
      <div className="flex flex-col gap-2.5">
        {FAQS.map((f, i) => {
          const active = open === i;
          return (
            <button
              key={i}
              onClick={() => setOpen(active ? -1 : i)}
              className="dash-card w-full text-left p-4 transition-all"
              style={{ animation: 'dashFadeIn 400ms ease both', borderColor: active ? 'rgba(212,175,55,0.5)' : undefined }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold" style={{ color: active ? '#D4AF37' : '#fff' }}>{f.q}</span>
                <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: '#D4AF37', transform: active ? 'rotate(180deg)' : 'none' }} />
              </div>
              {active && (
                <p className="text-sm leading-relaxed mt-2.5" style={{ color: 'rgba(38,161,123,0.95)', animation: 'dashFadeIn 250ms ease both' }}>{f.a}</p>
              )}
            </button>
          );
        })}
      </div>
    </InfoLayout>
  );
}