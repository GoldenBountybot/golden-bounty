import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
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
import Notifications from './pages/Notifications';
import PayMethod from './pages/PayMethod';
import Withdraw from './pages/Withdraw';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ResponsibleGaming from './pages/ResponsibleGaming';
import Licenses from './pages/Licenses';
import Faq from './pages/Faq';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomNavLayout from '@/components/BottomNavLayout';
import AppLoadingImage from '@/components/AppLoadingImage';
import { LanguageProvider } from '@/lib/LanguageContext';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

const MIN_SPLASH_MS = 3500;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const loading = isLoadingPublicSettings || isLoadingAuth;

  // Keep the branded splash visible until the app has finished loading AND the
  // image has finished downloading AND a minimum splash duration has elapsed,
  // so users actually see it instead of a flash.
  const [imgReady, setImgReady] = useState(false);
  const [minDone, setMinDone] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgReady(true);
    img.onerror = () => setImgReady(true); // don't trap the user on a failed image
    img.src = 'https://media.base44.com/images/public/6a5698edffaa42a5b6637776/5cc61204f_InShot_20260722_115033604.jpg';
    const t = setTimeout(() => setMinDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  const showSplash = loading || !imgReady || !minDone;

  if (showSplash) {
    return <AppLoadingImage />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Public lobby & auth */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/responsible-gaming" element={<ResponsibleGaming />} />
      <Route path="/licenses" element={<Licenses />} />
      <Route path="/faq" element={<Faq />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Authenticated casino — signup required to play */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/register" replace />} />}>
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
        <Route path="/free-spin" element={<FreeSpin />} />
        <Route path="/promo-welcome" element={<PromoWelcome />} />
        {/* Non-game authenticated pages — persistent bottom navigation */}
        <Route element={<BottomNavLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pay" element={<PayMethod />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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