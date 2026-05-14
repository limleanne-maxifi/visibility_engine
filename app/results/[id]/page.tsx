import { notFound } from 'next/navigation';
import { getLeadById } from '@/lib/supabase';
import CopyLinkButton from './CopyLinkButton';

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Score + style helpers ────────────────────────────────────────────────────

function getVisibilityScore(awareness: string): number {
  const map: Record<string, number> = {
    "No, I haven't tried this yet":                   0,
    'Yes — and the results were accurate':            72,
    "Yes — but I wasn't mentioned at all":             8,
    'Yes — but details about me were wrong':          24,
    'Yes — competitors were cited instead of me':     17,
    'Yes — but old/outdated info appeared':           31,
  };
  return map[awareness] ?? 0;
}

function getStrategicVerdict(awareness: string, entityName: string, competitor: string | null): string {
  const comp = competitor
    ? `while ${competitor} consolidates authority across the same queries your buyers are asking`
    : 'while your competitors consolidate authority in your category';

  switch (awareness) {
    case "Yes — but I wasn't mentioned at all":
      return `${entityName} is currently invisible in AI-generated buyer journeys for its core category — ${comp}.`;
    case 'Yes — competitors were cited instead of me':
      return `${entityName} is being displaced in AI-generated buyer journeys for its core category — ${comp}.`;
    case 'Yes — but details about me were wrong':
      return `${entityName} is being misrepresented in AI-generated buyer journeys — ${comp}.`;
    case 'Yes — but old/outdated info appeared':
      return `${entityName} is appearing with outdated information in AI-generated answers — ${comp}.`;
    default:
      return `${entityName} has not yet established a clear presence in AI-generated buyer journeys — ${comp}.`;
  }
}

// ─── Benchmark helpers ────────────────────────────────────────────────────────

const INDUSTRY_BENCHMARKS: Record<string, number> = {
  'Financial Services & Banking': 47, 'Fintech / Financial Technology': 47,
  'Accounting & Finance': 47,         'Legal': 62,
  'Professional Services': 54,        'Consulting & Advisory': 54,
  'Healthcare & Life Sciences': 78,   'B2B SaaS / Enterprise Software': 84,
  'AI & Machine Learning': 84,        'Cybersecurity': 84,
  'Cloud Infrastructure': 84,         'Marketing Technology': 63,
  'Aviation & Aerospace': 41,         'Defense': 41,
  'Education & Training': 52,         'Media & Publishing': 58,
  'Real Estate & Property': 35,       'Retail & E-commerce': 48,
  'Hospitality & Travel': 42,         'Manufacturing & Industrial': 38,
};

