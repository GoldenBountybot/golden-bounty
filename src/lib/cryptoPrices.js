import { base44 } from '@/api/base44Client';

// Returns { bnb, eth, ton } USD prices, cached 60s. Falls back to last good
// cache on error so the deposit flow keeps working during brief API hiccups.
let cache = null;
let cacheAt = 0;

export async function getCryptoPrices() {
  if (cache && Date.now() - cacheAt < 60000) return cache;
  try {
    const res = await base44.functions.invoke('getCryptoPrices', {});
    const prices = res?.data?.prices || {};
    if (prices.bnb || prices.eth || prices.ton || prices.sol) {
      cache = { ...(cache || {}), ...prices };
      cacheAt = Date.now();
    }
    return cache || prices;
  } catch {
    return cache || {};
  }
}