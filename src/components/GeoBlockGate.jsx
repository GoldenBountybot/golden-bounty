import React, { useEffect, useState } from 'react';
import { BLOCKED_COUNTRIES, isBlockedCountry } from '@/lib/blockedCountries';
import CountryBlockedScreen from '@/components/CountryBlockedScreen';

// Detects the visitor's country from their IP and shows a blocked screen for
// restricted regions. If detection fails for any reason the app opens normally
// so legitimate players are never locked out.
export default function GeoBlockGate() {
  const [blocked, setBlocked] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const cached = sessionStorage.getItem('gb_country');
    if (cached) {
      if (isBlockedCountry(cached)) setBlocked(cached.toUpperCase());
      return;
    }

    const detect = async () => {
      const sources = [
        async () => {
          const r = await fetch('https://ipapi.co/json/');
          const j = await r.json();
          return j?.country_code;
        },
        async () => {
          const r = await fetch('https://ipwho.is/');
          const j = await r.json();
          return j?.country_code;
        },
      ];
      for (const src of sources) {
        try {
          const code = await src();
          if (code) return String(code).toUpperCase();
        } catch { /* try next source */ }
      }
      return null;
    };

    detect().then((code) => {
      if (cancelled || !code) return;
      sessionStorage.setItem('gb_country', code);
      if (isBlockedCountry(code)) setBlocked(code);
    });

    return () => { cancelled = true; };
  }, []);

  if (!blocked) return null;
  return <CountryBlockedScreen country={BLOCKED_COUNTRIES[blocked]} />;
}