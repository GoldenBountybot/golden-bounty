// Warms and holds the current user's profile data (name, username, phone,
// bounty, transactions, game activity) so any page renders instantly.
// The cache is mirrored into localStorage AND tagged with the owner's user id,
// so a fresh app open paints instantly — but switching accounts (multiple
// Telegram accounts on one device) never shows the previous account's details.
import { base44 } from '@/api/base44Client';
import { getCurrentUserIdSync } from '@/lib/currentUserId';

const KEY = 'gb_profile_cache_v1';
const EMPTY = { user_id: null, profile: null, txs: null, activity: null };

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const c = JSON.parse(raw);
      const current = getCurrentUserIdSync();
      // Only trust the cache when it belongs to the account logged in now.
      if (c?.user_id && current && c.user_id === current) return c;
    }
  } catch { /* ignore */ }
  return { ...EMPTY };
};

let cache = read();
let inflight = null;

const persist = () => {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* ignore */ }
};

export function warmProfileCache() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const u = await base44.auth.me();
      // A different account than the cached one → drop the stale data instead
      // of showing it alongside the new user's.
      if (cache.user_id && cache.user_id !== u.id) cache = { ...EMPTY };
      cache = { ...cache, user_id: u.id, profile: u };
      persist();
      const [t, a] = await Promise.all([
        base44.entities.Transaction.filter({ user_id: u.id }, '-created_date', 50),
        base44.entities.PlayerActivity.filter({ user_id: u.id }, '-created_date', 50),
      ]);
      cache = { user_id: u.id, profile: u, txs: t, activity: a };
      persist();
    } catch {
      /* not logged in — nothing to warm */
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function getProfileCache() {
  return cache;
}

export function updateProfileCache(patch) {
  cache = { ...cache, ...patch };
  if (patch.profile?.id) cache.user_id = patch.profile.id;
  persist();
}

export function clearProfileCache() {
  cache = { ...EMPTY };
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}