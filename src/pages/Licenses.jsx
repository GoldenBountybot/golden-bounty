import React, { useState, useEffect } from 'react';
import { Award, MapPin, Building2 } from 'lucide-react';
import InfoLayout, { InfoSection } from '@/components/InfoLayout';
import { base44 } from '@/api/base44Client';

export default function Licenses() {
  const [certImg, setCertImg] = useState('https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/747317502_Gemini_Generated_Image_wb9p68wb9p68wb9p.png');

  useEffect(() => {
    base44.entities.SiteSetting.filter({ name: 'license_certificate', active: true })
      .then(list => { if (list[0]?.image_url) setCertImg(list[0].image_url); })
      .catch(() => {});
  }, []);

  return (
    <InfoLayout title="Licenses" icon={Award}>
      <div className="flex flex-col gap-3">
        <div className="dash-card p-5 text-center" style={{ animation: 'dashFadeIn 400ms ease both', background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))', borderColor: 'rgba(212,175,55,0.4)' }}>
          <Award className="w-9 h-9 mx-auto" style={{ color: '#D4AF37' }} />
          <h2 className="text-lg font-extrabold mt-2" style={{ color: '#fff' }}>Licenses & Certificates</h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(38,161,123,0.95)' }}>Golden Bounty is authorized by BDS INFO S.A.</p>
        </div>

        <InfoSection title="Authorization Details">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between gap-3"><span style={{ color: 'rgba(38,161,123,0.75)' }}>Resolution</span><span className="font-semibold text-right" style={{ color: 'rgba(38,161,123,0.95)' }}>CONAJZAR No. 07/2026</span></div>
            <div className="flex justify-between gap-3"><span style={{ color: 'rgba(38,161,123,0.75)' }}>Resolution Date</span><span className="font-semibold text-right" style={{ color: 'rgba(38,161,123,0.95)' }}>31 January 2026</span></div>
            <div className="flex justify-between gap-3"><span style={{ color: 'rgba(38,161,123,0.75)' }}>Certificate of Adhesion</span><span className="font-semibold text-right" style={{ color: 'rgba(38,161,123,0.95)' }}>24 April 2026</span></div>
            <div className="flex justify-between gap-3"><span style={{ color: 'rgba(38,161,123,0.75)' }}>RUC</span><span className="font-semibold text-right" style={{ color: 'rgba(38,161,123,0.95)' }}>80137969-1</span></div>
          </div>
        </InfoSection>

        <InfoSection title="Licensing Entity Address">
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#D4AF37' }} />
            <span>Vda. Ita Ybate N° 1680 e/ Francisco Miranda, Asunción, Paraguay</span>
          </div>
          <p className="mt-3">This authorization permits GOLDEN-BOUNTY.COM to operate in markets outside the territory of Paraguay.</p>
        </InfoSection>

        <InfoSection title="Address">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#D4AF37' }} />
            <span>Office 2305, Boulevard Plaza Tower 1, Sheikh Mohammed bin Rashid Boulevard, Downtown Dubai, Dubai, United Arab Emirates</span>
          </div>
        </InfoSection>

        {/* Certificate image — fetched from SiteSetting("license_certificate") */}
        <div className="dash-card p-4 flex flex-col items-center gap-3" style={{ animation: 'dashFadeIn 400ms ease both' }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'rgba(212,175,55,0.85)' }}>Certificate of Adhesion</p>
          {certImg ? (
            <img src={certImg} alt="Certificate of Adhesion" className="w-full h-auto rounded-xl" style={{ border: '1px solid rgba(212,175,55,0.3)' }} />
          ) : (
            <div className="w-full aspect-[4/3] rounded-xl flex flex-col items-center justify-center gap-2 text-center" style={{ border: '2px dashed rgba(212,175,55,0.35)', background: 'rgba(255,255,255,0.02)' }}>
              <Award className="w-10 h-10" style={{ color: 'rgba(212,175,55,0.5)' }} />
              <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>Certificate image coming soon</p>
              <p className="text-[10px] max-w-[220px]" style={{ color: 'rgba(255,255,255,0.4)' }}>The official Certificate of Adhesion will be displayed here.</p>
            </div>
          )}
        </div>
      </div>
    </InfoLayout>
  );
}