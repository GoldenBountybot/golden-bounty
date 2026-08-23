// Warms and holds the current user's profile data (name, username, phone,
// bounty, transactions, game activity) in memory from the moment the app
// opens, so the Profile page renders instantly instead of fetching on entry.
import { base44 } from '@/api/base44Client';

let cache = { profile: null, txs: null, activity: null };
let inflight = null;

export function warmProfileCache() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const u = await base44.auth.me();
      const [t, a] = await Promise.all([
        base44.entities.Transaction.filter({ user_id: u.id }, '-created_date', 50),
        base44.entities.PlayerActivity.filter({ user_id: u.id }, '-created_date', 50),
      ]);
      cache = { profile: u, txs: t, activity: a };
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
}