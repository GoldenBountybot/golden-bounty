// Warms and holds the current user's profile data (name, username, phone,
// bounty, transactions, game activity) so any page renders instantly.
// The cache is also mirrored into localStorage, so even a fresh app open /
// reload paints the account details immediately while fresh data loads behind.
import { base44 } from '@/api/base44Client';

const KEY = 'gb_profile_cache_v1';

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { profile: null, txs: null, activity: null };
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
      // Profile first so the name/id/bounty paint as early as possible.
      cache = { ...cache, profile: u };
      persist();
      const [t, a] = await Promise.all([
        base44.entities.Transaction.filter({ user_id: u.id }, '-created_date', 50),
        base44.entities.PlayerActivity.filter({ user_id: u.id }, '-created_date', 50),
      ]);
      cache = { profile: u, txs: t, activity: a };
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
  persist();
}

export function clearProfileCache() {
  cache = { profile: null, txs: null, activity: null };
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}