import React from 'react';
import { Shield } from 'lucide-react';
import InfoLayout, { InfoSection } from '@/components/InfoLayout';

function Bullet({ children }) {
  return (
    <li className="flex items-start gap-2 mt-1.5">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#D4AF37' }} />
      <span>{children}</span>
    </li>
  );
}

export default function Privacy() {
  return (
    <InfoLayout title="Privacy Policy" subtitle="Last updated: 1 August 2026" icon={Shield}>
      <div className="flex flex-col gap-3">
        <div className="dash-card p-5" style={{ animation: 'dashFadeIn 400ms ease both' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Golden Bounty ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use golden-bounty.com (the "Platform").
          </p>
        </div>

        <InfoSection n={1} title="Information We Collect">
          <p>We may collect the following types of information:</p>
          <ul className="mt-1">
            <Bullet>Account information (email address, username, password)</Bullet>
            <Bullet>Transaction data (deposits, withdrawals, staking activity, balances)</Bullet>
            <Bullet>Technical data (IP address, browser type, device information, operating system)</Bullet>
            <Bullet>Usage data (pages visited, games played, time spent on the Platform)</Bullet>
            <Bullet>Communication data (messages you send to our 24/7 Support team)</Bullet>
          </ul>
          <p className="mt-3">We do not require identity documents (KYC) for normal account registration or withdrawals.</p>
        </InfoSection>

        <InfoSection n={2} title="How We Use Your Information">
          <p>We use your information to:</p>
          <ul className="mt-1">
            <Bullet>Create and manage your account</Bullet>
            <Bullet>Process deposits, withdrawals, and staking rewards</Bullet>
            <Bullet>Provide daily profit according to your selected staking plan</Bullet>
            <Bullet>Improve the Platform and user experience</Bullet>
            <Bullet>Communicate with you, including responding to 24/7 Support requests</Bullet>
            <Bullet>Detect and prevent fraud or unauthorized activity</Bullet>
            <Bullet>Comply with applicable legal and regulatory obligations</Bullet>
          </ul>
        </InfoSection>

        <InfoSection n={3} title="Sharing of Information">
          <p>We do not sell or rent your personal data to third parties. We may share information only with:</p>
          <ul className="mt-1">
            <Bullet>Payment processors and blockchain networks necessary to complete transactions</Bullet>
            <Bullet>Service providers who help us operate the Platform (under strict confidentiality)</Bullet>
            <Bullet>Authorities when required by law</Bullet>
          </ul>
        </InfoSection>

        <InfoSection n={4} title="Data Security">
          We use industry-standard security measures, including encryption and secure servers, to protect your information against unauthorized access, loss, or misuse.
        </InfoSection>

        <InfoSection n={5} title="Data Retention">
          We retain your personal data only for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements.
        </InfoSection>

        <InfoSection n={6} title="Your Rights">
          <p>Depending on your location, you may have the right to:</p>
          <ul className="mt-1">
            <Bullet>Access the personal data we hold about you</Bullet>
            <Bullet>Request correction of inaccurate data</Bullet>
            <Bullet>Request deletion of your data (subject to legal requirements)</Bullet>
            <Bullet>Object to or restrict certain processing</Bullet>
          </ul>
          <p className="mt-3">To exercise any of these rights, please contact our 24/7 Support team.</p>
        </InfoSection>

        <InfoSection n={7} title="Cookies">
          We use cookies and similar technologies to remember your preferences, analyze traffic, and improve the Platform. You can manage cookie settings in your browser.
        </InfoSection>

        <InfoSection n={8} title="Third-Party Links">
          The Platform may contain links to third-party websites. We are not responsible for the privacy practices of those websites.
        </InfoSection>

        <InfoSection n={9} title="Changes to This Policy">
          We may update this Privacy Policy from time to time. The latest version will always be available on this page with the updated date.
        </InfoSection>

        <InfoSection n={10} title="Contact Us">
          If you have any questions about this Privacy Policy or your personal data, please contact our 24/7 Support team through the Platform.
        </InfoSection>
      </div>
    </InfoLayout>
  );
}