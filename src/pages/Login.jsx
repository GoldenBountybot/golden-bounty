import React from 'react';
import TelegramSignIn from '@/components/auth/TelegramSignIn';

// Telegram Mini App identity is the only login method for Golden Bounty.
export default function Login() {
  const handleSignedIn = (data) => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    const safeReturn = returnTo && returnTo.startsWith('/') ? returnTo : '/';
    window.location.href = data?.is_new_user ? '/promo-welcome' : safeReturn;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 bg-[#0b0805]">
      <img
        src="https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/b44/c39869f00_file_000000003b6c821193c37e7c968d77f2.png"
        alt="Golden Bounty"
        className="w-24 h-24 object-contain mb-4"
      />
      <h1 className="font-cinzel text-2xl font-bold text-[#d4af37] mb-1">GOLDEN BOUNTY</h1>
      <p className="text-[#f5e6c8]/50 text-xs tracking-[0.3em] uppercase mb-8">Play · Stake · Earn</p>
      <TelegramSignIn onSignedIn={handleSignedIn} />
    </div>
  );
}