import React from 'react';
import { Link } from 'react-router-dom';
import { Info, MapPin, Target, ShieldCheck } from 'lucide-react';
import InfoLayout, { InfoSection } from '@/components/InfoLayout';

export default function About() {
  return (
    <InfoLayout title="About Us" icon={Info}>
      <div className="flex flex-col gap-3">
        <div className="dash-card p-5" style={{ animation: 'dashFadeIn 400ms ease both' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(38,161,123,0.95)' }}>
            Golden Bounty is a Dubai-based online casino and staking platform that combines exciting casino games with daily earning opportunities.
          </p>
          <p className="text-sm leading-relaxed mt-3" style={{ color: 'rgba(38,161,123,0.95)' }}>
            We offer 12 carefully selected games and flexible Staking Plans that pay daily profit according to the plan you choose.
          </p>
          <p className="text-sm leading-relaxed mt-3" style={{ color: 'rgba(38,161,123,0.95)' }}>
            Golden Bounty is authorized by BDS INFO S.A. under CONAJZAR Resolution No. 07/2026 (dated 31 January 2026). The Certificate of Adhesion was issued on 24 April 2026. This authorization allows operation in markets outside the territory of Paraguay.
          </p>
        </div>

        <InfoSection title="Dubai Company Address">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#D4AF37' }} />
            <span>Office 2305, Boulevard Plaza Tower 1, Sheikh Mohammed bin Rashid Boulevard, Downtown Dubai, Dubai, United Arab Emirates</span>
          </div>
        </InfoSection>

        <InfoSection title="Our Mission" icon={Target}>
          To provide a secure, fast, and rewarding experience with 24/7 Support and no unnecessary verification barriers.
        </InfoSection>

        <div className="dash-card p-5 flex flex-col items-center gap-3 text-center" style={{ animation: 'dashFadeIn 400ms ease both', background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', borderColor: 'rgba(212,175,55,0.4)' }}>
          <ShieldCheck className="w-8 h-8" style={{ color: '#D4AF37' }} />
          <p className="text-sm font-bold" style={{ color: '#fff' }}>Licensed & Authorized</p>
          <p className="text-[12px]" style={{ color: 'rgba(38,161,123,0.85)' }}>CONAJZAR Resolution No. 07/2026 · Certificate issued 24 April 2026</p>
          <Link to="/licenses" className="dash-btn-gold px-5 py-2.5 text-xs mt-1">View Licenses</Link>
        </div>
      </div>
    </InfoLayout>
  );
}