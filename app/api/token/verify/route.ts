import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyReportToken, markTokenEmailVerified } from '@/lib/supabase-v2';

const SESSION_COOKIE = '__Host-rv_session';
const COOKIE_MAX_AGE = 7776000; // 90 days in seconds

const TokenParamSchema = z
  .string()
  .length(64)
  .regex(/^[0-9a-f]+$/);

function baseUrl(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const appUrl = baseUrl(req);
  const token  = new URL(req.url).searchParams.get('token') ?? '';

  // ── 1. Validate token format ────────────────────────────────────────────────
  const paramCheck = TokenParamSchema.safeParse(token);
  if (!paramCheck.success) {
    return NextResponse.json(
      { error: 'Invalid token format', code: 'INVALID_TOKEN' },
      { status: 400 },
    );
  }

  // ── 2. Verify token in DB ───────────────────────────────────────────────────
  let tokenResult: Awaited<ReturnType<typeof verifyReportToken>>;
  try {
    tokenResult = await verifyReportToken(token);
  } catch (err) {
    console.error('[token/verify] verifyReportToken error:', err);
    return NextResponse.redirect(new URL('/?error=invalid_token', appUrl));
  }

  if (!tokenResult.valid || !tokenResult.snapshotId) {
    console.log('[token/verify] invalid or expired token');
    return NextResponse.redirect(new URL('/?error=invalid_token', appUrl));
  }

  const { snapshotId } = tokenResult;

  // ── 3. Mark token as email-verified ─────────────────────────────────────────
  try {
    await markTokenEmailVerified(token);
    console.log('[token/verify] email verified — snapshot_id:', snapshotId);
  } catch (err) {
    console.error('[token/verify] markTokenEmailVerified error:', err);
    return NextResponse.redirect(new URL('/?error=invalid_token', appUrl));
  }

  // ── 4. Set session cookie ────────────────────────────────────────────────────
  // Value: base64url("{snapshot_id}:{token}")
  const cookieValue = Buffer.from(`${snapshotId}:${token}`).toString('base64url');

  const response = NextResponse.redirect(new URL(`/report/${snapshotId}`, appUrl), 302);

  response.cookies.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   COOKIE_MAX_AGE,
  });

  return response;
}
