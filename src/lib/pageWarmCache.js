// Preloads the remaining pages' datasets at app entry — banners, agents and
// referral stats — so Events, Agents and Referrals paint with no spinner.
import { base44 } from '@/api/base44Client';
import { getAccountKey } from '@/lib/accountKey';

const BANNER_KEY = 'gb_banner_cache_v1';
const AGENT_KEY = 'gb_agent_cache_v1';
const REFSTATS_KEY = 'gb_refstats_cache_v1';

function read(key, accountScoped) {
  try {
    const c = JSON.parse(localStorage.getItem(key));
    if (accountScoped) {
      const current = getAccountKey();
      if (!c?.account_key || !current || c.account_key !== current) return null;
    }
    return c?.data ?? null;
  } catch { /* ignore */ }
  return null;
}

export function getBannerCache() { return read(BANNER_KEY, false); }
export function getAgentCache() { return read(AGENT_KEY, false); }
export function getReferralStatsCache() { return read(REFSTATS_KEY, true); }

export async function warmBannerCache() {
  try {
    const rows = await base44.entities.Banner.filter({ active: true }, 'order', 50);
    localStorage.setItem(BANNER_KEY, JSON.stringify({ data: rows || [] }));
  } catch { /* ignore */ }
}

export async function warmAgentCache() {
  try {
    const rows = await base44.entities.AgentProfile.filter({ active: true }, '-created_date', 500);
    localStorage.setItem(AGENT_KEY, JSON.stringify({ data: rows || [] }));
  } catch { /* ignore */ }
}

export async function warmReferralStatsCache() {
  try {
    const res = await base44.functions.invoke('getReferralStats', {});
    if (res?.data && !res.data.error) {
      localStorage.setItem(REFSTATS_KEY, JSON.stringify({ account_key: getAccountKey(), data: res.data }));
    }
  } catch { /* ignore */ }
}
