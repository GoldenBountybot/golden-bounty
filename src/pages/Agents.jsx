import React, { useEffect, useMemo, useState } from 'react';
import { Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BackButton from '@/components/BackButton';
import AgentCard from '@/components/agents/AgentCard';
import { countryFlag } from '@/lib/agentCountries';
import { useLanguage } from '@/lib/LanguageContext';

const SANS = "'Inter', 'Poppins', ui-sans-serif, system-ui, -apple-system, sans-serif";

export default function Agents() {
  const { t } = useLanguage();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('');

  useEffect(() => {
    base44.entities.AgentProfile.filter({ active: true }, '-created_date', 500)
      .then((rows) => setAgents(rows || []))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  const countries = useMemo(() => {
    const map = new Map();
    agents.forEach((a) => {
      if (!a.country_code) return;
      const c = map.get(a.country_code) || { code: a.country_code, name: a.country_name || a.country_code, count: 0 };
      c.count += 1;
      map.set(a.country_code, c);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [agents]);

  useEffect(() => {
    if (!country && countries.length) setCountry(countries[0].code);
  }, [countries, country]);

  const shown = agents.filter((a) => a.country_code === country);

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ background: '#0D0D0D', fontFamily: SANS }}>
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(120% 60% at 50% -10%, rgba(212,175,55,0.10), transparent 60%), radial-gradient(80% 50% at 100% 110%, rgba(212,175,55,0.05), transparent 60%), url(https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/42da6c35a_file_00000000a918820b81da42fc2ddfcfda.png) center/cover no-repeat', backgroundAttachment: 'fixed' }}
      />

      <header className="sticky top-0 z-20 backdrop-blur-xl" style={{ background: 'rgba(13,13,13,0.78)', borderBottom: '1px solid rgba(212,175,55,0.22)' }}>
        <div className="max-w-none mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton href="/dashboard" label={t('Back')} />
          <div className="flex-1 flex items-center justify-center gap-2">
            <Shield className="w-5 h-5" style={{ color: '#D4AF37' }} />
            <h1 className="text-lg font-extrabold" style={{ color: '#D4AF37' }}>{t('Agents')}</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="relative z-10 max-w-none mx-auto w-full px-4 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
          </div>
        ) : countries.length === 0 ? (
          <div className="dash-card p-6 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {t('No agents available yet.')}
          </div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
              {countries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCountry(c.code)}
                  className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-xs font-bold shrink-0 whitespace-nowrap transition-all active:scale-95"
                  style={{
                    border: country === c.code ? '1px solid rgba(212,175,55,0.7)' : '1px solid rgba(212,175,55,0.22)',
                    background: country === c.code ? 'linear-gradient(135deg,#FFD700,#C89B3C)' : 'rgba(255,255,255,0.03)',
                    color: country === c.code ? '#1a1408' : '#D4AF37',
                  }}
                >
                  <span className="text-base">{countryFlag(c.code)}</span> {c.name} ({c.count})
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {shown.map((a) => <AgentCard key={a.id} agent={a} />)}
            </div>
          </>
        )}
      </main>
    </div>
  );
}