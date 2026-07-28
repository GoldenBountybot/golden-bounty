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
import FreeSpin from './pages/FreeSpin';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import PayMethod from './pages/PayMethod';
import Withdraw from './pages/Withdraw';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLoadingImage from '@/components/AppLoadingImage';
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
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Authenticated casino — login required to play */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
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
        <Route path="/free-spin" element={<FreeSpin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pay" element={<PayMethod />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <TonConnectUIProvider manifestUrl="https://base44.app/api/apps/6a5698edffaa42a5b6637776/files/mp/public/6a5698edffaa42a5b6637776/a0c67c5f1_tonconnect-manifest.json">
            <AuthenticatedApp />
          </TonConnectUIProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App