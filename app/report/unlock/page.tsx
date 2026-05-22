import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getLeadByToken } from '@/lib/supabase';
import UnlockClient, { type PricingProps } from './UnlockClient';

export const metadata: Metadata = {
  title: 'Unlock Full Report · Maxifi Digital',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

// ─── Pricing — read from env on the server, never exposed to the client bundle

function getPricing(): PricingProps {
  const standardCents  = parseInt(process.env.PRICE_STANDARD_CENTS ?? '250000', 10);
  const foundingCents  = parseInt(process.env.PRICE_FOUNDING_CENTS ?? '180000', 10);
  const foundingActive = process.env.FOUNDING_ACTIVE === 'true';
  return {
    foundingActive,
    activeCents:   foundingActive ? foundingCents : standardCents,
    standardCents,
  };
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorPage({ message }: { message: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--navy-header)' }}
    >
      <div className="max-w-sm w-full text-center">
        <p className="text-xs font-semibold tracking-widest text-white/30 uppercase mb-6">
          Maxifi Digital · AI Visibility
        </p>
        <h1 className="text-xl font-bold text-white mb-3">Report not found</h1>
        <p className="text-sm text-white/50 mb-8 leading-relaxed">{message}</p>
        <a
          href="/"
          className="text-sm font-medium underline"
          style={{ color: 'var(--gold)' }}
        >
          ← Back to the visibility check
        </a>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UnlockPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <ErrorPage message="No report token was provided. Check the link in your email and try again." />
    );
  }

  let lead;
  try {
    lead = await getLeadByToken(token);
  } catch {
    return (
      <ErrorPage message="We couldn't load your report right now. Please try again in a moment or email hello@maxifidigital.com." />
    );
  }

  if (!lead) {
    return (
      <ErrorPage message="This report link isn't valid or has expired. Check the link in your email, or email hello@maxifidigital.com if you need help." />
    );
  }

  // Already paid → send them straight to the full report
  if (lead.paid) {
    redirect(`/r/${token}`);
  }

  const pricing    = getPricing();
  const entityName = lead.company_name ?? lead.first_name;
  const calendlyUrl = process.env.CALENDLY_URL ?? 'https://lunacal.ai/maxifidigital/';

  return (
    <UnlockClient
      token={token}
      entityName={entityName}
      industry={lead.industry}
      pricing={pricing}
      calendlyUrl={calendlyUrl}
    />
  );
}
