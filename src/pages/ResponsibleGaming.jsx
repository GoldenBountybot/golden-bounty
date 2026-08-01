import React from 'react';
import { ShieldCheck, SlidersHorizontal, AlertTriangle, Clock, Headset } from 'lucide-react';
import InfoLayout, { InfoSection } from '@/components/InfoLayout';

const TOOLS = [
  'Deposit limits (daily, weekly, monthly)',
  'Loss limits',
  'Session time limits',
  'Cool-off periods',
  'Self-exclusion',
];

const REMINDERS = [
  'Gambling should be entertainment, not a way to make money.',
  'Never chase losses.',
  'Only gamble with money you can afford to lose.',
];

export default function ResponsibleGaming() {
  return (
    <InfoLayout title="Responsible Gaming" icon={ShieldCheck}>
      <div className="flex flex-col gap-3">
        <div className="dash-card p-5" style={{ animation: 'dashFadeIn 400ms ease both' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(38,161,123,0.95)' }}>
            At Golden Bounty, we are committed to promoting responsible gaming.
          </p>
        </div>

        <InfoSection title="Available Tools">
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal className="w-4 h-4" style={{ color: '#D4AF37' }} />
            <span className="text-sm font-semibold" style={{ color: '#fff' }}>Set your own limits</span>
          </div>
          <ul>
            {TOOLS.map(t => (
              <li key={t} className="flex items-start gap-2 mt-1.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#D4AF37' }} />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">You can set these limits anytime in Account Settings → Responsible Gaming.</p>
        </InfoSection>

        <InfoSection title="Important Reminders">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" style={{ color: '#fb923c' }} />
            <span className="text-sm font-semibold" style={{ color: '#fff' }}>Play smart</span>
          </div>
          <ul>
            {REMINDERS.map(r => (
              <li key={r} className="flex items-start gap-2 mt-1.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#fb923c' }} />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </InfoSection>

        <InfoSection title="Age Restriction">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: '#D4AF37' }} />
            <span>Golden Bounty is strictly for players aged 18 and over.</span>
          </div>
        </InfoSection>

        <div className="dash-card p-5 flex flex-col items-center gap-2 text-center" style={{ animation: 'dashFadeIn 400ms ease both', background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', borderColor: 'rgba(212,175,55,0.4)' }}>
          <Headset className="w-7 h-7" style={{ color: '#D4AF37' }} />
          <p className="text-sm font-bold" style={{ color: '#fff' }}>Need help?</p>
          <p className="text-[12px]" style={{ color: 'rgba(38,161,123,0.85)' }}>Contact our 24/7 Support team through the Platform.</p>
        </div>
      </div>
    </InfoLayout>
  );
}