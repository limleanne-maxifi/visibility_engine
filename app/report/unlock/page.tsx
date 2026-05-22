// Stage 4 placeholder — Stripe checkout wired in next stage.
// Accessible at /report/unlock?token=<report_token>

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unlock Your Full Report · Maxifi Digital',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function UnlockPage({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--navy-header)' }}
    >
      <div className="max-w-md w-full text-center">
        {/* Logo / wordmark */}
        <p className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-8">
          Maxifi Digital · AI Visibility
        </p>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
          Unlock your full<br />AI Visibility Report
        </h1>
        <p className="text-sm text-white/60 mb-8 leading-relaxed">
          Your free teaser covers the assessment. The full report includes
          live engine-verified citation tests, competitor displacement analysis,
          and a 60-day prioritised action queue.
        </p>

        {/* Price + CTA — Stripe wired in Stage 4 */}
        <div
          className="rounded-2xl p-8 mb-6"
          style={{ background: 'var(--navy-sub)' }}
        >
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
            One-time payment
          </p>
          <p className="text-5xl font-bold text-white mb-1">$249</p>
          <p className="text-sm text-white/50 mb-6">No subscription. Full report, instant access.</p>

          <button
            disabled
            className="w-full py-4 rounded-xl font-semibold text-sm cursor-not-allowed opacity-60"
            style={{ background: 'var(--gold)', color: '#fff' }}
          >
            Payment coming soon
          </button>
          <p className="mt-3 text-xs text-white/30">Stripe checkout — available shortly</p>
        </div>

        {/* Fallback: book a call */}
        <p className="text-sm text-white/50">
          Want a walkthrough instead?{' '}
          <a
            href={`https://lunacal.ai/maxifidigital/${token ? `?token=${token}` : ''}`}
            className="font-semibold underline"
            style={{ color: 'var(--gold)' }}
          >
            Book a strategy call →
          </a>
        </p>

        {token && (
          <p className="mt-6 text-xs text-white/20 font-mono">ref: {token}</p>
        )}
      </div>
    </div>
  );
}
