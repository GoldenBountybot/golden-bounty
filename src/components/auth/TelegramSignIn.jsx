import React, { useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { isInsideTelegram, tgInitData, tgReady } from '@/lib/telegram';
import { invoke } from '@/api/supabaseFunctions';
import { setSession } from '@/api/supabaseAuth';

// Signs the player in with their Telegram identity. Inside Telegram this runs
// automatically; elsewhere it explains that the app opens from the bot.
export default function TelegramSignIn({ onSignedIn }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const signIn = async () => {
    setStatus('loading');
    setError('');
    try {
      const { data } = await invoke('telegramAuth', { initData: tgInitData() });
      await setSession(data.session);
      onSignedIn?.(data);
    } catch (e) {
      setError(e?.message || 'Sign in failed');
      setStatus('idle');
    }
  };

  useEffect(() => {
    tgReady();
    if (isInsideTelegram()) signIn();
  }, []);

  if (!isInsideTelegram()) {
    return (
      <div className="text-center space-y-3">
        <p className="text-[#f5e6c8] text-sm font-cinzel">
          Golden Bounty opens inside Telegram.
        </p>
        <p className="text-[#f5e6c8]/60 text-xs">
          Launch the app from our Telegram bot to sign in with your Telegram account.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {status === 'loading' ? (
        <div className="flex items-center gap-2 text-[#f5e6c8]">
          <Loader2 className="w-5 h-5 animate-spin text-[#d4af37]" />
          <span className="font-cinzel text-sm">Signing you in…</span>
        </div>
      ) : (
        <button onClick={signIn} className="dash-btn-gold px-6 py-3 flex items-center gap-2">
          <Send className="w-4 h-4" /> Continue with Telegram
        </button>
      )}
      {error ? <p className="text-red-400 text-xs text-center">{error}</p> : null}
    </div>
  );
}