import React, { useRef, useEffect } from 'react';

// Full-screen branded loading video shown while the app is booting.
// The app only enters AFTER the video has played through at least once.
// While the app is still loading (keepLooping), the video replays so there
// is never a blank frame; once loading is done, the first full play ends
// and onFinished() lets the app proceed.
export default function AppLoadingVideo({ keepLooping = false, onFinished }) {
  const ref = useRef(null);

  // React's `muted` JSX attribute does NOT reliably set the DOM property,
  // and unmuted autoplay is blocked by browsers (=> black screen). So we
  // explicitly mute + kick off playback in JS, and re-apply on canplay.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.play().catch(() => {});
    const onCanPlay = () => { v.muted = true; v.play().catch(() => {}); };
    v.addEventListener('canplay', onCanPlay);
    return () => v.removeEventListener('canplay', onCanPlay);
  }, []);

  // Safety fallback: never trap the user on the loader forever.
  useEffect(() => {
    if (!onFinished) return;
    const t = setTimeout(onFinished, 15000);
    return () => clearTimeout(t);
  }, [onFinished]);

  const handleEnded = () => {
    if (keepLooping && ref.current) {
      ref.current.currentTime = 0;
      ref.current.muted = true;
      ref.current.play().catch(() => {});
    } else {
      onFinished?.();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden">
      <video
        ref={ref}
        src="https://media.base44.com/videos/public/6a5698edffaa42a5b6637776/807af90f4_InShot_20260722_111640994.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
        className="w-full h-full object-contain"
      />
    </div>
  );
}