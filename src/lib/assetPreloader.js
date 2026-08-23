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
// urls that have ACTUALLY finished downloading + decoding. `cache` alone can't
// tell "done" from "in flight / timed out", which made isCached() lie — images
// then rendered at full opacity while still streaming in (visible download).
const loaded = new Set();
// Keep a hard reference to every preloaded Image element so the browser keeps
// the decoded bitmap alive for the whole session. Without this the elements are
// garbage-collected and images visibly re-fetch/re-decode when a page remounts.
const retained = [];

// Preload a single image URL. Returns a promise that resolves when the image
// is fully decoded and ready to paint. Deduplicates against the global cache
// so the same URL is never fetched twice.
// `lowPriority` lowers the fetch priority so background warming doesn't
// compete with the user's active page navigation.
export function preloadImage(url, lowPriority = false) {
  if (!url || typeof url !== 'string') return Promise.resolve();
  if (loaded.has(url)) return Promise.resolve();
  const existing = cache.get(url);
  if (existing) return existing;

  const p = new Promise((resolve) => {
    let settled = false;
    // Safety timeout: if an image hasn't finished within 8s (slow network,
    // hanging CDN), release the waiter so one image can never freeze the
    // loading screen — but DROP it from the cache so a later preload retries
    // it properly instead of treating a half-downloaded image as "cached".
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cache.delete(url);
      resolve();
    }, 8000);

    // The download keeps going after a timeout; when it eventually completes
    // we still record it as fully loaded so FadeImage/isCached stay accurate.
    const done = () => {
      clearTimeout(timer);
      loaded.add(url);
      if (!settled) { settled = true; resolve(); }
    };

    const img = new Image();
    img.decoding = 'async';
    if ('fetchPriority' in img) img.fetchPriority = lowPriority ? 'low' : 'high';
    img.onload = () => {
      // Wait for the image to be fully decoded and ready to paint, so it
      // never pops in after the loading screen disappears.
      if (typeof img.decode === 'function') {
        img.decode().then(done).catch(done);
      } else {
        done();
      }
    };
    img.onerror = () => {
      // Never reject — a broken image shouldn't block the game. Un-cache it
      // so a future attempt can retry (transient network failures).
      clearTimeout(timer);
      cache.delete(url);
      if (!settled) { settled = true; resolve(); }
    };
    img.src = url;
    retained.push(img);
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

// Check whether a URL has FULLY finished loading (not merely in flight).
export function isCached(url) {
  return loaded.has(url);
}

// Fetch dynamic entity images (admin-added banners, payment QR codes, site
// settings) and preload them so they don't pop in after the splash disappears.
// Each entity is fetched independently; a failure in one never blocks the others.
export async function preloadDynamicAssets(base44) {
  const urls = new Set();
  const safeList = async (entity, field) => {
    try {
      const rows = await base44.entities[entity].list('-created_date', 100);
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
    const games = Object.values(GAME_ASSET_MAP).filter((a) => a && a.length);
    // Warm several games at once (still low priority) so the whole game
    // library is cached quickly after entry instead of trickling in one
    // game at a time while the player is already tapping into a game.
    const CONCURRENT = 4;
    for (let i = 0; i < games.length; i += CONCURRENT) {
      await Promise.all(games.slice(i, i + CONCURRENT).map((assets) => preloadAssets(assets, null, true)));
    }
  } catch {
    // ignore — background warming is best-effort
  } finally {
    warming = false;
  }
}