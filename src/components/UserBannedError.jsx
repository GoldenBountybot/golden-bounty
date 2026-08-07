import React from 'react';
import { Ban } from 'lucide-react';

const UserBannedError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'radial-gradient(120% 55% at 50% -10%, rgba(212,175,55,0.12), transparent 60%), #0D0D0D' }}>
      <div className="max-w-md w-full p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(248,113,113,0.35)', boxShadow: '0 8px 30px rgba(0,0,0,0.45)' }}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full" style={{ background: 'rgba(248,113,113,0.14)', border: '1px solid rgba(248,113,113,0.4)' }}>
            <Ban className="w-8 h-8" style={{ color: '#f87171' }} />
          </div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: '#f87171', fontFamily: "'Rye', Georgia, serif" }}>Account Banned</h1>
          <p className="mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Your account has been banned by the administrator. You can no longer access this platform.
          </p>
          <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.2)', color: 'rgba(255,255,255,0.55)' }}>
            <p>If you believe this is a mistake, please contact support to appeal the decision.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserBannedError;