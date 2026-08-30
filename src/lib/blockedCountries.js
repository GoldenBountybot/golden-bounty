// Country blocking is currently disabled — no country is blocked.
// Add entries here (e.g. US: 'United States') to block locations again.
export const BLOCKED_COUNTRIES = {};

export function isBlockedCountry(code) {
  return !!code && Object.prototype.hasOwnProperty.call(BLOCKED_COUNTRIES, String(code).toUpperCase());
}