import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import UserBannedError from '@/components/UserBannedError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Home from './pages/Home';
import SlotGame from './pages/SlotGame';
import HiLo from './pages/HiLo';
import Plinko from './pages/Plinko';
import Mines from './pages/Mines';
import FullHouse from './pages/FullHouse';
import RocketCrash from './pages/RocketCrash';
import CrownCoins from './pages/CrownCoins';
import BigBrown from './pages/BigBrown';
import Argonauts from './pages/Argonauts';
import GatesOfOlympus from './pages/GatesOfOlympus';
import Thimbles from './pages/Thimbles';
import FreeSpin from './pages/FreeSpin';
import Login from './pages/Login';
import Register from './pages/Register';
import PromoWelcome from './pages/PromoWelcome';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import HistoryPage from './pages/HistoryPage';
import Notifications from './pages/Notifications';
import PayMethod from './pages/PayMethod';
import Withdraw from './pages/Withdraw';
import About from './pages/About';
import Terms from './pages/Terms';
import Agreement from './pages/Agreement';
import Privacy from './pages/Privacy';
import ResponsibleGaming from './pages/ResponsibleGaming';
import Licenses from './pages/Licenses';
import Faq from './pages/Faq';
import Airdrop from './pages/Airdrop';
import LiveSupport from './pages/LiveSupport';
import Referrals from './pages/Referrals';
import Events from './pages/Events';
import Swap from './pages/Swap';
import MigrateTelegram from './pages/MigrateTelegram';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import BottomNavLayout from '@/components/BottomNavLayout';
import NotificationToaster from '@/components/NotificationToaster';
import TelegramBackButton from '@/components/TelegramBackButton';
import PromoWelcomeGate from '@/components/PromoWelcomeGate';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import { LanguageProvider } from '@/lib/LanguageContext';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { preloadAssets, preloadDynamicAssets, preloadAllGameAssets, preloadImage } from '@/lib/assetPreloader';
import { APP_ASSETS } from '@/lib/appAssets';
import { base44 } from '@/api/base44Client';
import { SUPABASE_URL } from '@/api/supabaseClient';
import { isStandaloneApp } from '@/lib/isStandaloneApp';
import { warmProfileCache } from '@/lib/profileCache';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const loading = isLoadingPublicSettings || isLoadingAuth;

  // No splash image — the app opens straight on the branded loading screen and
  // stays there until every app image is downloaded AND decoded, so nothing is
  // ever seen loading in after entry.
  const [staticReady, setStaticReady] = useState(false);
  const [dynamicReady, setDynamicReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  // Keep the branded loading screen on screen for at least a moment, so it is
  // actually seen even when every asset resolves instantly from cache.
  const [minTimeDone, setMinTimeDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinTimeDone(true), 1800);
    return () => clearTimeout(t);
  }, []);

  // The loading screen stays up until auth AND every app image (static assets
  // plus admin-uploaded banners / QR codes / avatars) is fully decoded.
  const showLoadingScreen = loading || !staticReady || !dynamicReady || !minTimeDone;

  useEffect(() => {
    // The loading screen's own background + logo first, so it paints instantly.
    preloadImage('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/0c0175bae_Screenshot_20260824-1719371.png');
    preloadImage('https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c39869f00_file_000000003b6c821193c37e7c968d77f2.png');
    // Track static preload progress (0..100) for the loading bar; dynamic
    // assets don't report progress so we just fold them into the final 100.
    preloadAssets(APP_ASSETS, (p) => setLoadProgress(Math.min(p, 90)))
      .then(() => { setStaticReady(true); setLoadProgress(100); })
      .catch(() => setStaticReady(true));
    preloadDynamicAssets(base44)
      .then(() => setDynamicReady(true))
      .catch(() => setDynamicReady(true));
    // Global safety net: no matter what happens (a hanging CDN, a stalled
    // decode, anything), never let the loading screen trap the user — force
    // the app open after 15s so they can use it even with missing assets.
    const safety = setTimeout(() => {
      setStaticReady(true);
      setDynamicReady(true);
      setLoadProgress(100);
    }, 45000);
    return () => clearTimeout(safety);
  }, []);

  // Once the loading screen is done, warm all game assets in the background so they
  // are already cached when the user taps into a game — near-instant load.
  useEffect(() => {
    if (showLoadingScreen) return;
    // Warm the profile data (name, username, transactions, game history)
    // right away so the Profile page opens instantly with no loading delay.
    warmProfileCache();
    const t = setTimeout(() => { preloadAllGameAssets(); }, 300);
    return () => clearTimeout(t);
  }, [showLoadingScreen]);

  if (showLoadingScreen) {
    return <AppLoadingScreen progress={loadProgress} />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'user_banned') {
      return <UserBannedError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
    <TelegramBackButton />
    <NotificationToaster />
    <PromoWelcomeGate />
    <Routes>
      {/* Public auth pages — no login required */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public lobby — viewable without login */}
      <Route path="/" element={<Home />} />

      {/* Everything below requires authentication */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/promo-welcome" element={<PromoWelcome />} />

        {/* Game pages — own headers, no bottom nav */}
        <Route path="/free-spin" element={<FreeSpin />} />
        <Route path="/games/wild-bounty" element={<SlotGame />} />
        <Route path="/games/hi-lo" element={<HiLo />} />
        <Route path="/games/plinko" element={<Plinko />} />
        <Route path="/games/mines" element={<Mines />} />
        <Route path="/games/fullhouse" element={<FullHouse />} />
        <Route path="/games/rocket-crash" element={<RocketCrash />} />
        <Route path="/games/crown-coins" element={<CrownCoins />} />
        <Route path="/games/big-brown" element={<BigBrown />} />
        <Route path="/games/argonauts" element={<Argonauts />} />
        <Route path="/games/gates-of-olympus" element={<GatesOfOlympus />} />
        <Route path="/games/thimbles" element={<Thimbles />} />

        {/* Admin — admin-only */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        {/* App pages — persistent bottom nav */}
        <Route element={<BottomNavLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/pay" element={<PayMethod />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/agreement" element={<Agreement />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/responsible-gaming" element={<ResponsibleGaming />} />
          <Route path="/licenses" element={<Licenses />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/airdrop" element={<Airdrop />} />
          <Route path="/live-support" element={<LiveSupport />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/events" element={<Events />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="/migrate" element={<MigrateTelegram />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <TonConnectUIProvider manifestUrl={`${SUPABASE_URL}/functions/v1/tonconnect-manifest`}>
              <AuthenticatedApp />
            </TonConnectUIProvider>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App