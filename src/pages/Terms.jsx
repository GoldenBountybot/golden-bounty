import React from 'react';
import { ScrollText } from 'lucide-react';
import InfoLayout, { InfoSection } from '@/components/InfoLayout';

const SECTIONS = [
  { n: 1, title: 'Acceptance of Terms', body: 'By accessing or using golden-bounty.com (the "Platform"), you agree to these Terms & Conditions.' },
  { n: 2, title: 'Eligibility', body: 'You must be at least 18 years old. You are solely responsible for ensuring that online gambling is legal in your jurisdiction.' },
  { n: 3, title: 'Account Registration', body: 'You must provide accurate information. One account per person is allowed. We reserve the right to suspend or close accounts that violate these terms.' },
  { n: 4, title: 'Free Spin & Bonuses', body: 'New players receive 1 Free Spin upon successful registration. Free Spin winnings are subject to the wagering requirements stated in the promotion. We may modify or cancel promotions at any time.' },
  { n: 5, title: 'Games', body: 'The Platform currently offers 12 casino games. Game rules and fairness are governed by the respective providers.' },
  { n: 6, title: 'Staking', body: 'Staking plans are available. You receive daily profit according to the selected plan. Profit rates, lock periods, and conditions are clearly displayed before you confirm. Early unstaking is subject to the plan rules.' },
  { n: 7, title: 'Deposits & Withdrawals', body: 'Supported payment methods are shown in your wallet. No KYC is required for withdrawals. Withdrawals are processed as quickly as possible after request.' },
  { n: 8, title: 'Prohibited Activities', body: 'You may not use multiple accounts, engage in fraud, collusion, bonus abuse, or any illegal activity.' },
  { n: 9, title: 'License & Regulation', body: 'Golden Bounty operates under the authorization of BDS INFO S.A. pursuant to CONAJZAR Resolution No. 08/2024 (31 January 2024). Certificate of Adhesion issued on 24 April 2025. Authorized for markets outside the territory of Paraguay.' },
  { n: 10, title: 'Limitation of Liability', body: 'The Platform is provided "as is". We are not liable for any losses arising from the use of the Platform, except where required by law.' },
  { n: 11, title: 'Changes to Terms', body: 'We may update these Terms at any time. Continued use of the Platform constitutes acceptance of the updated Terms.' },
  { n: 12, title: 'Contact', body: 'For any questions, contact our 24/7 Support team through the Platform.' },
];

export default function Terms() {
  return (
    <InfoLayout title="Terms & Conditions" subtitle="Last updated: 1 August 2026" icon={ScrollText}>
      <div className="flex flex-col gap-3">
        {SECTIONS.map(s => (
          <InfoSection key={s.n} n={s.n} title={s.title}>
            {s.body}
          </InfoSection>
        ))}
      </div>
    </InfoLayout>
  );
}