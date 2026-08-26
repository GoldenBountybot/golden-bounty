import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { isInsideTelegram, tgInitData, tgReady, tgUserId } from '@/lib/telegram';
import { invoke } from '@/api/supabaseFunctions';
import { setSession } from '@/api/supabaseAuth';
import { adoptHandoffSession } from '@/lib/sessionHandoff';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  // Once the first auth check completed, silent token refreshes must NOT put
  // the whole app back on the loading screen (it unmounts every open page —
  // the user sees the app "reload" out of nowhere every ~55 minutes / focus).
  const authCheckedRef = useRef(false);

  useEffect(() => {
    checkAppState();
    // Keep the app in sync when the Supabase session changes (login/logout/refresh).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // A token refresh on an already-authenticated session changes nothing
        // for the UI — re-checking would flash the loading screen and remount
        // every page. Only re-check when we haven't established the user yet.
        if (!authCheckedRef.current) checkUserAuth();
      }
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const checkAppState = async () => {
    setAuthError(null);
    setAppPublicSettings(null);
    // A link opened in an external wallet browser (MetaMask) can carry the
    // player's session, since Telegram launch data isn't available there.
    await adoptHandoffSession();
    const { data: { session } } = await supabase.auth.getSession();
    const inTelegram = isInsideTelegram();

    if (inTelegram) {
      // A Telegram client can hold several accounts, and the launch data always
      // tells us WHICH account is opening the app right now. So inside Telegram
      // we always re-authenticate from that launch data instead of trusting the
      // session left behind by whoever used the app last — that way every
      // Telegram ID lands on its own player profile and wallet.
      try {
        tgReady();
        const currentTgId = tgUserId();
        let storedTgId = '';
        try { storedTgId = localStorage.getItem('gb_tg_uid') || ''; } catch { /* private mode */ }
        // Different account than the stored session → clear it first so no
        // stale identity or cached data from the previous account survives.
        if (session?.user && currentTgId && storedTgId !== currentTgId) {
          try { await supabase.auth.signOut(); } catch { /* already gone */ }
        }
        const { data } = await invoke('telegramAuth', { initData: tgInitData() });
        await setSession(data.session);
        try { if (currentTgId) localStorage.setItem('gb_tg_uid', currentTgId); } catch { /* private mode */ }
        await checkUserAuth();
        return;
      } catch {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
    } else if (session?.user) {
      // Outside Telegram (browser session) — keep the existing session.
      await checkUserAuth();
    } else {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      if (!authCheckedRef.current) setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();

      // Banned players are blocked from the app entirely. The ban flag lives on
      // the wallet row (admin-only write) so users can't unban themselves.
      let isBanned = false;
      try {
        const wallets = await base44.entities.Wallet.filter({ user_id: currentUser.id }, 'created_date', 1);
        isBanned = !!(wallets && wallets[0] && wallets[0].banned);
      } catch { /* no wallet yet = not banned */ }

      if (isBanned) {
        setAuthError({ type: 'user_banned', message: 'Your account has been banned' });
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }

      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      authCheckedRef.current = true;
    } catch (error) {
      console.error('User auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout(shouldRedirect ? '/login' : window.location.pathname);
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};