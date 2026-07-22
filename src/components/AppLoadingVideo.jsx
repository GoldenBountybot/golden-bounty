import React, { useRef, useEffect } from 'react';

// Full-screen branded loading video shown while the app is booting.
// The app only enters AFTER the video has played through at least once.
// While the app is still loading (keepLooping), the video replays so there
// is never a blank frame; once loading is done, the first full play ends
// and onFinished() lets the app proceed.
export default function AppLoadingVideo({ keepLooping = false, onFinished }) {
  const ref = useRef(null);

  // Safety fallback: never trap the user on the loader forever.
  useEffect(() => {
    if (!onFinished) return;
    const t = setTimeout(onFinished, 15000);
    return () => clearTimeout(t);
  }, [onFinished]);

  const handleEnded = () => {
    if (keepLooping && ref.current) {
      ref.current.currentTime = 0;
      ref.current.play().catch(() => {});
    } else {
      onFinished?.();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden">
      <video
        ref={ref}
        src="https://media.base44.com/videos/public/6a5698edffaa42a5b6637776/7fe6109fe_InShot_20260722_110750222.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        className="w-full h-full object-contain"
      />
    </div>
  );
}