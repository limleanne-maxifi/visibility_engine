import { notFound } from 'next/navigation';
import { getLeadById } from '@/lib/supabase';
import CopyLinkButton from './CopyLinkButton';

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function getVisibilityScore(awareness: string): number {
  const map: Record<string, number> = {
    "No, I haven't tried this yet": 0,
    'Yes — and the results were accurate': 72,
    "Yes — but I wasn't mentioned at all": 8,
    'Yes — but details about me were wrong': 24,
    'Yes — competitors were cited instead of me': 17,
    'Yes — but old/outdated info appeared': 31,
  };
  return map[awareness] ?? 0;
}

type FailureMode = {
  label: string;
  description: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
};

function getFailureMode(awareness: string): FailureMode {
  switch (awareness) {
    case "Yes — but I wasn't mentioned at all":
      return {
        label: 'INVISIBILITY',
        description:
          "AI engines have no reliable, citable information about you. You're not structured in a way AI can surface — regardless of how strong your work is.",
        bgClass: 'bg-red-50', textClass: 'text-red-700', borderClass: 'border-red-200',
      };
    case 'Yes — but details about me were wrong':
      return {
        label: 'HALLUCINATION',
        description:
          'AI engines reference you but pull inaccurate or conflated details. Missing entity schema and ambiguous authority signals let the model fill gaps with wrong information.',
        bgClass: 'bg-orange-50', textClass: 'text-orange-700', borderClass: 'border-orange-200',
      };
    case 'Yes — competitors were cited instead of me':
      return {
        label: 'DISPLACEMENT',
        description:
          "Competitors have structured, citable content AI engines prefer. You're present in the training data but losing the citation race — every query a competitor wins is a lead you didn't get.",
        bgClass: 'bg-red-50', textClass: 'text-red-700', borderClass: 'border-red-200',
      };
    case 'Yes — but old/outdated info appeared':
      return {
        label: 'STALENESS',
        description:
          "AI engines cite you but with outdated information. Your content freshness and entity-update signals are weak — AI is citing a version of you that no longer exists.",
        bgClass: 'bg-amber-50', textClass: 'text-amber-700', borderClass: 'border-amber-200',
      };
    default:
      return {
        label: 'UNDIAGNOSED',
        description:
          "Your AI visibility status hasn't been assessed yet. The score above is an estimated baseline for your industry. Search for your company name in ChatGPT or Perplexity to confirm your failure mode.",
        bgClass: 'bg-gray-50', textClass: 'text-gray-600', borderClass: 'border-gray-200',
      };
  }
}

// ─── Benchmark helpers ────────────────────────────────────────────────────────

const INDUSTRY_BENCHMARKS: Record<string, number> = {
  'Financial Services & Banking': 47,
  'Fintech / Financial Technology': 47,
  'Accounting & Finance': 47,
  'Legal': 62,
  'Professional Services': 54,
  'Consulting & Advisory': 54,
  'Healthcare & Life Sciences': 78,
  'B2B SaaS / Enterprise Software': 84,
  'AI & Machine Learning': 84,
  'Cybersecurity': 84,
  'Cloud Infrastructure': 84,
  'Marketing Technology': 63,
  'Aviation & Aerospace': 41,
  'Defense': 41,
  'Education & Training': 52,
  'Media & Publishing': 58,
  'Real Estate & Property': 35,
  'Retail & E-commerce': 48,
  'Hospitality & Travel': 42,
  'Manufacturing & Industrial': 38,
};

function getIndustryBenchmark(industry: string): number {
  return INDUSTRY_BENCHMARKS[industry] ?? 38;
}

function getPercentile(score: number, avg: number): number {
  if (score === 0) return 8;
  if (score >= avg) return Math.min(95, Math.round(50 + ((score - avg) / (100 - avg)) * 45));
  return Math.max(5, Math.round((score / avg) * 45));
}

function getUplift(score: number): number {
  return Math.round((100 - score) * 0.58);
}

// ─── Platform matrix ──────────────────────────────────────────────────────────

const ALL_PLATFORMS = ['ChatGPT', 'Google AI Overviews', 'Perplexity', 'Claude', 'Gemini'];

type PlatformStatus = 'cited' | 'displaced' | 'missing' | 'inaccurate' | 'stale' | 'unknown';

