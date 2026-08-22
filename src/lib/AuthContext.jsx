import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { isInsideTelegram, tgInitData, tgReady, tgUserId } from '@/lib/telegram';
import { invoke } from '@/api/supabaseFunctions';
import { setSession } from '@/api/supabaseAuth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
    // Keep the app in sync when the Supabase session changes (login/logout/refresh).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkUserAuth();
      }
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const checkAppState = async () => {
    setAuthError(null);
    setAppPublicSettings(null);
    const { data: { session } } = await supabase.auth.getSession();
    const inTelegram = isInsideTelegram();
    // One Telegram client can hold several accounts. The stored Supabase
    // session belongs to whichever account signed in last, so if a DIFFERENT
    // Telegram account is launching the app now, drop that session and sign
    // in fresh — otherwise every account would see the first one's identity.
    const currentTgId = inTelegram ? tgUserId() : '';
    let storedTgId = '';
    try { storedTgId = localStorage.getItem('gb_tg_uid') || ''; } catch { /* private mode */ }
    const switchedAccount = !!(session?.user && currentTgId && storedTgId && storedTgId !== currentTgId);
    if (switchedAccount) {
      try { await supabase.auth.signOut(); } catch { /* already gone */ }
    }

    if (session?.user && !switchedAccount) {
      await checkUserAuth();
    } else if (inTelegram) {
      // Opened from the Telegram bot with no session yet → sign the player in
      // (and create their account) automatically, no login screen needed.
      try {
        tgReady();
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
    } else {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
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