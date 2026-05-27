import Image from 'next/image';
import Link from 'next/link';
import { BENCHMARK_METADATA, INDUSTRY_BENCHMARKS } from '@/lib/scoring';

export const metadata = {
  title: 'How We Calculate Your AI Visibility Score | Maxifi Digital',
  description:
    'The methodology behind the AI Visibility Snapshot — signal design, weight rationale, benchmark sources, and known limitations.',
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-[680px] mx-auto">

        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6">
            ← Back to snapshot
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <Image
              src="/maxifi-logo-black.png"
              alt="Maxifi Digital"
              height={28}
              width={140}
              className="h-7 w-auto"
            />
          </div>
          <p className="text-xs font-semibold text-[#C87A2F] uppercase tracking-widest mb-3">
            Scoring methodology
          </p>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
            How we calculate your AI visibility score
          </h1>
          <p className="text-base text-gray-600 leading-relaxed">
            This page documents the full methodology behind the AI Visibility Snapshot — including how each signal is defined, why the weights are set where they are, where the benchmark figures come from, and what the score cannot tell you.
          </p>
        </div>

        {/* Diagnostic vs Measurement */}
        <div className="bg-[#1a2744] rounded-2xl p-7 mb-8 text-white">
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-3">
            What kind of tool this is
          </p>
          <h2 className="text-xl font-bold mb-4 leading-snug">
            This is a diagnostic instrument, not a measurement system.
          </h2>
          <p className="text-sm text-blue-100 leading-relaxed mb-4">
            A <strong className="text-white">measurement system</strong> queries AI platforms directly and counts how often your brand appears in responses — it produces an objective citation rate. That requires ongoing API access, a standardised query panel, and significant infrastructure.
          </p>
          <p className="text-sm text-blue-100 leading-relaxed mb-4">
            A <strong className="text-white">diagnostic instrument</strong> helps you identify where problems likely exist based on observable indicators — the same way a GP uses a blood pressure reading to flag cardiovascular risk, not to diagnose the specific disease. Your AI Visibility Score is the reading. The full AEO Visibility Report is the specialist appointment.
          </p>
          <p className="text-sm text-blue-100 leading-relaxed">
            Every claim in this snapshot is framed as an estimate. We are explicit about limitations because that transparency is the foundation of a useful diagnostic.
          </p>
        </div>

        {/* The 4 signals */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            The scoring model
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Four independent signals</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Each signal measures a genuinely distinct dimension of AI visibility. They are independent — a brand can score well on one and poorly on another — which means each diagnosis points to a different fix.
          </p>

          <div className="space-y-6">

            {/* Signal 1 */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-5 py-3 border-b border-gray-100">
                <div>
                  <span className="text-xs font-bold text-[#C87A2F] uppercase tracking-wide">Signal 1</span>
                  <h3 className="text-base font-bold text-gray-900 mt-0.5">Platform presence</h3>
                </div>
                <span className="text-2xl font-bold text-[#C87A2F]">30%</span>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  <strong>What it measures:</strong> Whether a brand search on an AI platform returns accurate, current information about your business. This is the most direct observable signal — you can verify it yourself in under 60 seconds.
                </p>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  <strong>Why 30%:</strong> Platform presence is the first binary gate in AI discovery. If you don&rsquo;t appear accurately, nothing else matters commercially. It receives the highest individual weight alongside competitive displacement because these two signals map directly to the outcomes buyers experience.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-400">
                        <th className="text-left pb-2 font-medium pr-4">Answer</th>
                        <th className="text-right pb-2 font-medium">Score contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        ['Cited accurately', '90 × 0.30 = 27 pts'],
                        ['Cited — but outdated information', '40 × 0.30 = 12 pts'],
                        ['Cited — but details were wrong', '30 × 0.30 = 9 pts'],
                        ['Competitors cited instead of me', '15 × 0.30 = 4.5 pts'],
                        ['Not mentioned at all / not tested', '0 × 0.30 = 0 pts'],
                      ].map(([ans, pts]) => (
                        <tr key={ans}>
                          <td className="py-2 pr-4 text-gray-700">{ans}</td>
                          <td className="py-2 text-right font-mono text-xs text-gray-500 whitespace-nowrap">{pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                  <em>Why max 90, not 100:</em> No single-question self-report can capture the full range of platform presence. The 90-point ceiling reserves headroom for signals that require direct measurement.
                </p>
              </div>
            </div>

            {/* Signal 2 */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-5 py-3 border-b border-gray-100">
                <div>
                  <span className="text-xs font-bold text-[#C87A2F] uppercase tracking-wide">Signal 2</span>
                  <h3 className="text-base font-bold text-gray-900 mt-0.5">Competitive displacement</h3>
                </div>
                <span className="text-2xl font-bold text-[#C87A2F]">30%</span>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  <strong>What it measures:</strong> Whether your brand appears ahead of, alongside, or behind competitors in AI-generated category responses. Presence is not enough — if competitors are consistently cited instead of you, buyers are being directed elsewhere.
                </p>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  <strong>Why 30%:</strong> Competitive displacement is the commercial outcome signal. It maps directly to pipeline loss — each search where a competitor is cited instead of you is a buyer conversation you didn&rsquo;t enter. Equal weight to platform presence reflects that being invisible and being displaced are equally damaging commercial outcomes.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-400">
                        <th className="text-left pb-2 font-medium pr-4">Answer</th>
                        <th className="text-right pb-2 font-medium">Score contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        ['I usually show up — and ahead of competitors', '90 × 0.30 = 27 pts'],
                        ['I show up about as often as competitors', '60 × 0.30 = 18 pts'],
                        ['Competitors often show up ahead of me', '30 × 0.30 = 9 pts'],
                        ['Competitors show up, I rarely do', '5 × 0.30 = 1.5 pts'],
                        ["Not sure — I haven't looked into this", '0 × 0.30 = 0 pts'],
                      ].map(([ans, pts]) => (
                        <tr key={ans}>
                          <td className="py-2 pr-4 text-gray-700">{ans}</td>
                          <td className="py-2 text-right font-mono text-xs text-gray-500 whitespace-nowrap">{pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Signal 3 */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-5 py-3 border-b border-gray-100">
                <div>
                  <span className="text-xs font-bold text-[#C87A2F] uppercase tracking-wide">Signal 3</span>
                  <h3 className="text-base font-bold text-gray-900 mt-0.5">Query coverage</h3>
                </div>
                <span className="text-2xl font-bold text-[#C87A2F]">25%</span>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  <strong>What it measures:</strong> Whether your brand appears across a breadth of topic and category queries — not just when your exact name is searched. A brand that only appears for branded queries has minimal pipeline contribution from AI discovery.
                </p>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  <strong>Why 25%:</strong> Query breadth is a strong predictor of discovery volume, but it is harder to act on quickly than presence or displacement. It receives slightly lower weight because brands should fix signals 1 and 2 before optimising for query coverage — and because this signal is inherently harder to self-report accurately.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-400">
                        <th className="text-left pb-2 font-medium pr-4">Answer</th>
                        <th className="text-right pb-2 font-medium">Score contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        ['Yes — for most things people ask about in my space', '90 × 0.25 = 22.5 pts'],
                        ['Sometimes — for a few topics, but not most', '55 × 0.25 = 13.75 pts'],
                        ['Only when someone searches my exact name', '20 × 0.25 = 5 pts'],
                        ["Not sure — I haven't looked into this", '0 × 0.25 = 0 pts'],
                      ].map(([ans, pts]) => (
                        <tr key={ans}>
                          <td className="py-2 pr-4 text-gray-700">{ans}</td>
                          <td className="py-2 text-right font-mono text-xs text-gray-500 whitespace-nowrap">{pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Signal 4 */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-5 py-3 border-b border-gray-100">
                <div>
                  <span className="text-xs font-bold text-[#C87A2F] uppercase tracking-wide">Signal 4</span>
                  <h3 className="text-base font-bold text-gray-900 mt-0.5">Cross-platform consistency</h3>
                </div>
                <span className="text-2xl font-bold text-[#C87A2F]">15%</span>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  <strong>What it measures:</strong> Whether your presence holds across multiple AI platforms — ChatGPT, Perplexity, Gemini, Google AI Overviews — rather than being an artefact of one platform&rsquo;s training data. Consistency across platforms indicates structural visibility rather than a single-platform anomaly.
                </p>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  <strong>Why 15%:</strong> Cross-platform consistency is a robustness and confirmation signal — it tells you whether your visibility generalises. It receives the lowest weight because it is downstream of the other three: fixing presence, displacement, and coverage will naturally improve cross-platform consistency over time.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs text-gray-400">
                        <th className="text-left pb-2 font-medium pr-4">Answer</th>
                        <th className="text-right pb-2 font-medium">Score contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        ["Yes — pretty consistently across the ones I've tried", '100 × 0.15 = 15 pts'],
                        ['It varies a lot depending on the tool', '50 × 0.15 = 7.5 pts'],
                        ["I've only really looked at one", '25 × 0.15 = 3.75 pts'],
                        ["Not sure — I haven't looked into this", '0 × 0.15 = 0 pts'],
                      ].map(([ans, pts]) => (
                        <tr key={ans}>
                          <td className="py-2 pr-4 text-gray-700">{ans}</td>
                          <td className="py-2 text-right font-mono text-xs text-gray-500 whitespace-nowrap">{pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Formula */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            The formula
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-4">How the score is computed</h2>
          <div className="bg-gray-50 rounded-xl p-5 font-mono text-sm text-gray-800 leading-relaxed mb-5 border border-gray-100">
            <p className="text-gray-500 text-xs mb-2"># Final score</p>
            <p>score = round(s1 × 0.30 + s2 × 0.30 + s3 × 0.25 + s4 × 0.15)</p>
            <p className="text-gray-500 text-xs mt-4 mb-1"># Best case</p>
            <p>round(90×0.30 + 90×0.30 + 90×0.25 + 100×0.15) = <strong className="text-[#C87A2F]">92</strong></p>
            <p className="text-gray-500 text-xs mt-3 mb-1"># Never tested (all signals unknown)</p>
            <p>round(0×0.30 + 0×0.30 + 0×0.25 + 0×0.15) = <strong className="text-[#C87A2F]">0 → Undiagnosed</strong></p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            The theoretical maximum is <strong>92%</strong>, not 100%. This is intentional: the 8-point headroom reflects the gap between self-report and direct measurement. A brand that scores 92% on this model is demonstrating near-complete self-reported visibility — the remaining uncertainty belongs to measurement, not to the brand.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            A score of <strong>0 is displayed as &ldquo;Undiagnosed&rdquo;</strong> rather than 0%. Zeroing unknown states reflects that absence of data is not evidence of poor performance — it is a prompt to test, not a verdict.
          </p>
        </div>

        {/* Benchmarks */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Industry benchmarks
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Where the benchmark figures come from</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            The benchmark for each industry represents the <strong>median AI citation rate</strong> observed across brands in that sector, based on Maxifi Digital&rsquo;s analysis of citation patterns across ChatGPT, Google AI Overviews, and Perplexity.
          </p>
          <div className="rounded-lg bg-amber-50 border border-amber-100 px-5 py-4 mb-5">
            <p className="text-sm text-amber-900 leading-relaxed">
              <strong>Methodological note:</strong> These benchmarks represent Maxifi Digital&rsquo;s best-effort analysis of citation patterns as of {BENCHMARK_METADATA.generatedDate}. They are not sourced from a third-party index and have not been independently validated. They are calibration estimates, not statistical measurements. We review and update them as new data becomes available (next review: {BENCHMARK_METADATA.nextReviewDate}).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400">
                  <th className="text-left pb-2 font-medium pr-4">Industry</th>
                  <th className="text-right pb-2 font-medium">Benchmark</th>
                  <th className="text-right pb-2 font-medium pl-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {Object.entries(INDUSTRY_BENCHMARKS)
                  .filter(([k]) => !['Cloud Infrastructure', 'Legal', 'Defense', 'Aviation & Aerospace'].includes(k))
                  .sort(([, a], [, b]) => b - a)
                  .map(([industry, bench]) => (
                    <tr key={industry}>
                      <td className="py-2 pr-4 text-gray-700">{industry}</td>
                      <td className="py-2 text-right font-bold text-gray-900">{bench}%</td>
                      <td className="py-2 text-right text-xs text-gray-400 pl-4">
                        {bench >= 70 ? 'High AI discovery' : bench < 40 ? 'Procurement-led' : ''}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            Procurement-led sectors (Defense, Aviation, Government Systems) carry lower benchmarks because formal tender and RFP processes reduce AI-driven vendor discovery. AI plays a limited role in initial vendor shortlisting in these sectors — the benchmark reflects that context, not a lower standard.
          </p>
        </div>

        {/* Buyer conversation estimate */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Pipeline estimates
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-4">The &ldquo;X out of 10 referrals&rdquo; calculation</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            The pipeline framing (&ldquo;N out of 10 AI referrals in your category are going to other brands&rdquo;) uses a linear conversion from visibility score to an estimated conversation appearance rate:
          </p>
          <div className="bg-gray-50 rounded-xl p-5 font-mono text-sm text-gray-800 mb-4 border border-gray-100">
            <p>x = max(0, round(score / 10))</p>
            <p className="text-gray-500 text-xs mt-1 mb-3"># Your estimated appearances per 10 searches</p>
            <p>y = max(1, min(10, round(benchAvg / 10)))</p>
            <p className="text-gray-500 text-xs mt-1"># Benchmark brand appearances per 10 searches</p>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-100 px-5 py-4">
            <p className="text-sm text-red-900 font-semibold mb-1">Known limitations of this estimate</p>
            <ul className="text-sm text-red-800 space-y-1 list-disc ml-4">
              <li>Assumes a linear relationship between score and citation rate — this may not hold at extremes</li>
              <li>Based on theoretical scaling, not validated against live AI response data</li>
              <li>Does not account for query specificity (branded vs. category queries behave differently)</li>
              <li>Represents a single-vendor view — does not model the full competitive set</li>
            </ul>
            <p className="text-sm text-red-800 mt-3">
              Use this as directional framing only. It is designed to make the stakes of visibility gaps intuitive — not to be cited as a precise measurement.
            </p>
          </div>
        </div>

        {/* Limitations */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Limitations
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-4">What this model cannot tell you</h2>
          <div className="space-y-4">
            {[
              {
                title: 'It is not validated against live AI data',
                body: 'The relationship between this score and actual AI citation frequency has not been measured against a panel of live AI queries. The scoring model reflects practitioner judgment and structural logic — not empirical calibration. We are collecting data to refine this over time.',
              },
              {
                title: 'Self-reported data is not independently verified',
                body: 'The answers you provided reflect your experience and observation. Recall bias, testing methodology (which queries you searched, how you searched) and platform variation all affect what you saw — and therefore what this model outputs.',
              },
              {
                title: 'Root causes are diagnostic hypotheses',
                body: 'The three gap explanations in your snapshot are the most likely causes based on pattern matching against your reported signals. They are not confirmed diagnoses. Only a website audit can confirm which factor is actually your constraint.',
              },
              {
                title: 'AI responses are non-deterministic',
                body: 'The same query on the same platform can return different results at different times. Your snapshot reflects a single observation — the live AI landscape may differ. This is also why direct measurement requires multiple samples per query.',
              },
              {
                title: 'Google AI Overviews cannot be measured via API',
                body: 'Google AI Overviews appear within live Google Search results and are not accessible via a public API. Any visibility data about AI Overviews is based on manual observation, not programmatic measurement.',
              },
            ].map(({ title, body }) => (
              <div key={title} className="flex items-start gap-4">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-50 text-red-400 text-xs font-bold flex items-center justify-center mt-0.5">!</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison to direct measurement */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Alternatives
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-4">How this compares to direct measurement</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400">
                  <th className="text-left pb-2 font-medium pr-4">Dimension</th>
                  <th className="text-left pb-2 font-medium pr-4">This tool (self-report diagnostic)</th>
                  <th className="text-left pb-2 font-medium">Direct measurement (Profound, Otterly)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ['Cost', 'Free', '$100–500/month managed service'],
                  ['Speed', 'Instant', '24–48 hrs setup + query panel design'],
                  ['Objectivity', 'Self-reported', 'Programmatically measured'],
                  ['Google AI Overviews', 'Self-reported', 'Manual testing only'],
                  ['Non-determinism handling', 'Not handled', 'Multiple samples per query'],
                  ['Calibration', 'Expert-judgment weights', 'Real citation rate data'],
                  ['Action guidance', 'Built in', 'Requires interpretation'],
                  ['Best for', 'First diagnosis, quick audit', 'Ongoing monitoring, competitive tracking'],
                ].map(([dim, self, direct]) => (
                  <tr key={dim}>
                    <td className="py-2.5 pr-4 font-medium text-gray-800 whitespace-nowrap">{dim}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{self}</td>
                    <td className="py-2.5 text-gray-600">{direct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How we improve the model */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7 mb-10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Model evolution
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-4">How we improve this over time</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            We treat this scoring model as a living instrument. Three calibration loops are currently in progress:
          </p>
          <div className="space-y-4">
            {[
              {
                label: 'User feedback',
                body: 'Snapshot recipients who verify their prediction against live AI tools and find a mismatch can email us. Each report is reviewed and used to refine the scoring logic.',
              },
              {
                label: 'Direct measurement validation',
                body: 'We are building a direct measurement pipeline (AI API query panels) to compare self-reported scores against actual citation rates. This data will be used to recalibrate signal weights as it accumulates.',
              },
              {
                label: 'Benchmark refreshes',
                body: `Benchmarks are reviewed quarterly as AI platforms update their citation behaviour. Next scheduled review: ${BENCHMARK_METADATA.nextReviewDate}.`,
              },
            ].map(({ label, body }) => (
              <div key={label} className="flex items-start gap-4">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FDF1E6] text-[#C87A2F] text-xs font-bold flex items-center justify-center mt-0.5">→</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Image
            src="/maxifi-logo-black.png"
            alt="Maxifi Digital"
            height={20}
            width={100}
            className="h-5 w-auto opacity-30 mx-auto mb-3"
          />
          <p className="text-xs text-gray-400">
            Questions?{' '}
            <a
              href={`mailto:${process.env.MAXIFI_CONTACT_EMAIL ?? 'letsgetstarted@maxifidigital.com'}`}
              className="underline hover:text-gray-600"
            >
              hello@maxifidigital.com
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
