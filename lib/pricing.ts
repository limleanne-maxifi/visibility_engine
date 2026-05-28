// Single source of truth for the report price.
// Launch rate (USD $190 / SGD $250) is the Airspace World rate, valid through
// 30 June 2026 (Asia/Singapore). Price switches to standard (USD $340 / SGD $450)
// on 1 July 2026 00:00 SGT (= 30 June 2026 16:00 UTC).
// Display is USD-primary with SGD as secondary subtext across all surfaces
// (see pricing/usd-primary branch). The PRICE_*_SGD exports are kept for the
// secondary display; do NOT remove without updating the call sites.

export const PRICE_LAUNCH       = 'USD $190';
export const PRICE_STANDARD     = 'USD $340';
export const PRICE_LAUNCH_SGD   = 'SGD $250';
export const PRICE_STANDARD_SGD = 'SGD $450';

// UTC timestamp for the cutoff: 2026-07-01 00:00:00 Asia/Singapore = 2026-06-30 16:00:00 UTC
const LAUNCH_RATE_CUTOFF_MS = new Date('2026-06-30T16:00:00Z').getTime();

export function getReportPrice(now: Date = new Date()): string {
  return now.getTime() < LAUNCH_RATE_CUTOFF_MS ? PRICE_LAUNCH : PRICE_STANDARD;
}

export const STRIPE_LINK   = 'https://buy.stripe.com/8x2eVeciQf6W5wv6gh8og00';
export const CALENDLY_LINK = 'https://lunacal.ai/maxifidigital/';
