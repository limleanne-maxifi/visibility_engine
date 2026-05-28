import Image from 'next/image';
import ScoreCircle from './ScoreCircle';
import LockedSection from './LockedSection';
import type {
  ReportData,
  ScoreData,
  FailureModeKey,
  PlatformPriority,
  AlignmentLevel,
  GapSeverity,
  QueryStatus,
  ActionCategory,
} from '@/lib/reportTypes';

// ─── Style helpers ────────────────────────────────────────────────────────────
// (S1 platform-status styles removed alongside the S1 platform table — see
// S1Visibility note. Option A will reintroduce a status presentation for the
// single real-query proof; shape TBD.)

const FAILURE_MODE_STYLES: Record<FailureModeKey, { bg: string; text: string }> = {
  'not-cited':             { bg: '#FEF2F2', text: '#991B1B' },
  'competitor-displaced':  { bg: '#FFF7ED', text: '#9A3412' },
  'cited-inaccurately':    { bg: '#FFFBEB', text: '#92400E' },
  'cited-stale':           { bg: '#FFFBEB', text: '#92400E' },
  'low-query-coverage':    { bg: '#FFFBEB', text: '#92400E' },
  'platform-inconsistent': { bg: '#FFF7ED', text: '#9A3412' },
  'well-positioned':       { bg: '#ECFDF5', text: '#065F46' },
  'untested':              { bg: '#F9FAFB', text: '#6B7280' },
};

const PRIORITY_STYLES: Record<PlatformPriority, { label: string; bg: string; text: string }> = {
  primary:   { label: 'Primary',   bg: '#FDF1E6', text: '#C87A2F' },
  secondary: { label: 'Secondary', bg: '#EFF6FF', text: '#1D4ED8' },
  monitor:   { label: 'Monitor',   bg: '#F9FAFB', text: '#6B7280' },
};

const ALIGNMENT_STYLES: Record<AlignmentLevel, { label: string; bg: string; text: string }> = {
  strong:  { label: 'Strong alignment',   bg: '#ECFDF5', text: '#065F46' },
  partial: { label: 'Partial alignment',  bg: '#FFFBEB', text: '#92400E' },
  weak:    { label: 'Weak alignment',     bg: '#FFF7ED', text: '#9A3412' },
  missing: { label: 'Alignment missing',  bg: '#FEF2F2', text: '#991B1B' },
};

const GAP_SEVERITY_STYLES: Record<GapSeverity, { label: string; bg: string; text: string }> = {
  high:   { label: 'High',   bg: '#FEF2F2', text: '#991B1B' },
  medium: { label: 'Medium', bg: '#FFFBEB', text: '#92400E' },
  low:    { label: 'Low',    bg: '#ECFDF5', text: '#065F46' },
};

const QUERY_STATUS_STYLES: Record<QueryStatus, { label: string; bg: string; text: string }> = {
  present:            { label: 'Cited ✓',            bg: '#ECFDF5', text: '#065F46' },
  'competitor-cited': { label: 'Competitor cited',    bg: '#FFF7ED', text: '#9A3412' },
  'not-appearing':    { label: 'Not appearing',       bg: '#FEF2F2', text: '#991B1B' },
  inaccurate:         { label: 'Cited — inaccurate',  bg: '#FFFBEB', text: '#92400E' },
};

const ACTION_CATEGORY_STYLES: Record<ActionCategory, { label: string; color: string }> = {
  content:     { label: 'Content',     color: '#1D4ED8' },
  authority:   { label: 'Authority',   color: '#7C3AED' },
  technical:   { label: 'Technical',   color: '#0F766E' },
  competitive: { label: 'Competitive', color: '#C87A2F' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionBadge({ n, free }: { n: number; free: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
        style={{ background: '#FDF1E6', color: '#C87A2F' }}
      >
        {n}
      </span>
      {free ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
          <svg width="9" height="9" viewBox="0 0 10 8" fill="none" aria-hidden="true">
            <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Free
        </span>
      ) : (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: '#C87A2F' }}
        >
          <svg width="8" height="9" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
          Full report
        </span>
      )}
    </div>
  );
}

function SectionCard({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="bg-white rounded-2xl px-6 pt-5 pb-6 mb-6">
      {children}
    </section>
  );
}

function StatusPill({ status, styles }: { status: string; styles: { label: string; bg: string; text: string } }) {
  return (
    <span
      className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
      style={{ background: styles.bg, color: styles.text }}
    >
      {styles.label}
    </span>
  );
}

