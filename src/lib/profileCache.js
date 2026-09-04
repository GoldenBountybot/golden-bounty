// Warms and holds the current user's profile data (name, username, phone,
// bounty, transactions, game activity) so any page renders instantly.
// The cache is mirrored into localStorage AND tagged with the owner's user id,
// so a fresh app open paints instantly — but switching accounts (multiple
// Telegram accounts on one device) never shows the previous account's details.
import { base44 } from '@/api/base44Client';
import { getCurrentUserIdSync } from '@/lib/currentUserId';
import { getAccountKey } from '@/lib/accountKey';

const KEY = 'gb_profile_cache_v1';
const EMPTY = { user_id: null, account_key: null, profile: null, txs: null, activity: null };

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const c = JSON.parse(raw);
      const current = getAccountKey();
      // Only trust the cache when it belongs to the account open RIGHT NOW
      // (Telegram account id when inside Telegram — correct the instant the
      // user switches account, unlike the stored session).
      if (c?.account_key && current && c.account_key === current) return c;
    }
  } catch { /* ignore */ }
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  return { ...EMPTY };
};

let cache = read();
let inflight = null;
const listeners = new Set();

const persist = () => {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* ignore */ }
};
const notify = () => listeners.forEach((l) => { try { l(cache); } catch { /* ignore */ } });

// Any page/component can subscribe and re-render the moment fresh data lands,
// instead of firing its own duplicate requests.
export function subscribeProfileCache(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function warmProfileCache() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      // The user id is already known synchronously from the stored session, so
      // the history queries start IMMEDIATELY — in parallel with me() — instead
      // of waiting a full round-trip for the profile first.
      // Only reuse the stored session id when it belongs to the account open
      // right now — after a Telegram account switch it's still the previous
      // account, and fetching its history would flash the old details.
      const accountKey = getAccountKey();
      const knownId = cache.account_key && cache.account_key === accountKey
        ? getCurrentUserIdSync()
        : null;
      const histFor = (id) => Promise.all([
        base44.entities.Transaction.filter({ user_id: id }, '-created_date', 50),
        base44.entities.PlayerActivity.filter({ user_id: id }, '-created_date', 50),
      ]);
      const earlyHist = knownId ? histFor(knownId).catch(() => null) : null;

      const u = await base44.auth.me();
      // A different account than the cached one → drop the stale data instead
      // of showing it alongside the new user's.
      if (cache.user_id && cache.user_id !== u.id) cache = { ...EMPTY };
      // Inside Telegram, ignore a profile that isn't the account currently
      // open (re-auth for the new account may still be in flight).
      const liveKey = getAccountKey();
      if (liveKey?.startsWith('tg:') && u.telegram_id && liveKey !== 'tg:' + String(u.telegram_id)) {
        cache = { ...EMPTY };
        notify();
        return;
      }
      cache = { ...cache, user_id: u.id, account_key: liveKey, profile: u };
      persist();
      notify();

      const hist = (earlyHist && knownId === u.id) ? await earlyHist : null;
      const [t, a] = hist || await histFor(u.id);
      cache = { user_id: u.id, account_key: liveKey, profile: u, txs: t, activity: a };
      persist();
      notify();
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
  if (patch.profile?.id) {
    cache.user_id = patch.profile.id;
    cache.account_key = getAccountKey();
  }
  persist();
  notify();
}

export function clearProfileCache() {
  cache = { ...EMPTY };
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  notify();
}