function getPlatformStatuses(
  awareness: string,
  primary: string,
  secondary: string | null,
): Record<string, PlatformStatus> {
  const out: Record<string, PlatformStatus> = {};
  for (const p of ALL_PLATFORMS) out[p] = 'unknown';

  const mark = (status: PlatformStatus) => {
    if (primary && ALL_PLATFORMS.includes(primary)) out[primary] = status;
    if (secondary && ALL_PLATFORMS.includes(secondary)) out[secondary] = status;
  };

  switch (awareness) {
    case 'Yes — and the results were accurate':           mark('cited');      break;
    case "Yes — but I wasn't mentioned at all":           mark('missing');    break;
    case 'Yes — but details about me were wrong':         mark('inaccurate'); break;
    case 'Yes — competitors were cited instead of me':    mark('displaced');  break;
    case 'Yes — but old/outdated info appeared':          mark('stale');      break;
  }
  return out;
}

const PLATFORM_STATUS_STYLES: Record<PlatformStatus, { label: string; cls: string }> = {
  cited:      { label: 'Cited ✓',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  displaced:  { label: 'Competitor',  cls: 'bg-red-100 text-red-700 border-red-200' },
  missing:    { label: 'Not found',   cls: 'bg-red-100 text-red-700 border-red-200' },
  inaccurate: { label: 'Inaccurate',  cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  stale:      { label: 'Stale',       cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  unknown:    { label: 'Not checked', cls: 'bg-gray-100 text-gray-400 border-gray-200' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ResultsPage({ params }: Props) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const plan        = { steps: lead.plan_steps, quickWin: lead.plan_quick_win };
  const calendlyUrl = process.env.CALENDLY_URL ?? '#';
  const contactEmail = process.env.MAXIFI_CONTACT_EMAIL ?? 'letsgetstarted@maxifidigital.com';

  const score       = getVisibilityScore(lead.awareness);
  const failureMode = getFailureMode(lead.awareness);
  const benchAvg    = getIndustryBenchmark(lead.industry);
  const percentile  = getPercentile(score, benchAvg);
  const uplift      = getUplift(score);
  const platforms   = getPlatformStatuses(lead.awareness, lead.platform, lead.platform_other);

  const challenges      = lead.challenge.split(';').map((c) => c.trim()).filter(Boolean);
  const hasDisplacement = challenges.some((c) => c.includes("My competitors show up"));
  const hasTopicGoal    = challenges.some((c) => c.includes('specific topics'));
  const queryCount      = hasTopicGoal ? 4 : 3;
  const fixCount        = plan.steps.length;

  const entityName = lead.company_name ?? lead.first_name;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-[640px] mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEDFE] text-[#3C3489] text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-[#534AB7]" />
            Maxifi Digital · AEO Visibility Snapshot
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {entityName}&rsquo;s AEO snapshot
          </h1>
          <p className="mt-1 text-gray-500">
            {lead.occupation} · {lead.industry}
          </p>
        </div>

        {/* ── ZONE 1: FREE ── */}

        {/* Visibility score */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            AI Visibility Score
          </p>
          <div className="flex items-end gap-4 mb-4">
            <span className="text-6xl font-bold text-gray-900 leading-none">
              {score > 0 ? `${score}%` : '—'}
            </span>
            <div className="pb-1 space-y-0.5">
              <p className="text-sm text-gray-400">vs {benchAvg}% industry average</p>
              {uplift > 0 && (
                <p className="text-sm font-semibold text-emerald-600">
                  +{uplift}% potential uplift if fixed
                </p>
              )}
            </div>
          </div>
          <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute top-0 h-full w-px bg-gray-400 z-10"
              style={{ left: `${benchAvg}%` }}
            />
            <div
              className={`h-full rounded-full ${score < benchAvg ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.max(score, 1)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5">
            <span>0%</span>
            <span>↑ industry avg ({benchAvg}%)</span>
            <span>100%</span>
          </div>
        </div>

        {/* Failure mode */}
        <div className={`rounded-xl border ${failureMode.borderClass} ${failureMode.bgClass} p-6 mb-4`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Primary failure mode
          </p>
          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded border mb-3 ${failureMode.bgClass} ${failureMode.textClass} ${failureMode.borderClass}`}>
            {failureMode.label}
          </span>
          <p className={`text-sm leading-relaxed ${failureMode.textClass}`}>
            {failureMode.description}
          </p>
        </div>

        {/* Platform citation matrix */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Citation status by platform
          </p>
          <div className="space-y-3">
            {ALL_PLATFORMS.map((platform) => {
              const s = PLATFORM_STATUS_STYLES[platforms[platform]];
              return (
                <div key={platform} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{platform}</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${s.cls}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
            Status reflects platforms you identified. The full report includes a live crawl across all 5 engines.
          </p>
        </div>

        {/* Benchmark percentile */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Vertical benchmark percentile
          </p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-bold text-gray-900">{percentile}th</span>
            <span className="text-gray-500 text-sm">percentile</span>
          </div>
          <p className="text-sm text-gray-500">
            for {lead.industry || 'your industry'} —{' '}
            {percentile < 33
              ? 'significantly below average for your vertical'
              : percentile < 60
              ? 'below average for your vertical'
              : 'at or above average for your vertical'}
          </p>
        </div>

        {/* Competitor teaser — only when displacement is a named challenge */}
        {hasDisplacement && (
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6 mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Competitor displacement
            </p>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-4 w-32 rounded bg-gray-200 blur-[2px]" aria-hidden />
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-600 border border-red-200">
                    🔒 Gated
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  is consistently cited instead of you across your primary queries.
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
              Unlock the full report to see every competitor, every query, and every platform — side by side.
            </p>
          </div>
        )}

        {/* ── UPGRADE CARD ── */}
        <div className="rounded-xl border-2 border-[#6B5DD3] bg-white p-6 mb-4">
          <p className="text-xs font-semibold text-[#6B5DD3] uppercase tracking-wide mb-3">
            Visibility Engine Report
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-3 leading-snug">
            Your competitors are winning {queryCount} of your priority queries. Your free snapshot shows the gap — your Visibility Engine Report shows exactly why, and gives you a step-by-step fix queue to close it.
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            One report. $250. No subscription, no sales call, no guesswork. Most clients recover their first query position within 30 days of implementing the fixes.
          </p>
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3 px-5 bg-[#6B5DD3] hover:bg-[#5a4ec2] text-white text-sm font-semibold rounded-lg transition-colors mb-4"
          >
            Get My Visibility Engine Report — $250
          </a>
          <p className="text-xs text-gray-400 leading-relaxed">
            Once the gaps are closed, AI citations shift 40–60% every month — your competitors are already tracking theirs. Visibility Monitor keeps you ahead.{' '}
            <span className="font-medium text-gray-500">$500/month, cancel anytime.</span>{' '}
            <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="text-[#6B5DD3] underline">
              Learn about Visibility Monitor →
            </a>
          </p>
        </div>

        {/* ── ZONE 2: LOCKED ── */}
        <div className="relative mb-8">

          {/* Skeleton placeholder rows */}
          <div className="space-y-3 blur-sm select-none pointer-events-none opacity-50" aria-hidden>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="h-5 w-12 bg-[#EEEDFE] rounded mb-3" />
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-5/6" />
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                </div>
              </div>
            ))}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
              <div className="h-3 w-20 bg-emerald-200 rounded mb-3" />
              <div className="h-3 bg-emerald-100 rounded w-full mb-1.5" />
              <div className="h-3 bg-emerald-100 rounded w-4/5" />
            </div>
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 px-8 py-7 text-center max-w-xs w-full mx-4">
              <div className="w-10 h-10 rounded-full bg-[#EEEDFE] flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-[#6B5DD3]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">
                Your full action plan — {fixCount} prioritised fixes identified
              </p>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Schema gaps, content structure, entity recommendations, and your full 60-day action queue.
              </p>
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 px-5 bg-[#6B5DD3] hover:bg-[#5a4ec2] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Unlock Full Report — $250
              </a>
            </div>
          </div>
        </div>

        {/* Share */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Share this snapshot</h2>
          <p className="text-gray-500 text-sm mb-4">
            Send this link to a colleague or bookmark it — it&rsquo;s persistent.
          </p>
          <CopyLinkButton />
        </div>

        {/* Strategy call line */}
        <p className="text-center text-sm text-gray-500 mb-6">
          Want Maxifi to implement this for you?{' '}
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6B5DD3] font-semibold hover:underline"
          >
            Book a strategy call →
          </a>
        </p>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          Snapshot generated by{' '}
          <a href="https://maxifidigital.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
            Maxifi Digital
          </a>
          {' · '}Benchmarks based on aggregate industry research{' · '}
          <a href={`mailto:${contactEmail}`} className="underline hover:text-gray-600">
            Unsubscribe from emails anytime
          </a>
        </p>

      </div>
    </div>
  );
}