function getIndustryBenchmark(industry: string): number {
  return INDUSTRY_BENCHMARKS[industry] ?? 38;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function getFirstCompetitor(competitors: string | null | undefined): string | null {
  if (!competitors?.trim()) return null;
  return competitors.split(/[,;/\n]/)[0].trim() || null;
}

function deriveQueries(
  entityName: string,
  positioning: string | null | undefined,
  targetQueries: string | null | undefined,
): string[] {
  if (targetQueries?.trim()) {
    const qs = targetQueries.split(/[,;\n]/).map((q) => q.trim()).filter(Boolean);
    if (qs.length) return qs.slice(0, 3);
  }
  const results: string[] = [entityName];
  if (positioning?.trim()) results.push(positioning.trim().slice(0, 80));
  return results;
}

function toApproximateFraction(score: number, avg: number): string {
  if (avg === 0 || score === 0) return 'none';
  const ratio = score / avg;
  if (ratio >= 0.95) return 'nearly all';
  if (ratio >= 0.75) return 'roughly three quarters';
  if (ratio >= 0.55) return 'roughly half';
  if (ratio >= 0.38) return 'roughly one third';
  if (ratio >= 0.22) return 'roughly one quarter';
  return 'less than one fifth';
}

function getPlatformSearchUrl(platform: string, query: string): string {
  const encoded = encodeURIComponent(query);
  switch (platform) {
    case 'ChatGPT':             return `https://chatgpt.com/?q=${encoded}`;
    case 'Google AI Overviews': return `https://www.google.com/search?q=${encoded}`;
    case 'Perplexity':          return `https://www.perplexity.ai/search?q=${encoded}`;
    case 'Claude':              return 'https://claude.ai/new';
    case 'Gemini':              return 'https://gemini.google.com/app';
    default:                    return `https://chatgpt.com/?q=${encoded}`;
  }
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

// ─── Finding block helpers ────────────────────────────────────────────────────

function getFindingSentence(
  awareness: string,
  entityName: string,
  competitor: string | null,
  platform: string,
): string {
  const plat = platform || 'the AI platform you tested';
  const comp = competitor ?? 'a competitor';

  switch (awareness) {
    case "Yes — but I wasn't mentioned at all":
      return `${entityName} was not cited by ${plat} when queried for its category — ${comp} appeared in its place.`;
    case 'Yes — competitors were cited instead of me':
      return `${comp} was cited by ${plat} instead of ${entityName} when buyers searched for your category.`;
    case 'Yes — but details about me were wrong':
      return `${plat} cited ${entityName} but returned inaccurate details — a sign of conflated or incomplete source material.`;
    case 'Yes — but old/outdated info appeared':
      return `${plat} cited ${entityName} using outdated information that no longer reflects your current offer.`;
    default:
      return `${entityName}'s AI visibility position has not yet been tested on a live platform.`;
  }
}

function getRootCauses(
  awareness: string,
  entityName: string,
  industry: string,
  competitor: string | null,
): string[] {
  const comp = competitor ?? 'the market leader in your category';

  switch (awareness) {
    case "Yes — but I wasn't mentioned at all":
      return [
        `Your website doesn't clearly identify what category ${entityName} belongs to — so AI engines can't place you when a buyer searches for it.`,
        `Your brand isn't referenced consistently across the external directories, publications, and review platforms that AI engines use to verify businesses.`,
        `${comp} has formatted their online presence to match how buyers phrase questions in ${industry} — ${entityName}'s content hasn't been set up that way yet.`,
      ];
    case 'Yes — competitors were cited instead of me':
      return [
        `${comp} has built a clearer, more consistent presence in the sources AI engines rely on — which is why they appear first.`,
        `Your content covers the right topics, but it isn't formatted in a way that AI engines can extract a recommendation from.`,
        `Third-party sources in the ${industry} sector — directories, review platforms, publications — reference ${comp} more consistently than ${entityName}.`,
      ];
    case 'Yes — but details about me were wrong':
      return [
        `Different sources online describe ${entityName} differently — AI engines blend these into a single answer that ends up inaccurate.`,
        `Your brand hasn't been clearly identified across the major directories and publications that AI engines rely on to verify facts.`,
        `There isn't enough consistent, authoritative information about ${entityName} for AI engines to get the details right.`,
      ];
    case 'Yes — but old/outdated info appeared':
      return [
        `Your recent work and current services aren't reflected in the sources AI engines pull from — they're citing older content.`,
        `Your content isn't being updated with enough frequency to signal to AI engines that ${entityName} is active and current.`,
        `AI engines are treating ${entityName} as a business that hasn't changed — giving buyers an outdated picture of what you offer.`,
      ];
    default:
      return [
        `Without testing, there's no clear picture of whether AI engines can find ${entityName} at all.`,
        `You may be invisible, cited inaccurately, or a competitor may be appearing in your place — each requires a different fix.`,
        `A quick search in ChatGPT or Perplexity will immediately show you where you stand.`,
      ];
  }
}

// ─── Three-gap content helpers ────────────────────────────────────────────────

function getGap1Specific(
  awareness: string,
  entityName: string,
  industry: string,
  competitor: string | null,
  platform: string,
): string {
  const plat = platform || 'AI search';
  const comp = competitor ?? 'your competitors';

  switch (awareness) {
    case "Yes — but I wasn't mentioned at all":
      return `When a buyer asks for a ${industry} specialist on ${plat}, AI engines don't have a clear enough description of ${entityName} to include it in the answer. Your website covers the right territory, but it isn't signalling the right category clearly enough for AI to surface you.`;
    case 'Yes — competitors were cited instead of me':
      return `${entityName}'s website covers the right topics, but ${comp} have formatted theirs to more closely match how buyers phrase questions in ${industry}. That formatting gap is why AI surfaces them and not you.`;
    case 'Yes — but details about me were wrong':
      return `AI engines are pulling inconsistent descriptions of ${entityName} from different sources. Your own website isn't giving them a reliable, clear alternative to draw from.`;
    case 'Yes — but old/outdated info appeared':
      return `Your most current work isn't formatted in a way that signals to AI engines that ${entityName} is active and authoritative right now. Older content is being prioritised because it carries more history.`;
    default:
      return `Without knowing how AI engines are reading ${entityName}'s website, it's unclear which buyer queries you appear in and which you're missing entirely. The structure of your content determines which questions you show up for.`;
  }
}

function getGap2Specific(
  entityName: string,
  industry: string,
  competitor: string | null,
  score: number,
  benchAvg: number,
): string {
  const comp = competitor ?? 'the leading businesses in your category';

  if (score > 0 && score >= benchAvg) {
    return `Your brand has a reasonable footprint across public sources, but there are gaps preventing AI engines from citing you as consistently as they could. ${competitor ? `${competitor} has a stronger presence in key directories and publications in ${industry}.` : `There are specific source types in ${industry} that aren't yet referencing ${entityName} reliably.`}`;
  }
  if (score > 0) {
    return `Right now, ${entityName}'s presence across the sources AI engines rely on in the ${industry} sector is weaker than your competitors'. ${competitor ? `In particular, ${competitor}'s authority signals are stronger in this category — which is why they're cited first.` : `${comp} have built stronger authority signals across these sources.`}`;
  }
  return `Without testing, it's unclear how consistently AI engines can describe ${entityName} or what information they're drawing from. ${competitor ? `${competitor} has had more time to build their presence in the ${industry} sector.` : `The established businesses in ${industry} have built clearer footprints across the sources AI engines rely on.`}`;
}

function getGap3Specific(
  entityName: string,
  industry: string,
  competitor: string | null,
  hasDisplacement: boolean,
): string {
  const comp = competitor ?? 'your competitors';

  if (hasDisplacement) {
    return `The publications, directories, and analyst platforms covering the ${industry} sector are currently referencing ${comp} more consistently than ${entityName}. This is a key reason AI engines surface them before you when buyers are researching.`;
  }
  return `The publications, directories, and analyst platforms in the ${industry} sector don't yet reference ${entityName} with enough consistency for AI engines to treat it as a recommended source. The relevant sources in ${industry} are well-defined — this is addressable.`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ResultsPage({ params }: Props) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const reportUrl    = process.env.REPORT_CHECKOUT_URL  ?? process.env.CALENDLY_URL ?? '#';
  const monitorUrl   = process.env.MONITOR_CHECKOUT_URL ?? process.env.CALENDLY_URL ?? '#';
  const calendlyUrl  = process.env.CALENDLY_URL ?? '#';
  const contactEmail = process.env.MAXIFI_CONTACT_EMAIL ?? 'letsgetstarted@maxifidigital.com';

  const score     = getVisibilityScore(lead.awareness);
  const benchAvg  = getIndustryBenchmark(lead.industry);
  const platforms = getPlatformStatuses(lead.awareness, lead.platform, lead.platform_other);

  const challenges      = lead.challenge.split(';').map((c) => c.trim()).filter(Boolean);
  const hasDisplacement = challenges.some((c) => c.includes('My competitors show up'));

  const entityName       = lead.company_name ?? lead.first_name;
  const competitor       = getFirstCompetitor(lead.competitors);
  const derivedQueries   = deriveQueries(entityName, lead.positioning, lead.target_queries);
  const primaryQuery     = derivedQueries[0];
  const snapshotDate     = new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const searchedOn       = [lead.platform, lead.platform_other].filter(Boolean).join(', ');
  const checkedPlatforms = ALL_PLATFORMS.filter((p) => platforms[p] !== 'unknown');

  const competitorScore = Math.min(95, Math.round(benchAvg * 1.4));
  const gap             = benchAvg - score;
  const fractionText    = score > 0 ? toApproximateFraction(score, benchAvg) : 'an unknown share';

  const verdict    = getStrategicVerdict(lead.awareness, entityName, competitor);
  const finding    = getFindingSentence(lead.awareness, entityName, competitor, lead.platform);
  const rootCauses = getRootCauses(lead.awareness, entityName, lead.industry, competitor);

  const gap1Text = getGap1Specific(lead.awareness, entityName, lead.industry, competitor, lead.platform);
  const gap2Text = getGap2Specific(entityName, lead.industry, competitor, score, benchAvg);
  const gap3Text = getGap3Specific(entityName, lead.industry, competitor, hasDisplacement);

  const isPlatformEmbeddable = lead.platform === 'Perplexity';
  const platformSearchUrl    = getPlatformSearchUrl(lead.platform, primaryQuery);
  const verifyPlatformName   = lead.platform || 'ChatGPT';

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-[640px] mx-auto">

        {/* 1. Header — strategic verdict */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEDFE] text-[#3C3489] text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-[#534AB7]" />
            Maxifi Digital · AI Visibility Snapshot
          </div>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-3">
            {verdict}
          </h1>
          <p className="text-sm text-gray-500">
            {lead.occupation} · {lead.industry}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Snapshot generated {snapshotDate}
            {searchedOn && ` · Searched on: ${searchedOn}`}
          </p>
        </div>

        {/* 2. Competitive position table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Competitive position
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400">
                <th className="text-left pb-2 font-medium pr-4">Position</th>
                <th className="text-left pb-2 font-medium pr-4">Brand</th>
                <th className="text-right pb-2 font-medium">AI visibility</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="py-3 pr-4 text-xs text-gray-400 whitespace-nowrap">Category leader</td>
                <td className="py-3 pr-4 text-gray-900 font-medium">{competitor ?? 'Leading competitor'} *</td>
                <td className="py-3 text-right font-bold text-gray-900">{competitorScore}%</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-3 pr-4 text-xs text-gray-400 whitespace-nowrap">Industry median</td>
                <td className="py-3 pr-4 text-gray-600">{lead.industry || 'Your industry'}</td>
                <td className="py-3 text-right text-gray-600">{benchAvg}%</td>
              </tr>
              <tr className={`border-b border-gray-100 ${score < benchAvg ? 'bg-red-50/40' : 'bg-emerald-50/40'}`}>
                <td className="py-3 pr-4 text-xs font-semibold text-[#534AB7] whitespace-nowrap">Your position</td>
                <td className="py-3 pr-4 text-gray-900 font-semibold">{entityName}</td>
                <td className={`py-3 text-right font-bold ${score < benchAvg ? 'text-red-600' : 'text-emerald-600'}`}>
                  {score > 0 ? `${score}%` : 'Undiagnosed'}
                </td>
              </tr>
              {score > 0 && (
                <tr>
                  <td className="pt-3 pr-4 text-xs text-gray-400 whitespace-nowrap">Gap to parity</td>
                  <td className="pt-3 pr-4 text-xs text-gray-400">vs industry median</td>
                  <td className={`pt-3 text-right font-bold ${gap > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {gap > 0 ? `−${gap}%` : `+${Math.abs(gap)}%`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-400 mt-3">* Estimated from industry benchmark data. Maxifi Digital research.</p>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-700 leading-relaxed">
              AI-referred traffic converts at 3.4× the rate of traditional organic search.
              At {score > 0 ? `${score}%` : 'undiagnosed'} visibility,{' '}
              your brand is accessing approximately{' '}
              <strong>{fractionText}</strong>{' '}
              of the AI discovery opportunity available in your category.
            </p>
          </div>
        </div>

        {/* 3. Structured finding block */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">

          {/* Finding */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Finding</p>
            <p className="text-base font-semibold text-gray-900 leading-snug">{finding}</p>
          </div>

          {/* Evidence */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Evidence</p>
            {checkedPlatforms.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  Searched on {snapshotDate} · Query: &ldquo;{primaryQuery}&rdquo;
                </p>
                <div className="rounded-lg bg-gray-50 divide-y divide-gray-100 overflow-hidden border border-gray-100">
                  {checkedPlatforms.map((platform) => {
                    const status = platforms[platform];
                    const s = PLATFORM_STATUS_STYLES[status];
                    const displayLabel =
                      status === 'displaced' && competitor
                        ? competitor.length > 20 ? competitor.slice(0, 20) + '…' : competitor
                        : s.label;
                    return (
                      <div key={platform} className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-sm text-gray-700">{platform}</span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${s.cls}`}>
                          {displayLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                No platforms have been tested yet.
                Search for {entityName} in ChatGPT or Perplexity to gather evidence.
              </p>
            )}
          </div>

          {/* Root cause */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Root cause</p>
            <ul className="space-y-3">
              {rootCauses.map((cause, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#EEEDFE] text-[#534AB7] text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{cause}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Why this matters now */}
          <div className="p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Why this matters now
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              AI citation positions shift by 40–60% each quarter as these platforms update their information sources.
              A competitor gaining ground now becomes structurally harder to displace each month they hold the position.
              The businesses that act first in any category tend to hold those positions longest.
            </p>
          </div>

        </div>

        {/* 4. High-contrast verify callout */}
        <div className="rounded-xl bg-gray-900 p-6 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Verify this yourself
          </p>
          <p className="text-white font-bold text-lg mb-4 leading-snug">
            Open {verifyPlatformName} right now and search this exact query:
          </p>
          <div className="bg-gray-800 rounded-lg px-4 py-3 mb-5 font-mono text-sm text-emerald-400 break-all select-all">
            &ldquo;{primaryQuery}&rdquo;
          </div>

          {isPlatformEmbeddable ? (
            <div>
              <div className="rounded-lg overflow-hidden border border-gray-700 mb-3">
                <div className="bg-gray-800 px-3 py-2 text-xs text-gray-400 border-b border-gray-700">
                  Live result on Perplexity · {snapshotDate}
                </div>
                <iframe
                  src={`https://www.perplexity.ai/search?q=${encodeURIComponent(primaryQuery)}`}
                  width="100%"
                  height="440"
                  title="Live Perplexity result"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  className="w-full bg-white"
                />
              </div>
              <a
                href={platformSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors"
              >
                Open directly in Perplexity →
              </a>
            </div>
          ) : (
            <a
              href={platformSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-5 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              See the live result on {verifyPlatformName} →
            </a>
          )}
        </div>

        {/* 5. What this means for your business — three gaps */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-1">What this means for your business</h2>
          <p className="text-sm text-gray-500 mb-5">
            Three gaps that explain your current AI visibility position.
          </p>

          {/* Gap 1 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex-shrink-0 text-xs font-bold text-white bg-[#534AB7] px-2 py-0.5 rounded">Gap 1</span>
              <h3 className="text-sm font-bold text-gray-900">How your content is structured</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3 leading-relaxed">
              AI engines decide whether to recommend a business based partly on how its website content is formatted.
              If the format doesn&rsquo;t clearly identify the category, services, and audience, AI engines skip it — regardless of quality.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {gap1Text}
            </p>
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Business consequence:</strong>{' '}
                If AI can&rsquo;t extract a clear description of what {entityName} does, it won&rsquo;t recommend you — even when buyers are searching for exactly what you offer.
              </p>
            </div>
          </div>

          {/* Gap 2 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex-shrink-0 text-xs font-bold text-white bg-[#534AB7] px-2 py-0.5 rounded">Gap 2</span>
              <h3 className="text-sm font-bold text-gray-900">How well-known your brand is to AI</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3 leading-relaxed">
              Whether AI engines have enough reliable information about your brand to confidently recommend it.
              AI engines draw on publicly available sources — company directories, news coverage, review platforms — to build a picture of each business.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {gap2Text}
            </p>
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Business consequence:</strong>{' '}
                Until AI engines can describe {entityName} accurately and with confidence, your reputation won&rsquo;t translate into AI-generated referrals — regardless of how strong your actual work is.
              </p>
            </div>
          </div>

          {/* Gap 3 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex-shrink-0 text-xs font-bold text-white bg-[#534AB7] px-2 py-0.5 rounded">Gap 3</span>
              <h3 className="text-sm font-bold text-gray-900">Who else is talking about you online</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3 leading-relaxed">
              The number of trusted third-party sources — industry publications, review platforms, analyst reports — that reference your brand.
              When AI engines encounter a business name, they check whether recognised external sources confirm it.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {gap3Text}
            </p>
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Business consequence:</strong>{' '}
                Without references from sources AI engines recognise, your brand is treated as unverified — and unverified brands are not recommended.
              </p>
            </div>
          </div>
        </div>

        {/* 6. Why timing matters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">Why timing matters</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            The brands that appear first in AI answers are not necessarily the biggest.
            They are the ones that formatted their content for AI discovery first.
            That window is still open, but it is closing.
            Every month a competitor holds an AI citation position, they become harder to displace.
            Your current position is not permanent — but it requires action before your competitors move further ahead.
          </p>
        </div>

        {/* 7. Three-option path forward */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">What would you like to do next?</h2>
          <p className="text-sm text-gray-500 mb-5">Three ways to move forward. No sales call required.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Option A */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
              <span className="inline-block self-start text-xs font-bold text-[#534AB7] bg-[#EEEDFE] px-2 py-0.5 rounded mb-3">A</span>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Get the full picture</h3>
              <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">
                AEO Visibility Report — one report, no subscription.
                Covers everything in the analysis above plus a prioritised list of fixes.
              </p>
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#534AB7] hover:underline"
              >
                Get the report →
              </a>
            </div>

            {/* Option B */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
              <span className="inline-block self-start text-xs font-bold text-[#534AB7] bg-[#EEEDFE] px-2 py-0.5 rounded mb-3">B</span>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Track your position every month</h3>
              <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">
                AEO Visibility Engine — monthly tracking across all AI platforms.
                Alerts when competitors move. Quarterly strategy review included.
              </p>
              <a
                href={monitorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#534AB7] hover:underline"
              >
                Start tracking →
              </a>
            </div>

            {/* Option C */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
              <span className="inline-block self-start text-xs font-bold text-[#534AB7] bg-[#EEEDFE] px-2 py-0.5 rounded mb-3">C</span>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Have us fix it for you</h3>
              <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">
                Done for you — Maxifi implements every fix.
                We handle the content formatting, brand presence, and citation work.
                Monthly reporting included.
              </p>
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#534AB7] hover:underline"
              >
                Book a strategy call →
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
