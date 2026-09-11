// Single entry point that preloads EVERY account-level dataset before the app
// opens: profile (name, username, phone, bounty), transactions, game history,
// wallet balance, stake numbers and notifications. The loading screen waits for
// all of it, so no page ever shows data arriving after entry.
import { warmProfileCache } from '@/lib/profileCache';
import { warmStakeCache } from '@/lib/useStake';
import { warmNotificationCache } from '@/lib/notificationCache';
import { warmBannerCache, warmAgentCache, warmReferralStatsCache } from '@/lib/pageWarmCache';

export function warmAllAccountData() {
  return Promise.all([
    warmProfileCache(),
    warmStakeCache(),
    warmNotificationCache(),
    warmBannerCache(),
    warmAgentCache(),
    warmReferralStatsCache(),
  ].map((p) => Promise.resolve(p).catch(() => null)));
}