// ─── TOC ─────────────────────────────────────────────────────────────────────

const TOC_ITEMS = [
  { n: 1, label: 'Visibility Assessment',                       free: true },
  { n: 2, label: 'Failure Mode Diagnosis',                      free: true },
  { n: 3, label: 'Platform Priority Overview',                  free: true },
  { n: 4, label: 'Positioning vs. Sector',                      free: true },
  { n: 5, label: "Who AI mentions when you're not named",       free: false },
  { n: 6, label: 'How AI describes you',                        free: false },
  { n: 7, label: 'Query coverage',                              free: false },
  { n: 8, label: 'Sentiment, rank & citation health',           free: false },
];

function TableOfContents({ paid }: { paid: boolean }) {
  return (
    <SectionCard id="toc">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
        Report contents
      </h2>
      <ol className="space-y-2.5">
        {TOC_ITEMS.map((item) => {
          const isLocked = !item.free && !paid;
          return (
            <li key={item.n} className="flex items-center gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: item.free ? '#ECFDF5' : '#FDF1E6', color: item.free ? '#065F46' : '#C87A2F' }}>
                {item.n}
              </span>
              <a
                href={`#section-${item.n}`}
                className={`flex-1 text-sm transition-colors ${isLocked ? 'text-gray-400' : 'text-gray-700 hover:text-gray-900'}`}
              >
                {item.label}
              </a>
              {item.free ? (
                <span className="flex-shrink-0 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                  Free
                </span>
              ) : paid ? (
                <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#C87A2F' }}>
                  Included
                </span>
              ) : (
                <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  <svg width="8" height="9" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                  Locked
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}

// ─── Section 1: Visibility Assessment ────────────────────────────────────────
// S1 PLACEHOLDER — Option A (real single-query proof) replaces this next sprint.
// See PROJECT_STATE §0b.2. Until Option A is wired, S1 renders an honest static
// callout instead of the prior self-reported platform table — the table implied
// per-platform measurement we don't have on the free path.
// `data` prop retained on the type for forward compat with Option A.

function S1Visibility({ paid }: { data: ReportData['s1Visibility']; paid: boolean }) {
  return (
    <SectionCard id="section-1">
      <SectionBadge n={1} free />
      <h2 className="text-lg font-bold text-gray-900 mb-3">Where this report stands</h2>
      <p className="text-sm text-gray-700 leading-relaxed">
        The sections below report what you told us and what that pattern usually means.
        They are not measured. The Full Report runs 50 buyer-intent queries × 4 engines
        and shows you the actual responses.
      </p>

      {paid && (
        <p className="mt-4 text-[11px] text-gray-400 leading-relaxed italic border-t border-gray-100 pt-3">
          Section 1 reflects our initial assessment; see Sections 5–7 for engine-measured results.
        </p>
      )}
    </SectionCard>
  );
}

// ─── Section 2: Failure Mode Diagnosis ───────────────────────────────────────

function S2Diagnosis({ data }: { data: ReportData['s2Diagnosis'] }) {
  const modeStyles = FAILURE_MODE_STYLES[data.failureMode];
  return (
    <SectionCard id="section-2">
      <SectionBadge n={2} free />
      <div className="flex flex-wrap items-start gap-3 mb-3">
        <h2 className="text-lg font-bold text-gray-900 leading-snug flex-1">{data.headline}</h2>
        <span
          className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: modeStyles.bg, color: modeStyles.text }}
        >
          {data.modeLabel}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-5 leading-relaxed">{data.explanation}</p>

      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
        Likely contributing factors
      </h3>
      <ol className="space-y-3 mb-5">
        {data.rootCauses.map((cause, i) => (
          <li key={i} className="flex gap-3">
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5"
              style={{ background: '#FDF1E6', color: '#C87A2F' }}
            >
              {i + 1}
            </span>
            <p className="text-sm text-gray-700 leading-relaxed">{cause}</p>
          </li>
        ))}
      </ol>

      <div className="rounded-xl p-4" style={{ background: '#F9FAFB', borderLeft: '3px solid #C87A2F' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#C87A2F' }}>
          What this likely means
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{data.likelyImpact}</p>
      </div>
    </SectionCard>
  );
}

// ─── Section 3: Platform Priority ────────────────────────────────────────────

const BUYER_PRESENCE_BAR: Record<string, number> = { high: 100, medium: 60, low: 30 };

function S3Platforms({ data }: { data: ReportData['s3Platforms'] }) {
  return (
    <SectionCard id="section-3">
      <SectionBadge n={3} free />
      <h2 className="text-lg font-bold text-gray-900 mb-1">{data.headline}</h2>
      <p className="text-sm text-gray-500 mb-5 leading-relaxed">{data.summary}</p>

      <div className="space-y-3">
        {data.platforms.map((row) => {
          // Not-measured-deferred: AIO + Copilot. RESOLVED-4 in CLAUDE.md keeps the
          // platform vocabulary at 6, but only the 4 API-callable engines render with
          // priority + buyer presence. The deferred two render with a Retainer label.
          if (row.measurementState === 'not-measured-deferred') {
            return (
              <div
                key={row.platform}
                className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-sm font-semibold text-gray-700">{row.platform}</span>
                  <span
                    className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ background: '#F3F4F6', color: '#6B7280' }}
                  >
                    Not measured
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Not measured in this report — included in the Visibility Engine Retainer (SGD 4,500/mo).
                </p>
              </div>
            );
          }

          const pStyles = PRIORITY_STYLES[row.priority];
          const barWidth = BUYER_PRESENCE_BAR[row.buyerPresence] ?? 50;
          return (
            <div key={row.platform} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-sm font-semibold text-gray-800">{row.platform}</span>
                <StatusPill status={row.priority} styles={pStyles} />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{row.rationale}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-28 flex-shrink-0">Buyer use in sector</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${barWidth}%`, background: '#C87A2F' }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 w-10 text-right">{row.buyerPresence}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] text-gray-400 leading-relaxed border-t border-gray-100 pt-3">
        {data.priorityNote}
      </p>
    </SectionCard>
  );
}

// ─── Section 4: Positioning Assessment ───────────────────────────────────────

function S4Positioning({ data }: { data: ReportData['s4Positioning'] }) {
  const aStyles = ALIGNMENT_STYLES[data.alignmentLevel];
  return (
    <SectionCard id="section-4">
      <SectionBadge n={4} free />
      <h2 className="text-lg font-bold text-gray-900 mb-1">{data.headline}</h2>
      <p className="text-sm text-gray-500 mb-5 leading-relaxed">{data.sectorContext}</p>

      {/* Positioning statement */}
      <div className="rounded-xl p-4 mb-4" style={{ background: '#F9FAFB' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
          Your stated positioning
        </p>
        <p className="text-sm font-semibold text-gray-800 italic">
          &ldquo;{data.entityPositioning}&rdquo;
        </p>
        <div className="mt-2">
          <StatusPill status={data.alignmentLevel} styles={aStyles} />
        </div>
      </div>

      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
        Our analysis suggests
      </h3>
      <ul className="space-y-2.5 mb-5">
        {data.observations.map((obs, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300" />
            <p className="text-sm text-gray-700 leading-relaxed">{obs}</p>
          </li>
        ))}
      </ul>

      <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#C87A2F' }}>
        Opportunities identified
      </h3>
      <ul className="space-y-2.5 mb-4">
        {data.opportunities.map((opp, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="flex-shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="7" fill="#FDF1E6" />
                <path d="M4 7l2 2 4-4" stroke="#C87A2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="text-sm text-gray-700 leading-relaxed">{opp}</p>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-gray-400 leading-relaxed border-t border-gray-100 pt-3">
        {data.assessmentCaveat}
      </p>
    </SectionCard>
  );
}

// ─── Paywall block ────────────────────────────────────────────────────────────

function PaywallBlock({ data }: { data: ReportData }) {
  const unlockHref = `/report/unlock?token=${data.meta.token}`;
  return (
    <div className="my-8">
      {/* Gold divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px" style={{ background: 'rgba(200,122,47,0.3)' }} />
        <span
          className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{ background: '#FDF1E6', color: '#C87A2F' }}
        >
          Full report
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(200,122,47,0.3)' }} />
      </div>

      {/* Paywall card */}
      <div
        className="rounded-2xl p-6 sm:p-8"
        style={{ background: 'var(--navy-header)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: '#C87A2F' }}
        >
          What&rsquo;s in your full report
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-snug">
          The four sections below show the rest of what we measured.
        </h2>
        <p className="text-sm text-white/60 mb-4 leading-relaxed">
          Your free snapshot is the headline. The Full Report opens the per-query × per-engine matrix,
          the entities AI names instead of you, how AI describes your brand when it does name you,
          and the limitations of each measurement so you can read it honestly.
        </p>
        <p className="text-xs text-white/45 mb-6 leading-relaxed">
          <span className="font-semibold text-white/65">Not in this report:</span> a 60-day action plan,
          a recommended positioning sentence, content briefs per query, competitor counter-moves, or
          owner/ETA assignments — those are consulting deliverables, included in the SGD 2,500 Strategic
          Baseline + Consult.
        </p>

        <ul className="space-y-2.5 mb-6">
          {[
            { n: 5, label: "Who AI mentions when you're not named", desc: 'For each competitor you seeded, how often AI mentioned them across the queries where your brand was not named — by engine and category.' },
            { n: 6, label: 'How AI describes you', desc: 'Verbatim extracts of how each engine described your brand on the queries where it named you, compared to the positioning you submitted.' },
            { n: 7, label: 'Query coverage', desc: 'The full 50 buyer-intent queries × 4 engines matrix. Per query: which engines named you, which didn’t, and whether a source was cited.' },
            { n: 8, label: 'Sentiment, rank & citation health', desc: 'Sentiment distribution, rank when named, citation rate per engine and category, plus the limitations of each signal called out.' },
          ].map((item) => (
            <li key={item.n} className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5"
                style={{ background: 'rgba(200,122,47,0.2)', color: '#C87A2F' }}
              >
                {item.n}
              </span>
              <div>
                <span className="text-sm font-semibold text-white">{item.label} — </span>
                <span className="text-sm text-white/55">{item.desc}</span>
              </div>
            </li>
          ))}
        </ul>

        <div>
          <a
            href={unlockHref}
            className="inline-flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-lg transition-colors bg-brand-gold hover:bg-brand-gold-hover"
          >
            Full measured report (all 8 sections) — emailed as PDF — {data.reportPrice}
          </a>
          <p className="mt-2 text-xs text-white/40">
            Four engines: ChatGPT, Claude, Gemini, Perplexity. Delivered to your email within 1 business day.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-x-6 gap-y-2">
            <a
              href={data.calendlyUrl}
              className="text-xs text-white/45 hover:text-white/65 transition-colors"
            >
              Want the 60-day plan? Strategic Baseline + Consult — SGD $2,500 →
            </a>
            <a
              href={data.calendlyUrl}
              className="text-xs text-white/45 hover:text-white/65 transition-colors"
            >
              Visibility Engine Retainer (includes Copilot) — SGD $4,500/mo →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 5: Competitor Displacement ──────────────────────────────────────

function S5Competitors({ data }: { data: NonNullable<ReportData['s5Competitors']> }) {
  return (
    <SectionCard id="section-5">
      <SectionBadge n={5} free={false} />
      <h2 className="text-lg font-bold text-gray-900 mb-1">{data.headline}</h2>
      <p className="text-sm text-gray-500 mb-5 leading-relaxed">{data.summary}</p>

      <div className="space-y-4 mb-5">
        {data.competitors.map((comp) => (
          <div key={comp.name} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-sm font-bold text-gray-900">{comp.name}</span>
              <div className="flex flex-wrap gap-1">
                {comp.platforms.map((p) => (
                  <span key={p} className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Their advantage</p>
                <p className="text-xs text-gray-600 leading-relaxed">{comp.advantage}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#C87A2F' }}>Your gap</p>
                <p className="text-xs text-gray-600 leading-relaxed">{comp.yourGap}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4" style={{ background: '#F9FAFB' }}>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Displacement pattern</p>
        <p className="text-sm text-gray-700 leading-relaxed">{data.displacementPattern}</p>
        <p className="mt-2 text-xs text-gray-400">{data.queriesAnalyzed} queries analysed</p>
      </div>
    </SectionCard>
  );
}

// ─── Section 6: Positioning Gap ──────────────────────────────────────────────

function GapScoreBar({ score }: { score: number }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
        <span>Aligned</span>
        <span>Gap score: {score}/100</span>
        <span>Misaligned</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: score > 60 ? '#EF4444' : score > 30 ? '#F59E0B' : '#10B981' }}
        />
      </div>
    </div>
  );
}

function S6PositioningGap({ data }: { data: NonNullable<ReportData['s6PositioningGap']> }) {
  return (
    <SectionCard id="section-6">
      <SectionBadge n={6} free={false} />
      <h2 className="text-lg font-bold text-gray-900 mb-4">{data.headline}</h2>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div className="rounded-xl p-4" style={{ background: '#FEF2F2' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-2">Current AI perception</p>
          <p className="text-sm text-red-900 leading-relaxed">{data.currentPerception}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: '#ECFDF5' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-2">Target AI perception</p>
          <p className="text-sm text-emerald-900 leading-relaxed">{data.targetPerception}</p>
        </div>
      </div>

      <div className="mb-5">
        <GapScoreBar score={data.gapScore} />
      </div>

      <div className="space-y-3 mb-4">
        {data.gaps.map((gap, i) => {
          const sStyles = GAP_SEVERITY_STYLES[gap.severity];
          return (
            <div key={i} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-semibold text-gray-800 flex-1">{gap.gap}</p>
                <StatusPill status={gap.severity} styles={sStyles} />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-semibold text-gray-700">Fix: </span>{gap.fixApproach}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl p-4" style={{ background: '#FFFBEB', borderLeft: '3px solid #F59E0B' }}>
        <p className="text-xs text-amber-900 leading-relaxed">{data.urgencyNote}</p>
      </div>
    </SectionCard>
  );
}

// ─── Section 7: Query Coverage ────────────────────────────────────────────────

function S7QueryGap({ data }: { data: NonNullable<ReportData['s7QueryGap']> }) {
  return (
    <SectionCard id="section-7">
      <SectionBadge n={7} free={false} />
      <h2 className="text-lg font-bold text-gray-900 mb-1">{data.headline}</h2>
      <p className="text-sm text-gray-500 mb-1 leading-relaxed">{data.summary}</p>
      <p className="text-xs text-gray-400 mb-5">
        Platform: <strong className="text-gray-600">{data.primaryPlatform}</strong>
        &nbsp;·&nbsp;{data.queriesWon} of {data.queriesAnalyzed} queries won
      </p>

      <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
        {data.queries.map((row, i) => {
          const qStyles = QUERY_STATUS_STYLES[row.status];
          return (
            <div key={i} className="px-4 py-3 bg-white">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-800 flex-1 leading-snug">{row.query}</p>
                <StatusPill status={row.status} styles={qStyles} />
              </div>
              {row.competitorCited && (
                <p className="text-xs text-gray-400 mt-1">
                  Cited instead: <span className="font-medium text-orange-700">{row.competitorCited}</span>
                </p>
              )}
              {row.inaccuracyDetail && (
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  <span className="font-semibold text-gray-700">What AI said: </span>
                  {row.inaccuracyDetail}
                </p>
              )}
              {row.fixSuggestion && (
                <p className="text-xs mt-1 leading-relaxed" style={{ color: '#C87A2F' }}>
                  <span className="font-semibold">Fix: </span>
                  {row.fixSuggestion}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Section 8: Action Queue ──────────────────────────────────────────────────

const WEEK_LABELS: Record<number, string> = {
  1: 'Week 1', 2: 'Week 2', 3: 'Week 3', 4: 'Week 4',
  5: 'Week 5', 6: 'Week 6', 7: 'Week 7', 8: 'Week 8',
};

function S8ActionQueue({ data }: { data: NonNullable<ReportData['s8ActionQueue']> }) {
  const grouped = data.actions.reduce<Record<number, typeof data.actions>>((acc, item) => {
    if (!acc[item.week]) acc[item.week] = [];
    acc[item.week].push(item);
    return acc;
  }, {});

  return (
    <SectionCard id="section-8">
      <SectionBadge n={8} free={false} />
      <h2 className="text-lg font-bold text-gray-900 mb-1">{data.headline}</h2>

      {/* Quick win */}
      <div
        className="rounded-xl p-4 mb-5"
        style={{ background: '#FDF1E6', borderLeft: '3px solid #C87A2F' }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#C87A2F' }}>
          Do today — under 30 minutes
        </p>
        <p className="text-sm text-gray-800 leading-relaxed">{data.quickWin}</p>
      </div>

      <div className="space-y-5">
        {Object.entries(grouped).map(([week, items]) => (
          <div key={week}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              {WEEK_LABELS[Number(week)]}
            </h3>
            <div className="space-y-2.5">
              {items.map((action, i) => {
                const catStyles = ACTION_CATEGORY_STYLES[action.category];
                return (
                  <div key={i} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <p className="text-sm font-semibold text-gray-900 flex-1">{action.title}</p>
                      <span
                        className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ background: `${catStyles.color}18`, color: catStyles.color }}
                      >
                        {catStyles.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">{action.description}</p>
                    <div className="flex gap-3 text-[10px] text-gray-400">
                      <span>Effort: <span className={`font-semibold ${action.effort === 'high' ? 'text-red-600' : action.effort === 'medium' ? 'text-amber-600' : 'text-emerald-600'}`}>{action.effort}</span></span>
                      <span>Impact: <span className={`font-semibold ${action.impact === 'high' ? 'text-emerald-600' : action.impact === 'medium' ? 'text-amber-600' : 'text-gray-500'}`}>{action.impact}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl p-4" style={{ background: '#F9FAFB' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Expected outcome</p>
        <p className="text-sm text-gray-700 leading-relaxed">{data.expectedOutcome}</p>
      </div>
    </SectionCard>
  );
}

// ─── Locked section placeholders ─────────────────────────────────────────────

function PlaceholderRows({ rows }: { rows: string[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100">
          <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
          <div className="flex-1 h-3 bg-gray-200 rounded" style={{ width: `${60 + (i % 3) * 10}%` }} />
          <div className="w-16 h-4 bg-gray-100 rounded flex-shrink-0" />
        </div>
      ))}
      <p className="text-xs text-gray-400 italic pt-1">{rows[rows.length - 1]}</p>
    </div>
  );
}

// ─── Footer CTA ───────────────────────────────────────────────────────────────

function FooterCta({ data }: { data: ReportData }) {
  return (
    <div
      className="rounded-2xl p-6 sm:p-8 mb-8 text-center"
      style={{ background: 'var(--navy-header)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-3"
        style={{ color: '#C87A2F' }}
      >
        Want help acting on this?
      </p>
      <h2 className="text-xl font-bold text-white mb-2">
        Book a walkthrough with Maxifi Digital
      </h2>
      <p className="text-sm text-white/55 mb-6 max-w-lg mx-auto leading-relaxed">
        A 30-minute session to walk through your report, clarify the priority actions, and answer
        any questions about your AEO strategy. No obligation.
      </p>
      <a
        href={data.calendlyUrl}
        className="inline-flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-lg transition-colors bg-brand-gold hover:bg-brand-gold-hover"
      >
        Book a walkthrough →
      </a>
    </div>
  );
}

function ReportFooter({ data }: { data: ReportData }) {
  return (
    <footer
      className="rounded-2xl px-6 py-5"
      style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs text-white/65">
            AI Visibility Report · {data.meta.entityName}
          </p>
          <p className="text-[11px] text-white/45 mt-0.5">
            Generated {new Date(data.meta.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {data.meta.website && data.meta.website.trim().length > 1 ? ` · ${data.meta.website}` : ''}
          </p>
        </div>
        <p className="text-[11px] text-white/50">
          Maxifi Digital · Singapore ·{' '}
          <a href="mailto:hello@maxifidigital.com" className="underline text-white/60 hover:text-white/80">
            hello@maxifidigital.com
          </a>
          {' · '}
          <a href="/methodology" className="underline text-white/60 hover:text-white/80">
            Methodology →
          </a>
        </p>
      </div>
      <p className="mt-4 text-[11px] text-white/45 leading-relaxed">
        {data.meta.paid ? (
          <>
            This report combines self-reported assessment (Sections 1–4) with live engine measurement
            (Sections 5–8) at time of generation. Citation patterns shift as AI platforms update their
            models — results may differ on re-test.
          </>
        ) : (
          <>
            This is the free assessment: Sections 1–4 are derived from your self-reported answers and
            our per-industry reference data — not live AI citation measurements. The Full Report adds
            the measured 50-query × 4-engine run.
          </>
        )}
      </p>
    </footer>
  );
}

// ─── Score breakdown panel — collapsible "How this score is calculated" ─────
// Only renders when score.breakdown is present (live-computed reports).
// Absent on the pre-migration safeguard path where we serve a stored score
// without rebuilding the breakdown — that produces null here and the panel
// silently disappears.

function ScoreBreakdownPanel({ score }: { score: ScoreData }) {
  if (!score.breakdown || score.breakdown.length === 0) return null;

  // Sum of displayed contributions (one decimal). May differ from score.score
  // by ≤0.5 due to the final Math.round — that's why we show both lines.
  const displayedTotal = score.breakdown.reduce((sum, row) => sum + row.contribution, 0);
  const totalRounded   = Math.round(displayedTotal * 10) / 10;

  return (
    <details className="bg-white rounded-2xl px-6 py-4 mb-6 group">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#C87A2F' }}>
            Score breakdown
          </p>
          <p className="text-sm font-semibold text-gray-800">How this score is calculated</p>
        </div>
        <span
          className="text-gray-400 text-sm transition-transform group-open:rotate-90"
          aria-hidden="true"
        >
          ▸
        </span>
      </summary>
      <div className="mt-5 space-y-3">
        {score.breakdown.map((row, i) => (
          <div key={row.signal} className="flex gap-3 items-start text-sm">
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5"
              style={{ background: 'rgba(200,122,47,0.18)', color: '#C87A2F' }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-700">{row.signal}</p>
              <p className="text-xs italic text-gray-500 mt-0.5 break-words">
                &ldquo;{row.userAnswer || '—'}&rdquo;
              </p>
            </div>
            <p className="flex-shrink-0 font-mono text-xs text-gray-500 whitespace-nowrap pt-0.5">
              {row.points} × {Math.round(row.weight * 100)}% ={' '}
              <span className="font-semibold text-gray-700">{row.contribution.toFixed(1)}</span>
            </p>
          </div>
        ))}
        <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-gray-100 text-sm">
          <span className="text-gray-500">Sum of contributions</span>
          <span className="font-mono text-gray-700">{totalRounded.toFixed(1)}</span>
        </div>
        <div className="flex justify-between items-baseline text-sm">
          <span className="font-semibold text-gray-800">Final score (rounded)</span>
          <span className="font-mono font-bold text-gray-900 text-base">{score.score}</span>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed pt-3 border-t border-gray-100">
          Each row is scored against your self-reported answer; weights reflect each signal&rsquo;s role in AI discovery.{' '}
          <a href="/methodology" className="underline" style={{ color: '#C87A2F' }}>Methodology →</a>
        </p>
      </div>
    </details>
  );
}

// ─── Main ReportPage ──────────────────────────────────────────────────────────

export default function ReportPage({ data }: { data: ReportData }) {
  const { meta, score } = data;
  const paid = meta.paid;
  const unlockHref = `/report/unlock?token=${meta.token}`;

  return (
    <div style={{ background: 'var(--navy-sub)', minHeight: '100vh' }}>
      {/* Preview banner — shown only on free/preview state */}
      {!paid && (
        <div
          className="sticky top-0 z-50 text-center py-2 px-4 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: '#07101a', borderBottom: '2px solid #C87A2F', color: '#C87A2F' }}
        >
          Free preview &nbsp;·&nbsp; Sections 5–8 require the full report
        </div>
      )}

      {/* Site header */}
      <header
        className="flex items-center justify-between px-6 sm:px-8 h-14 border-b"
        style={{ background: 'var(--navy-header)', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <a href="https://maxifidigital.com" className="flex items-center">
          <Image
            src="/maxifi-logo-white.png"
            alt="Maxifi Digital"
            height={22}
            width={110}
            className="h-[22px] w-auto"
            priority
          />
        </a>
        <span className="text-[11px] text-white/40 hidden sm:block">
          AI Visibility Report &nbsp;·&nbsp; {meta.entityName}
        </span>
        {!paid && (
          <a
            href={unlockHref}
            className="text-[11px] font-bold text-white px-3 py-1.5 rounded-lg transition-colors hidden sm:inline-block bg-brand-gold hover:bg-brand-gold-hover"
          >
            Get full report →
          </a>
        )}
      </header>

      {/* Hero block */}
      <div
        className="px-4 sm:px-6 py-10 sm:py-14"
        style={{ background: 'var(--navy-header)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="max-w-3xl mx-auto">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: '#C87A2F' }}
          >
            AI Visibility Report &nbsp;·&nbsp; {meta.industry}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
            {/* Text */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-snug">
                {meta.entityName} — AI Visibility Assessment
              </h1>
              <p className="text-sm sm:text-base text-white/60 mb-4 leading-relaxed">
                {meta.occupation}{meta.industry ? <>&nbsp;·&nbsp;{meta.industry}</> : null}
                {meta.website && meta.website.trim().length > 1 ? ` · ${meta.website}` : ''}
              </p>
              <p className="text-sm text-white/55 leading-relaxed max-w-lg">
                This report analyses {meta.entityName}&rsquo;s current AI citation position
                against the sector reference median for {meta.industry} — a lookup from our
                per-industry table, not a live cohort score. The Full Report replaces this
                reference with a measured 50-query × 4-engine run.
              </p>
            </div>

            {/* Score */}
            <div className="sm:flex-shrink-0">
              <ScoreCircle score={score.score} band={score.band} showScore={paid} />
              <div className="mt-3 text-center">
                <p className="text-[10px] text-white/60 mb-0.5">
                  {score.benchmarkLabel} median
                </p>
                <p className="text-sm font-bold text-white/85">{score.benchmarkAvg}%</p>
              </div>
            </div>
          </div>

          {/* Scoring note — only shown in free tier; paid score is measured, not estimated */}
          {!paid && (
            <p className="mt-6 text-xs text-white/55 leading-relaxed border-t border-white/5 pt-4">
              {score.scoringNote}
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <ScoreBreakdownPanel score={score} />
        <TableOfContents paid={paid} />

        <S1Visibility data={data.s1Visibility} paid={paid} />
        <S2Diagnosis data={data.s2Diagnosis} />
        <S3Platforms data={data.s3Platforms} />
        <S4Positioning data={data.s4Positioning} />

        {/* Paywall — only shown when not paid */}
        {!paid && <PaywallBlock data={data} />}

        {/* Section 5 */}
        {data.s5Competitors ? (
          <S5Competitors data={data.s5Competitors} />
        ) : (
          <LockedSection
            sectionNumber={5}
            title="Who AI mentions when you're not named"
            unlockUrl={unlockHref}
            reportPrice={data.reportPrice}
            previewRows={
              <PlaceholderRows rows={[
                'Competitor you seeded — mentioned on X of N queries where your brand was not named',
                'By engine — Perplexity X · ChatGPT Y · Claude Z · Gemini W',
                'By category — most often on competitive, service, how-to queries',
                'Co-mentioned with you — named alongside on N queries',
              ]} />
            }
          />
        )}

        {/* Section 6 */}
        {data.s6PositioningGap ? (
          <S6PositioningGap data={data.s6PositioningGap} />
        ) : (
          <LockedSection
            sectionNumber={6}
            title="How AI describes you"
            unlockUrl={unlockHref}
            reportPrice={data.reportPrice}
            previewRows={
              <PlaceholderRows rows={[
                'Your stated positioning — verbatim from your form',
                'How ChatGPT described you — verbatim sentence containing your brand',
                'How Claude described you — verbatim sentence containing your brand',
                'Shared vs missing terms — overlap with your stated positioning',
              ]} />
            }
          />
        )}

        {/* Section 7 */}
        {data.s7QueryGap ? (
          <S7QueryGap data={data.s7QueryGap} />
        ) : (
          <LockedSection
            sectionNumber={7}
            title="Query coverage"
            unlockUrl={unlockHref}
            reportPrice={data.reportPrice}
            previewRows={
              <PlaceholderRows rows={[
                'Query 1 — awareness — named on 0 of 4 engines · citations on 1 of 4',
                'Query 2 — competitive — named on 0 of 4 · citations on 1 of 4',
                'Query 3 — brand — named on 4 of 4 · citations on 1 of 4',
                'Query 4 — segment — named on 0 of 4 · citations on 1 of 4',
                'Full 50 × 4 matrix with citation flags',
              ]} />
            }
          />
        )}

        {/* Section 8 */}
        {data.s8ActionQueue ? (
          <S8ActionQueue data={data.s8ActionQueue} />
        ) : (
          <LockedSection
            sectionNumber={8}
            title="Sentiment, rank & citation health"
            unlockUrl={unlockHref}
            reportPrice={data.reportPrice}
            previewRows={
              <PlaceholderRows rows={[
                'Sentiment — distribution across the responses where your brand was named',
                'Rank position — where your brand sits when AI lists multiple entities',
                'Citation rate by engine — flagged with engine-shape caveat',
                'Citation rate by category — which query types drive citations',
                'Brand vs non-brand named rate — your real visibility number',
              ]} />
            }
          />
        )}

        <FooterCta data={data} />
        <ReportFooter data={data} />
      </main>
    </div>
  );
}
