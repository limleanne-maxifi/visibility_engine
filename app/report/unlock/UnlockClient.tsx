'use client';

import { useState } from 'react';

// ─── Pricing shape passed from server ────────────────────────────────────────

export interface PricingProps {
  foundingActive: boolean;
  activeCents: number;
  standardCents: number;
}

interface Props {
  token: string;
  entityName: string;
  industry: string;
  pricing: PricingProps;
  calendlyUrl: string;
}

// ─── What you get — the four locked sections ──────────────────────────────────

const UNLOCKED_SECTIONS = [
  {
    number: '05',
    title: 'Competitor Displacement Analysis',
    description:
      'Which competitors are winning your target queries, which platforms they\'re winning on, and the structural reason they\'re ahead — with query-level evidence.',
  },
  {
    number: '06',
    title: 'Positioning Gap Report',
    description:
      'The gap between what AI engines currently say about you and what you want to be known for — with specific, actionable fixes ranked by impact.',
  },
  {
    number: '07',
    title: 'Target Query Coverage',
    description:
      'Which queries you\'re winning and losing, with evidence from live AI engine tests across ChatGPT and Perplexity. Includes inaccuracy details and one-line fixes.',
  },
  {
    number: '08',
    title: '60-Day Action Queue',
    description:
      'A prioritised, week-by-week fix plan built from your actual gaps — not a generic checklist. Sequenced by impact, with effort estimates.',
  },
];

// ─── Format SGD cents → display string ───────────────────────────────────────

function formatSgd(cents: number): string {
  return `SGD $${(cents / 100).toLocaleString('en-SG')}`;
}

// ─── Payment trigger — THE ONLY FUNCTION THAT CHANGES WHEN STRIPE IS WIRED UP
//
// TODO (Stage 5): Replace the stub below with:
//   const res = await fetch(`/api/create-checkout-session?token=${token}`);
//   const { checkoutUrl } = await res.json();
//   window.location.href = checkoutUrl;
//
// No other part of this component needs to change.
// ─────────────────────────────────────────────────────────────────────────────

async function startCheckout(_token: string): Promise<'stub'> {
  // STUB — Stripe not yet configured.
  // When Stage 5 ships, replace this function body only.
  return 'stub';
}

// ─── Component ────────────────────────────────────────────────────────────────

type ButtonState = 'idle' | 'loading' | 'stub';

export default function UnlockClient({ token, entityName, industry, pricing, calendlyUrl }: Props) {
  const [btnState, setBtnState] = useState<ButtonState>('idle');

  const handlePayClick = async () => {
    setBtnState('loading');
    try {
      const result = await startCheckout(token);
      if (result === 'stub') {
        setBtnState('stub');
      }
    } catch {
      setBtnState('stub');
    }
  };

  const { foundingActive, activeCents, standardCents } = pricing;
  const activePrice    = formatSgd(activeCents);
  const standardPrice  = formatSgd(standardCents);

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{ background: 'var(--navy-header)' }}
    >
      <div className="max-w-xl mx-auto">

        {/* Wordmark */}
        <p className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-10 text-center">
          Maxifi Digital · AI Visibility
        </p>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
            Unlock the full report for {entityName}
          </h1>
          <p className="text-sm text-white/50">{industry}</p>
        </div>

        {/* What you get */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: 'var(--navy-sub)' }}
        >
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-5">
            What you get
          </p>
          <div className="space-y-5">
            {UNLOCKED_SECTIONS.map((s) => (
              <div key={s.number} className="flex gap-4">
                <span
                  className="text-xs font-bold mt-0.5 shrink-0 w-6 text-right"
                  style={{ color: 'var(--gold)' }}
                >
                  {s.number}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">{s.title}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The process */}
        <div
          className="rounded-2xl p-6 mb-6 border"
          style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
            The process
          </p>
          <p className="text-sm text-white/70 leading-relaxed">
            After payment, a Maxifi analyst runs your full cross-LLM analysis — testing your
            citations live across ChatGPT, Perplexity, Google AI Overviews, and Microsoft Copilot.
            Your complete report appears at this same link within{' '}
            <span className="text-white font-medium">5 business days</span>, and we&rsquo;ll email
            you when it&rsquo;s ready.
          </p>
        </div>

        {/* Pricing + CTA */}
        <div
          className="rounded-2xl p-8 mb-4"
          style={{ background: 'var(--navy-sub)' }}
        >
          {/* Price */}
          <div className="mb-6">
            {foundingActive ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                   style={{ color: 'var(--gold)' }}>
                  Founding client rate
                </p>
                <div className="flex items-baseline gap-3">
                  <p className="text-5xl font-bold text-white">{activePrice}</p>
                  <p className="text-lg text-white/30 line-through">{standardPrice}</p>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  Locked in for early clients — price rises when founding cohort closes.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">
                  One-time payment
                </p>
                <p className="text-5xl font-bold text-white">{activePrice}</p>
              </>
            )}
            <p className="text-xs text-white/40 mt-2">
              No subscription. Full report, delivered once.
            </p>
          </div>

          {/* CTA button */}
          {btnState === 'stub' ? (
            <div
              className="w-full py-4 px-6 rounded-xl text-center text-sm leading-snug"
              style={{ background: 'rgba(200,122,47,0.12)', color: 'var(--gold-text)', border: '1px solid rgba(200,122,47,0.3)' }}
            >
              <p className="font-semibold mb-0.5">Payment is being set up</p>
              <p className="text-xs opacity-80">
                You&rsquo;ll be able to complete your purchase here shortly.
                Email <a href="mailto:hello@maxifidigital.com" className="underline">hello@maxifidigital.com</a> to
                be notified the moment it&rsquo;s live.
              </p>
            </div>
          ) : (
            <button
              onClick={handlePayClick}
              disabled={btnState === 'loading'}
              className="w-full py-4 rounded-xl font-semibold text-sm transition-opacity"
              style={{
                background: 'var(--gold)',
                color: '#fff',
                opacity: btnState === 'loading' ? 0.7 : 1,
                cursor: btnState === 'loading' ? 'wait' : 'pointer',
              }}
            >
              {btnState === 'loading' ? 'One moment…' : 'Pay & unlock full report →'}
            </button>
          )}

          {/* Trust microcopy */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 justify-center">
            {['Analyst-reviewed — not automated', 'Secure card payment via Stripe', 'No subscription'].map((t) => (
              <p key={t} className="text-xs text-white/30 flex items-center gap-1">
                <span style={{ color: 'var(--gold)', opacity: 0.6 }}>✓</span> {t}
              </p>
            ))}
          </div>
        </div>

        {/* Back to free report + book a call */}
        <div className="text-center space-y-2">
          <p className="text-sm text-white/40">
            <a
              href={`/r/${token}`}
              style={{ color: 'var(--gold)' }}
              className="font-medium hover:underline"
            >
              ← Back to your free report
            </a>
          </p>
          <p className="text-sm text-white/30">
            Questions?{' '}
            <a
              href={`${calendlyUrl}?token=${token}`}
              style={{ color: 'rgba(255,255,255,0.5)' }}
              className="underline"
            >
              Book a 30-min walkthrough
            </a>
          </p>
        </div>

        {/* Token ref */}
        <p className="mt-10 text-center text-xs text-white/15 font-mono">ref: {token}</p>
      </div>
    </div>
  );
}
