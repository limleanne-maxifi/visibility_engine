// Single source of truth for the report price.
// SGD $250 is the Airspace World launch rate, valid through 30 June 2026 (Asia/Singapore).
// Price switches to SGD $450 on 1 July 2026 00:00 SGT (= 30 June 2026 16:00 UTC).

export const PRICE_LAUNCH   = 'SGD $250';
export const PRICE_STANDARD = 'SGD $450';

// UTC timestamp for the cutoff: 2026-07-01 00:00:00 Asia/Singapore = 2026-06-30 16:00:00 UTC
const LAUNCH_RATE_CUTOFF_MS = new Date('2026-06-30T16:00:00Z').getTime();

export function getReportPrice(now: Date = new Date()): string {
  return now.getTime() < LAUNCH_RATE_CUTOFF_MS ? PRICE_LAUNCH : PRICE_STANDARD;
}

export const STRIPE_LINK   = 'https://buy.stripe.com/8x2eVeciQf6W5wv6gh8og00';
export const CALENDLY_LINK = 'https://lunacal.ai/maxifidigital/';
