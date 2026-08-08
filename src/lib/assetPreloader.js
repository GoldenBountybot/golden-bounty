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
// `lowPriority` lowers the fetch priority so background warming doesn't
// compete with the user's active page navigation.
export function preloadImage(url, lowPriority = false) {
  if (!url || typeof url !== 'string') return Promise.resolve();
  const existing = cache.get(url);
  if (existing) return existing;

  const p = new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    if ('fetchPriority' in img) img.fetchPriority = lowPriority ? 'low' : 'high';
    img.onload = () => {
      // Wait for the image to be fully decoded and ready to paint, so it
      // never pops in after the loading screen disappears.
      if (typeof img.decode === 'function') {
        img.decode().then(resolve).catch(() => resolve());
      } else {
        resolve();
      }
    };
    img.onerror = () => resolve(); // never reject — a broken image shouldn't block the game
    img.src = url;
  });

  cache.set(url, p);
  return p;
}

// Preload many image URLs in parallel, calling `onProgress(0..100)` as each
// one completes. Returns a promise that resolves when ALL images are loaded
// (or failed). Deduplicates URLs so repeats don't inflate the count.
export function preloadAssets(urls, onProgress, lowPriority = false) {
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

  return Promise.all(unique.map((url) => preloadImage(url, lowPriority).then(report)));
}

// Check whether a URL is already cached (loaded or loading).
export function isCached(url) {
  return cache.has(url);
}

// Fetch dynamic entity images (admin-added banners, payment QR codes, site
// settings) and preload them so they don't pop in after the splash disappears.
// Each entity is fetched independently; a failure in one never blocks the others.
export async function preloadDynamicAssets(base44) {
  const urls = new Set();
  const safeList = async (entity, field) => {
    try {
      const rows = await base44.asServiceRole.entities[entity].list('-created_date', 100);
      rows.forEach((r) => { if (r && r[field]) urls.add(r[field]); });
    } catch {}
  };
  await Promise.all([
    safeList('Banner', 'image_url'),
    safeList('PaymentAddress', 'qr_image_url'),
    safeList('SiteSetting', 'image_url'),
    safeList('Avatar', 'image_url'),
  ]);
  if (!urls.size) return;
  await preloadAssets([...urls]);
}

// Background-warm ALL game assets so that by the time the user taps a game
// card, its symbols/banners are already in the browser cache and the game's
// loading screen resolves almost instantly. Runs at low fetch priority in
// small sequential chunks (one game at a time) so it never competes with the
// user's active navigation or the first paint of the lobby.
let warming = false;
export async function preloadAllGameAssets() {
  if (warming) return;
  warming = true;
  try {
    const { GAME_ASSET_MAP } = await import('@/lib/gameAssets');
    const games = Object.values(GAME_ASSET_MAP);
    // Preload one game's bundle at a time, low priority, so the lobby stays
    // responsive while the cache fills in the background.
    for (const assets of games) {
      if (!assets || !assets.length) continue;
      await preloadAssets(assets, null, true);
    }
  } catch {
    // ignore — background warming is best-effort
  } finally {
    warming = false;
  }
}