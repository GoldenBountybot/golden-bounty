import React from 'react';
import AppLoadingScreen from '@/components/AppLoadingScreen';

// Games now use the exact same branded loading screen as the app entry, so
// every loading moment looks identical. Kept as a thin wrapper so all existing
// game call sites (progress / title / bgImage props) keep working.
export default function PremiumGameLoader({ progress = 0 }) {
  return <AppLoadingScreen progress={progress} />;
}