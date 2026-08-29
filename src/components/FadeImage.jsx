import React, { useState, useEffect, useRef } from 'react';
import { isCached } from '@/lib/assetPreloader';

// Drop-in <img> replacement that fades in smoothly when the image is ready,
// so the user never sees a raw image "download/pop in" — it just appears
// with a gentle fade. Works whether the image is already cached (instant
// fade) or still loading (fades when it arrives).
//
// Use anywhere a visible image could pop in after the page renders.
export default function FadeImage({
  src,
  alt = '',
  className = '',
  style = {},
  durationMs = 400,
  decoding = 'async',
  ...rest
}) {
  // If the image is already in the preload cache, we can show it immediately
  // (still fade for polish). Otherwise start hidden and fade on load.
  const [ready, setReady] = useState(() => isCached(src));
  const imgRef = useRef(null);
  // Already-cached images must appear with NO fade at all — otherwise every
  // remount (e.g. navigating back to a page) replays the fade and looks like
  // the image is downloading again.
  const instantRef = useRef(isCached(src));

  // If the src changes, re-evaluate readiness. Also check `complete` directly:
  // a browser-cached image finishes loading before React attaches onLoad, so
  // without this check the image would stay invisible forever.
  useEffect(() => {
    const cached = isCached(src) || imgRef.current?.complete;
    instantRef.current = cached;
    if (cached) setReady(true);
  }, [src]);

  const onLoad = (e) => {
    setReady(true);
    rest.onLoad?.(e);
  };

  return (
    <img
      {...rest}
      ref={imgRef}
      src={src}
      alt={alt}
      decoding={instantRef.current ? 'sync' : decoding}
      loading="eager"
      onLoad={onLoad}
      className={className}
      style={{
        ...style,
        opacity: ready ? 1 : 0,
        transition: instantRef.current ? 'none' : `opacity ${durationMs}ms ease-out`,
      }}
    />
  );
}