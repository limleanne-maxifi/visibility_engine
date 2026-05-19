import { NextRequest, NextResponse } from 'next/server';

// ─── Per-endpoint limit constants (from system-design.md §5.2) ───────────────

export const RATE_LIMITS = {
  generate:        { limit: 3,  windowSeconds: 3600 }, // POST /api/generate        — key: IP
  gate:            { limit: 5,  windowSeconds: 3600 }, // POST /api/gate            — key: IP
  gateResend:      { limit: 2,  windowSeconds: 3600 }, // POST /api/gate/resend     — key: email hash
  reportFull:      { limit: 60, windowSeconds: 3600 }, // GET  /api/report/[id]/full — key: token
  stripeCheckout:  { limit: 5,  windowSeconds: 3600 }, // POST /api/stripe/checkout — key: IP
} as const;

// ─── In-process fallback store (single serverless instance / local dev) ───────

interface BucketEntry { count: number; resetAt: number }
const _store = new Map<string, BucketEntry>();

function inProcessCheck(
  key: string,
  limit: number,
  windowSeconds: number,
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = _store.get(key);

  if (!entry || now >= entry.resetAt) {
    _store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  return { allowed: true };
}

// ─── Upstash Redis REST pipeline call ────────────────────────────────────────
// Two commands in one round-trip: INCR (atomic counter) + EXPIRE (set TTL on
// first write; no-op on subsequent writes within the same window).

async function upstashCheck(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const url   = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, windowSeconds],
    ]),
  });

  if (!res.ok) {
    // On Upstash failure, fail open to avoid blocking legitimate requests
    return { allowed: true };
  }

  const data = (await res.json()) as Array<{ result: number }>;
  const count = data[0]?.result ?? 0;

  if (count > limit) {
    return { allowed: false, retryAfter: windowSeconds };
  }
  return { allowed: true };
}

// ─── checkRateLimit ───────────────────────────────────────────────────────────

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return upstashCheck(key, limit, windowSeconds);
  }
  return inProcessCheck(key, limit, windowSeconds);
}

// ─── withRateLimit helper ─────────────────────────────────────────────────────
// Returns a 429 NextResponse if the limit is exceeded, otherwise null.
// Usage: const limited = await withRateLimit(req, 3, 3600, r => r.ip ?? 'unknown');
//        if (limited) return limited;

export async function withRateLimit(
  req: NextRequest,
  limit: number,
  windowSeconds: number,
  keyFn: (req: NextRequest) => string,
): Promise<NextResponse | null> {
  const key = keyFn(req);
  const result = await checkRateLimit(key, limit, windowSeconds);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(result.retryAfter ?? windowSeconds) },
      },
    );
  }
  return null;
}
