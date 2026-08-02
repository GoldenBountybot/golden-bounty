// Global image preloader with in-memory cache + deduplication.
//
// Images are loaded via `new Image()` in parallel. The browser's HTTP cache
// handles on-disk caching automatically (the CDN serves long-lived cache
// headers), so a second visit to the same game resolves instantly from cache.
//
// The in-memory `cache` Map prevents duplicate requests within the same
// session: once a URL has been fetched (or is mid-flight) it is never
// requested again — subsequent preload calls for the same URL resolve
// immediately from the cached promise.

// url -> Promise<void>  (settles when the image is decoded & ready)
const cache = new Map();

// Preload a single image URL. Returns a promise that resolves when the image
// is fully decoded and ready to paint. Deduplicates against the global cache
// so the same URL is never fetched twice.
export function preloadImage(url) {
  if (!url || typeof url !== 'string') return Promise.resolve();
  const existing = cache.get(url);
  if (existing) return existing;

  const p = new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve();
    img.onerror = () => resolve(); // never reject — a broken image shouldn't block the game
    img.src = url;
  });

  cache.set(url, p);
  return p;
}

// Preload many image URLs in parallel, calling `onProgress(0..100)` as each
// one completes. Returns a promise that resolves when ALL images are loaded
// (or failed). Deduplicates URLs so repeats don't inflate the count.
export function preloadAssets(urls, onProgress) {
  const unique = [...new Set(urls.filter(Boolean))];
  if (!unique.length) {
    if (onProgress) onProgress(100);
    return Promise.resolve();
  }

  let done = 0;
  const report = () => {
    done++;
    if (onProgress) onProgress(Math.round((done / unique.length) * 100));
  };

  return Promise.all(unique.map((url) => preloadImage(url).then(report)));
}

// Check whether a URL is already cached (loaded or loading).
export function isCached(url) {
  return cache.has(url);
}