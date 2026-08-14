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
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import BottomNavLayout from '@/components/BottomNavLayout';
import NotificationToaster from '@/components/NotificationToaster';
import AppLoadingImage from '@/components/AppLoadingImage';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import { LanguageProvider } from '@/lib/LanguageContext';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { preloadAssets, preloadDynamicAssets, preloadAllGameAssets } from '@/lib/assetPreloader';
import { APP_ASSETS } from '@/lib/appAssets';
import { base44 } from '@/api/base44Client';
import { isStandaloneApp } from '@/lib/isStandaloneApp';

const MIN_SPLASH_MS = 1500;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const loading = isLoadingPublicSettings || isLoadingAuth;

  // Keep the branded splash visible until the app has finished loading AND the
  // image has finished downloading AND a minimum splash duration has elapsed,
  // so users actually see it instead of a flash.
  // Show the splash image ONLY on the first app entry per browser session.
  // sessionStorage persists across refreshes but clears when the tab closes,
  // so the splash appears once when the user first opens the app and never
  // again until they close and reopen the tab.
  // Installed mobile app: skip the web splash entirely (the native app shows
  // its own splash). Browser: show it once per session.
  const splashAlreadyShown = isStandaloneApp() || (() => { try { return sessionStorage.getItem('gb_splash_shown') === '1'; } catch { return false; } })();
  const [imgReady, setImgReady] = useState(splashAlreadyShown);
  const [staticReady, setStaticReady] = useState(false);
  const [dynamicReady, setDynamicReady] = useState(false);
  const [minDone, setMinDone] = useState(splashAlreadyShown);
  const [loadProgress, setLoadProgress] = useState(0);

  // Phase 1: static splash image — show until the image loads AND a minimum
  // display time elapses, so the user sees the full-screen splash first.
  const showSplashImage = !imgReady || !minDone;
  // Phase 2: loading screen — after the splash image, while static assets/auth load.
  // Dynamic assets (banners, QR codes) load in the BACKGROUND and don't block
  // the app from showing — they pop in gracefully once fetched.
  const showLoadingScreen = !showSplashImage && (loading || !staticReady);

  useEffect(() => {
    // Skip the splash entirely if it was already shown earlier this session.
    if (splashAlreadyShown) return;
    // Preload the splash image AND the loading-screen background + logo so
    // they're already cached when phase 2 appears — otherwise the user sees
    // the loading-screen background visibly downloading/popping in.
    const SPLASH_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/f8c7eb4bd_golden_bounty_fullscreen_vertical.png';
    const LOADING_BG_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/e1d861111_golden_bounty_fullscreen_vertical.png';
    const LOGO_URL = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/c39869f00_file_000000003b6c821193c37e7c968d77f2.png';
    let splashDone = false;
    const markSplash = () => { if (!splashDone) { splashDone = true; setImgReady(true); } };
    const splashImg = new Image();
    splashImg.onload = markSplash;
    splashImg.onerror = markSplash;
    splashImg.src = SPLASH_URL;
    // Warm the loading-screen bg + logo in parallel (don't block phase 1 on them).
    const bgImg = new Image(); bgImg.src = LOADING_BG_URL;
    const logoImg = new Image(); logoImg.src = LOGO_URL;
    const t = setTimeout(() => setMinDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  // Mark the splash as shown in sessionStorage the moment it finishes, so
  // it never reappears on refresh or re-navigation within the same session.
  useEffect(() => {
    if (!showSplashImage) {
      try { sessionStorage.setItem('gb_splash_shown', '1'); } catch {}
    }
  }, [showSplashImage]);

  // Start preloading static + dynamic assets ONLY after the splash image
  // phase is done, so the loading screen is visible while they fetch.
  useEffect(() => {
    if (showSplashImage) return;
    // Track static preload progress (0..100) for the loading bar; dynamic
    // assets don't report progress so we just fold them into the final 100.
    preloadAssets(APP_ASSETS, (p) => setLoadProgress(Math.min(p, 90)))
      .then(() => { setStaticReady(true); setLoadProgress(100); })
      .catch(() => setStaticReady(true));
    // Start dynamic asset preloading immediately in the background — don't
    // block the app on it. Banners/QR codes pop in once fetched.
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
    }, 15000);
    return () => clearTimeout(safety);
  }, [showSplashImage]);

  // Once the splash is done, warm all game assets in the background so they
  // are already cached when the user taps into a game — near-instant load.
  useEffect(() => {
    if (showLoadingScreen) return;
    const t = setTimeout(() => { preloadAllGameAssets(); }, 1500);
    return () => clearTimeout(t);
  }, [showLoadingScreen]);

  if (showSplashImage) {
    return <AppLoadingImage />;
  }
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
    <NotificationToaster />
    <Routes>
      {/* Public auth pages — no login required */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Everything below requires authentication */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Lobby */}
        <Route path="/" element={<Home />} />
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
            <TonConnectUIProvider manifestUrl={`${window.location.origin}/api/apps/6a5698edffaa42a5b6637776/functions/tonconnectManifest`}>
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