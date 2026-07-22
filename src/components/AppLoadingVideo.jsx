import React from 'react';

// Full-screen branded loading video shown while the app is booting
// (public settings / auth still resolving) instead of a plain spinner.
export default function AppLoadingVideo({ message = '' }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden">
      <video
        src="https://media.base44.com/videos/public/6a5698edffaa42a5b6637776/7fe6109fe_InShot_20260722_110750222.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-contain"
      />
      {message && (
        <p className="absolute bottom-8 text-amber-200/80 text-sm italic animate-pulse" style={{ fontFamily: 'Georgia, serif' }}>
          {message}
        </p>
      )}
    </div>
  );
}