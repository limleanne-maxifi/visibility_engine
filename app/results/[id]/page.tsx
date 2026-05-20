import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getLeadById } from '@/lib/supabase';
import CopyLinkButton from './CopyLinkButton';
import DownloadPdfButton from './DownloadPdfButton';
import ShareByEmailButton from './ShareByEmailButton';
import {
  getAllCompetitors,
  formatCompetitors,
  getVisibilityScore,
  getIndustryBenchmark,
  buyerConversations,
  inferBusinessModel,
  getPipelineLabel,
} from '@/lib/scoring';

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

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

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/(\s+|-)/)
    .map(part => part.match(/[a-z]/) ? part.charAt(0).toUpperCase() + part.slice(1) : part)
    .join('');
}

function getPlatformSearchUrl(platform: string, query: string): string {
  const encoded = encodeURIComponent(query);
  switch (platform) {
    case 'ChatGPT':              return `https://chatgpt.com/?q=${encoded}`;
    case 'Google AI Overviews':  return `https://www.google.com/search?q=${encoded}`;
    case 'Perplexity':           return `https://www.perplexity.ai/search?q=${encoded}`;
    case 'Claude':               return 'https://claude.ai/new';
    case 'Gemini':               return 'https://gemini.google.com/app';
    case 'Microsoft Copilot':    return `https://copilot.microsoft.com/?q=${encoded}`;
    default:                     return `https://chatgpt.com/?q=${encoded}`;
  }
}

// ─── Platform matrix ──────────────────────────────────────────────────────────

const ALL_PLATFORMS = ['ChatGPT', 'Google AI Overviews', 'Perplexity', 'Microsoft Copilot', 'Claude', 'Gemini'];

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
  inaccurate: { label: 'Cited — wrong info',  cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  stale:      { label: 'Cited — outdated',    cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  unknown:    { label: 'Not checked', cls: 'bg-gray-100 text-gray-400 border-gray-200' },
};

// ─── Finding block helpers ────────────────────────────────────────────────────


function getRootCauses(
  awareness: string,
  entityName: string,
  industry: string,
  competitors: string[],
): string[] {
  const hasComp = competitors.length > 0;
  const compStr = formatCompetitors(competitors);
  const plural = competitors.length > 1;
  const compVerb = hasComp ? `${compStr} ${plural ? 'have' : 'has'}` : 'Leading brands in your category have';

  switch (awareness) {
    case "Yes — but I wasn't mentioned at all":
      return [
        `When buyers searched for what you do, ${entityName} did not appear in the AI response. This most commonly happens when a brand's online presence hasn't yet been structured in a way that AI engines can extract a clear category recommendation from.`,
        `AI engines typically cross-reference a brand against external sources — directories, publications, review platforms — before citing it. Brands that appear consistently across these sources tend to be cited more reliably.`,
        `${compVerb} formatted their online presence to match how buyers phrase questions in ${industry} — structuring content to match how buyers phrase questions is one of the most reliable ways to improve AI citation rates.`,
      ];
    case 'Yes — competitors were cited instead of me':
      return [
        `${compVerb} built a clearer, more consistent presence in the sources AI engines rely on — which is why they appear first.`,
        `AI engines extract recommendations most reliably from content that is structured to answer specific buyer questions directly. This is one of the most common reasons a brand is present in AI data but not cited in responses.`,
        `Third-party sources in the ${industry} sector — directories, review platforms, publications — reference ${hasComp ? compStr : 'competing brands in your category'} more consistently than ${entityName}.`,
      ];
    case 'Yes — but details about me were wrong':
      return [
        `Different sources online describe ${entityName} differently — AI engines blend these into a single answer that ends up inaccurate.`,
        `AI engines verify facts about a brand by cross-referencing multiple external sources. Where those sources are inconsistent or sparse, the AI fills gaps — sometimes incorrectly.`,
        `Your website isn't currently acting as the definitive source that overrides those inconsistencies. When AI encounters conflicting descriptions, it defaults to external sources — which are often less accurate than your own positioning.`,
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
  competitors: string[],
  platform: string,
): string {
  const plat = platform || 'AI search';
  const hasComp = competitors.length > 0;
  const compStr = formatCompetitors(competitors);
  const plural = competitors.length > 1;

  switch (awareness) {
    case "Yes — but I wasn't mentioned at all":
      return `Based on this snapshot, ${entityName} is not being surfaced when buyers search for ${industry} recommendations on ${plat}. Content structure is one of the most common reasons — the full report analyses the specific cause.`;
    case 'Yes — competitors were cited instead of me':
      return `${entityName}'s website covers the right topics, but ${hasComp ? `${compStr} ${plural ? 'have' : 'has'} formatted theirs` : 'leading brands in your category have formatted their content'} to more closely match how buyers phrase questions in ${industry}. This is one of the most common structural reasons AI surfaces a competitor ahead of you — the full report identifies the specific gap.`;
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
  competitors: string[],
  score: number,
  benchAvg: number,
): string {
  const opening = `AI engines build confidence in a brand by checking how consistently it appears across public sources — company directories, news coverage, review platforms. Where that consistency is lower, citations happen less frequently, regardless of the brand's actual quality or reputation.`;
  const hasComp = competitors.length > 0;
  const compStr = formatCompetitors(competitors);
  const plural = competitors.length > 1;
  if (score > 0 && score >= benchAvg) {
    return `${opening} ${hasComp ? `${compStr} ${plural ? 'have' : 'has'} a stronger presence in key directories and publications in ${industry}.` : `There are specific source types in ${industry} that aren't yet referencing ${entityName} reliably.`}`;
  }
  if (score > 0) {
    return `${opening} ${hasComp ? `In particular, ${compStr} ${plural ? 'have' : 'has'} stronger authority signals in this category — which is why ${plural ? 'they are' : 'it is'} cited first.` : `Brands at the industry benchmark in your category have stronger authority signals across these sources — which is why they are cited more reliably.`}`;
  }
  return `${opening} ${hasComp ? `${compStr} ${plural ? 'have' : 'has'} had more time to build their presence in the ${industry} sector.` : `The established businesses in ${industry} have built clearer footprints across the sources AI engines rely on.`}`;
}

function getGap3Specific(
  entityName: string,
  industry: string,
  awareness: string,
): string {
  if (awareness === 'Yes — and the results were accurate') {
    return `Third-party references from recognised sources in ${industry} — directories, analyst platforms, review sites — reinforce your current AI visibility. Maintaining and expanding your presence across these sources will help sustain your citation position as AI platforms update their data.`;
  }
  return `Third-party references from recognised sources in ${industry} — directories, analyst platforms, review sites — increase the likelihood of AI citation. When AI encounters a brand name, it checks whether trusted external sources confirm it. Based on what you've reported, building more consistent third-party references is likely a contributing factor to your current visibility position for ${entityName}.`;
}

// ─── Scoring methodology helpers ─────────────────────────────────────────────

function getScoringRows(
  awareness: string,
  competitors: string[],
  queryCount: number,
): Array<{ signal: string; measured: string; result: string; weight: string; bad?: boolean }> {
  const platformEntry =
    awareness === 'Yes — and the results were accurate'
      ? { result: 'Cited on primary platform', bad: false }
      : awareness === "Yes — but I wasn't mentioned at all"
      ? { result: 'Not cited on primary platform', bad: true }
      : awareness === 'Yes — competitors were cited instead of me'
      ? { result: 'Competitor cited instead', bad: true }
      : awareness === 'Yes — but details about me were wrong'
      ? { result: 'Cited with inaccurate details', bad: true }
      : awareness === 'Yes — but old/outdated info appeared'
      ? { result: 'Cited with outdated information', bad: true }
      : { result: 'Not yet tested', bad: false };

  const displacementEntry = competitors.length === 0
    ? { result: 'Not assessed — no competitor entered', bad: false }
    : awareness === 'Yes — and the results were accurate'
    ? { result: 'No displacement detected', bad: false }
    : awareness === 'Yes — competitors were cited instead of me'
    ? { result: `Yes — ${formatCompetitors(competitors)} cited on checked platforms`, bad: true }
    : awareness === "No, I haven't tried this yet"
    ? { result: 'Not yet assessed', bad: false }
    : { result: 'Presence confirmed — displacement not directly assessed', bad: false };

  const queryEntry =
    awareness === "No, I haven't tried this yet"
      ? { result: 'Not yet assessed', bad: false }
      : awareness === 'Yes — and the results were accurate'
      ? { result: `${queryCount} of ${queryCount} checked ${queryCount === 1 ? 'query' : 'queries'} returned your brand`, bad: false }
      : awareness === 'Yes — but old/outdated info appeared' || awareness === 'Yes — but details about me were wrong'
      ? { result: 'Brand appeared on checked queries, but with issues', bad: true }
      : { result: `0 of ${queryCount} checked ${queryCount === 1 ? 'query' : 'queries'} returned your brand`, bad: true };

  const consistencyEntry =
    awareness === 'Yes — and the results were accurate'
      ? { result: 'Consistent and accurate', bad: false }
      : awareness === 'Yes — but details about me were wrong'
      ? { result: 'Inconsistent — inaccurate details returned', bad: true }
      : awareness === 'Yes — but old/outdated info appeared'
      ? { result: 'Partially consistent — outdated information', bad: true }
      : { result: 'Based on self-reported assessment', bad: false };

  return [
    { signal: 'Platform presence', measured: 'Are you cited on any AI platform your buyers use?', ...platformEntry, weight: '30%' },
    { signal: 'Competitor displacement', measured: 'Do competitors appear instead of you on your core queries?', ...displacementEntry, weight: '30%' },
    { signal: 'Query coverage', measured: 'How many of your target queries return your brand?', ...queryEntry, weight: '25%' },
    { signal: 'Awareness consistency', measured: 'Does AI produce consistent, accurate information about your brand when asked directly?', ...consistencyEntry, weight: '15%' },
  ];
}

// ─── Opportunity framing helpers ──────────────────────────────────────────────

function getOpportunityContent(
  awareness: string,
  entityName: string,
  competitors: string[],
): { headline: string; body: string; displaced: boolean } {
  const hasComp = competitors.length > 0;
  const compStr = formatCompetitors(competitors);
  const plural = competitors.length > 1;
  switch (awareness) {
    case 'Yes — competitors were cited instead of me':
      return {
        headline: 'You are visible — but not being chosen.',
        body: `AI systems know about ${entityName}. When buyers search for what you do, your brand exists in the information these systems draw from. The problem is not invisibility — it is that ${hasComp ? `${compStr} ${plural ? 'are' : 'is'}` : 'other brands in your category are'} being selected as the authoritative answer instead of you. This is fixable — and faster to address than starting from zero. Your AI presence already exists, which is a good starting point. What needs to change is how your presence is structured, not whether you have one.`,
        displaced: true,
      };
    case "Yes — but I wasn't mentioned at all":
      return {
        headline: 'You are findable — but not yet being cited.',
        body: `AI systems have the building blocks to describe ${entityName}. The challenge is that your content isn't yet structured in a way that signals to AI engines which questions you should be the answer to. This is a content architecture problem, not a credibility one — and it is directly addressable.`,
        displaced: false,
      };
    case 'Yes — but details about me were wrong':
      return {
        headline: 'AI knows you exist — but is getting the details wrong.',
        body: `AI systems are drawing on information about ${entityName} from multiple sources — and those sources are inconsistent. When AI encounters conflicting information, it blends them into an inaccurate description. Your starting point is strong: you are known. The work is standardising how your brand is described across the sources AI engines rely on.`,
        displaced: false,
      };
    case 'Yes — but old/outdated info appeared':
      return {
        headline: 'You are cited — but for who you were, not who you are.',
        body: `AI systems have established information about ${entityName}, but they are drawing on older content rather than your current work. This is a signal strength problem: your recent content isn't formatted in a way that tells AI engines it supersedes the older material. The fix is specific and addressable.`,
        displaced: false,
      };
    default:
      return {
        headline: 'Your starting position is better than it may feel.',
        body: `Without a live test, it is not yet clear whether ${entityName} is invisible, cited inaccurately, or simply being displaced by a competitor. Each scenario requires a different fix — but none requires starting from zero. The AEO landscape is still early enough that a focused effort in the right areas creates measurable results within a quarter.`,
        displaced: false,
      };
  }
}

// ─── Section headline helpers ─────────────────────────────────────────────────

function getPageHeadline(awareness: string, entityName: string, score: number, benchAvg: number): string {
  switch (awareness) {
    case 'Yes — and the results were accurate':
      return `${entityName} is already in the AI conversation — and ahead of most. Here's how to hold that position as competitors catch up.`;
    case "Yes — but I wasn't mentioned at all":
      return `Your buyers are asking AI for recommendations. Right now, ${entityName} isn't in the answer — here's why, and what changes that.`;
    case 'Yes — but details about me were wrong':
      return `Good news: AI can find ${entityName}. The problem is what it's telling your buyers.`;
    case 'Yes — competitors were cited instead of me':
      return `When buyers ask AI who to call, your competitors get the referral. Here's exactly why — and what closes that gap.`;
    case 'Yes — but old/outdated info appeared':
      return `AI is recommending ${entityName} — but the version from years ago. Here's how to update the story it tells buyers.`;
    default:
      return `${entityName}'s AI visibility is undiagnosed. This snapshot shows you where you likely stand — and what to do first.`;
  }
}

function getScoreHeadline(score: number, benchAvg: number, industry: string): string {
  if (score === 0) return `Your AI visibility baseline is not yet established — here's what the signals suggest.`;
  const gap = benchAvg - score;
  if (gap > 0) return `Your score of ${score}% puts you ${gap} points below the ${industry} benchmark — a gap with a clear fix path.`;
  return `Your score of ${score}% is at or above the ${industry} benchmark — a strong starting position.`;
}

function getCompetitiveHeadline(score: number, benchAvg: number, industry: string, competitors: string[]): string {
  const gap = benchAvg - score;
  if (competitors.length > 0) {
    return gap > 0
      ? `${formatCompetitors(competitors)} ${competitors.length > 1 ? 'are' : 'is'} ahead — and the ${industry} median sits ${gap} points above your current score.`
      : `You are at or above the ${industry} median. The question is whether your named competitors are pulling further ahead.`;
  }
  return gap > 0
    ? `You are ${gap} points behind the ${industry} median — without competitor data, this is the clearest benchmark available.`
    : `You are at or above the ${industry} median — a competitive position worth protecting.`;
}

function getCitationHeadline(awareness: string, checkedCount: number, entityName: string): string {
  const n = checkedCount;
  const positiveRef = n === 1 ? 'the platform you tested' : n === 2 ? 'both platforms you tested' : `all ${n} platforms you tested`;
  const negativeRef  = n === 1 ? 'the platform you tested' : n === 2 ? 'either platform you tested' : `any of the ${n} platforms you tested`;
  switch (awareness) {
    case 'Yes — and the results were accurate':
      return `You appeared accurately on ${positiveRef} — a signal AI engines are reading your brand correctly.`;
    case "Yes — but I wasn't mentioned at all":
      return `${entityName} did not appear on ${negativeRef} — buyers searching here are not seeing you.`;
    case 'Yes — but details about me were wrong':
      return `You appeared on ${positiveRef} — but with incorrect information that could be misleading buyers.`;
    case 'Yes — competitors were cited instead of me':
      return `A competitor was returned on ${positiveRef} instead of you — buyers searching here are being directed elsewhere.`;
    case 'Yes — but old/outdated info appeared':
      return `You appeared on ${positiveRef} — but the information shown is outdated and no longer reflects your current offering.`;
    default:
      return `No platforms have been tested yet — run a search to establish your citation baseline.`;
  }
}

function getRootCauseHeadline(awareness: string): string {
  switch (awareness) {
    case 'Yes — and the results were accurate':       return `Three things keeping your AI citation position strong — and what could erode it.`;
    case "Yes — but I wasn't mentioned at all":       return `Three reasons AI isn't surfacing you yet — and which to fix first.`;
    case 'Yes — but details about me were wrong':     return `Three reasons AI is describing you inaccurately — and the one that matters most.`;
    case 'Yes — competitors were cited instead of me': return `Three structural reasons a competitor appears in your place — and how they got there.`;
    case 'Yes — but old/outdated info appeared':      return `Three reasons AI is citing an outdated version of your brand.`;
    default:                                           return `Three things your current AI visibility position reveals.`;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ResultsPage({ params }: Props) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const reportUrl    = process.env.REPORT_CHECKOUT_URL  ?? process.env.CALENDLY_URL ?? 'https://lunacal.ai/maxifidigital/';
  const monitorUrl   = process.env.MONITOR_CHECKOUT_URL ?? process.env.CALENDLY_URL ?? 'https://lunacal.ai/maxifidigital/';
  const calendlyUrl  = process.env.CALENDLY_URL ?? 'https://lunacal.ai/maxifidigital/';
  const contactEmail = process.env.MAXIFI_CONTACT_EMAIL ?? 'letsgetstarted@maxifidigital.com';

  const competitors  = getAllCompetitors(lead.competitors);
  const score        = getVisibilityScore(lead.awareness, competitors);
  const benchAvg     = getIndustryBenchmark(lead.industry);
  const platforms    = getPlatformStatuses(lead.awareness, lead.platform, lead.platform_other);

  const entityName       = lead.company_name ?? lead.first_name;
  const derivedQueries   = deriveQueries(entityName, lead.positioning, lead.target_queries);

  const snapshotDate     = new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const checkedPlatforms = ALL_PLATFORMS.filter((p) => platforms[p] !== 'unknown');

  const gap             = benchAvg - score;
  const { x: buyerX, y: buyerY } = buyerConversations(score, benchAvg);
  const businessModel   = inferBusinessModel(lead.industry);
  const pipelineLabel   = getPipelineLabel(businessModel);

  const rootCauses   = getRootCauses(lead.awareness, entityName, lead.industry, competitors);
  const scoringRows  = getScoringRows(lead.awareness, competitors, derivedQueries.length);
  const opportunity  = getOpportunityContent(lead.awareness, entityName, competitors);

  const gap1Text = getGap1Specific(lead.awareness, entityName, lead.industry, competitors, lead.platform);
  const gap2Text = getGap2Specific(entityName, lead.industry, competitors, score, benchAvg);
  const gap3Text = getGap3Specific(entityName, lead.industry, lead.awareness);

  const pageHeadline        = getPageHeadline(lead.awareness, entityName, score, benchAvg);
  const scoreHeadline       = getScoreHeadline(score, benchAvg, lead.industry);
  const competitiveHeadline = getCompetitiveHeadline(score, benchAvg, lead.industry, competitors);
  const citationHeadline    = getCitationHeadline(lead.awareness, checkedPlatforms.length, entityName);
  const rootCauseHeadline   = getRootCauseHeadline(lead.awareness);

  console.log('[results] id:', lead.id, '| awareness:', lead.awareness, '| competitors:', lead.competitors, '| company_name:', lead.company_name, '| target_queries:', lead.target_queries, '| positioning:', lead.positioning, '| platform:', lead.platform);

  const buyerQuery = (() => {
    if (lead.target_queries?.trim()) {
      const q = lead.target_queries.split(/[,;\n]/)[0].trim();
      if (q) return q;
    }
    if (lead.positioning?.trim()) return lead.positioning.trim().slice(0, 120);
    return `best ${lead.industry} firms`;
  })();

  const isGenericQuery = !lead.target_queries?.trim() && !lead.positioning?.trim();
  const isPlatformEmbeddable = false; // Perplexity and all platforms block iframe embedding
  const platformSearchUrl    = getPlatformSearchUrl(lead.platform, buyerQuery);
  const verifyPlatformName   = lead.platform || 'ChatGPT';

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <style>{`
        @media print {
          body { background: white !important; font-size: 11pt; }
          .print\\:hidden { display: none !important; }
          /* Remove shadows and backgrounds for clean print */
          * { box-shadow: none !important; }
          /* Page breaks */
          .page-break-before { page-break-before: always; }
          /* Force URLs visible for booking links */
          a[href]::after { content: " (" attr(href) ")"; font-size: 9pt; color: #6b5dd3; }
          a[href^="mailto"]::after, a[href^="javascript"]::after, a[href="#"]::after { content: none; }
          /* Hide search/interactive links in print — shown inline only */
          .no-print-url::after { content: none !important; }
          /* Scale for A4 */
          @page { margin: 18mm 15mm; size: A4; }
        }
      `}</style>
      <div className="max-w-[640px] mx-auto">

        {/* 1. Header */}
        <div className="mb-8">
          <div className="flex items-center w-full mb-4 pb-4 border-b border-gray-100">
            {/* Logo — flush left */}
            <div className="flex-none">
              <Image
                src="/maxifi-logo-black.png"
                alt="Maxifi Digital"
                height={60}
                width={300}
                className="h-[60px] w-auto"
              />
            </div>

            {/* Title — 50px from logo, centred in remaining space */}
            <div className="flex-1 flex justify-start min-w-0 pl-[16px]">
              <p
                className="text-2xl whitespace-nowrap"
                style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 700, whiteSpace: 'nowrap', color: '#1a2744', letterSpacing: '0.05em' }}
              >
                AI Visibility Snapshot
              </p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
            {toTitleCase(lead.first_name)}&rsquo;s AI Visibility Snapshot
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            {entityName} · {lead.industry} · {lead.occupation} · Generated {snapshotDate}
          </p>
          <p className="text-lg font-bold text-gray-900 leading-snug">{pageHeadline}</p>
        </div>

        {/* 2. Scoring methodology */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            How your score was calculated
          </p>
          <p className="text-base font-bold text-gray-900 leading-snug mb-4">{scoreHeadline}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400">
                  <th className="text-left pb-2 font-medium pr-3">Signal</th>
                  <th className="text-left pb-2 font-medium pr-3">What we measured</th>
                  <th className="text-left pb-2 font-medium pr-3">Your result</th>
                  <th className="text-right pb-2 font-medium">Weight</th>
                </tr>
              </thead>
              <tbody>
                {scoringRows.map((row) => (
                  <tr key={row.signal} className="border-b border-gray-50">
                    <td className="py-3 pr-3 text-sm font-semibold text-gray-700 whitespace-nowrap align-top">{row.signal}</td>
                    <td className="py-3 pr-3 text-sm text-gray-500 align-top">{row.measured}</td>
                    <td className={`py-3 pr-3 text-sm font-medium align-top ${row.bad ? 'text-amber-700' : 'text-gray-700'}`}>{row.result}</td>
                    <td className="py-3 text-right text-sm font-bold text-[#534AB7] whitespace-nowrap align-top">{row.weight}</td>
                  </tr>
                ))}
                <tr className="bg-[#EEEDFE]">
                  <td className="py-3 pr-3 text-sm font-bold text-[#3C3489] whitespace-nowrap">Your AEO Visibility Score</td>
                  <td className="py-3 pr-3 text-sm text-[#534AB7]">Weighted total across all four signals</td>
                  <td className="py-3 pr-3 font-bold text-[#3C3489] text-base whitespace-nowrap">
                    {score > 0 ? `${score}%` : 'Undiagnosed'}
                  </td>
                  <td className="py-3 text-right text-sm text-[#534AB7] whitespace-nowrap">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          {score > 0 ? (
            <div className="mt-4 rounded-xl bg-[#1a2744] text-white p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-300 mb-2">What this means for your pipeline</p>
              <p className="text-2xl font-bold leading-tight mb-3">
                {10 - buyerX} out of 10 {pipelineLabel.referrals}<br className="hidden sm:block" /> in your category are going to other brands.
              </p>
              <ul className="space-y-1.5 text-sm text-blue-100">
                <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-400">▸</span><span>{entityName} appears in approximately <strong className="text-white">{buyerX} in 10</strong> cases where {pipelineLabel.action} in your category.</span></li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-400">▸</span><span>{competitors.length > 0 ? 'Your named competitors appear' : `Brands at the ${lead.industry} benchmark appear`} in <strong className="text-white">{buyerY} or more</strong> of those same situations.</span></li>
                {buyerY - buyerX > 0 && (
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-400">▸</span><span>Closing to benchmark could unlock <strong className="text-white">{buyerY - buyerX} additional {pipelineLabel.referral}{buyerY - buyerX > 1 ? 's' : ''}</strong> per 10 opportunities.</span></li>
                )}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed mt-4">Your visibility score is undiagnosed — run a search in ChatGPT or Perplexity to establish your baseline.</p>
          )}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 leading-relaxed">
              This score reflects how consistently your brand appears in AI-generated responses across the platforms your buyers use.
              The indicative benchmark for {lead.industry || 'your sector'} is <strong>{benchAvg}%</strong> — based on Maxifi Digital&rsquo;s analysis of citation patterns across industries.
              {businessModel === 'B2G'
                ? ' For procurement-led sectors, this benchmark reflects AI citation during vendor research and due diligence — not transactional referrals.'
                : ' Brands scoring below 30% are typically invisible in AI buyer journeys.'
              }
            </p>
          </div>
        </div>

        {/* 3. Competitive position table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Competitive position
          </p>
          <p className="text-base font-bold text-gray-900 leading-snug mb-4">{competitiveHeadline}</p>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400">
                <th className="text-left pb-2 font-medium pr-4">Position</th>
                <th className="text-left pb-2 font-medium pr-4">Brand</th>
                <th className="text-right pb-2 font-medium">AI visibility</th>
              </tr>
            </thead>
            <tbody>
              {competitors.length > 0
                ? competitors.map((comp, i) => (
                    <tr key={comp} className="border-b border-gray-50">
                      <td className="py-3 pr-4 text-xs text-gray-400 whitespace-nowrap">{i === 0 ? 'Competitor' : ''}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{comp}</td>
                      <td className="py-3 text-right text-xs text-gray-400 whitespace-nowrap">Est. above median</td>
                    </tr>
                  ))
                : (
                    <tr className="border-b border-dashed border-gray-200">
                      <td className="py-3 pr-4 text-xs text-gray-400 whitespace-nowrap">Competitor</td>
                      <td className="py-3 pr-4 text-gray-400 italic">Not yet compared</td>
                      <td className="py-3 text-right text-gray-400">—</td>
                    </tr>
                  )
              }
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
          </div>
          {competitors.length === 0 && (
            <p className="text-xs text-[#534AB7] font-medium mt-4">
              Add your closest competitors above to see how their AI visibility compares to yours — and who is leading in your category.
            </p>
          )}

        </div>

        {/* 3. Structured finding block */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">

          {/* Opportunity framing */}
          <div className={`p-6 border-b border-gray-100 ${opportunity.displaced ? 'bg-blue-50/50' : ''}`}>
            <p className="text-xs font-semibold text-[#534AB7] uppercase tracking-wide mb-3">
              Where your biggest opportunity lies right now
            </p>
            <p className="text-base font-bold text-gray-900 leading-snug mb-3">{opportunity.headline}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{opportunity.body}</p>
          </div>

          {/* Evidence / citation status by platform */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Citation status by platform</p>
            <p className="text-base font-bold text-gray-900 leading-snug mb-3">{citationHeadline}</p>
            {lead.awareness === "No, I haven't tried this yet" ? (
              <p className="text-sm text-gray-600 leading-relaxed">
                Run a quick test: open ChatGPT and search for what you do. Note which brands appear. Those are your citation competitors.
              </p>
            ) : checkedPlatforms.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  Your reported test on {snapshotDate} · Query: &ldquo;{buyerQuery}&rdquo;
                </p>
                <div className="rounded-lg bg-gray-50 divide-y divide-gray-100 overflow-hidden border border-gray-100">
                  {checkedPlatforms.map((platform) => {
                    const status = platforms[platform];
                    const s = PLATFORM_STATUS_STYLES[status];
                    let displayLabel = s.label;
                    let badgeCls = s.cls;
                    if (status === 'displaced') {
                      if (competitors.length > 0) {
                        const label = competitors.length === 1
                          ? competitors[0]
                          : `${competitors[0]} +${competitors.length - 1}`;
                        displayLabel = label.length > 22 ? label.slice(0, 22) + '…' : label;
                      } else {
                        displayLabel = 'Competitor not named';
                        badgeCls = 'bg-gray-100 text-gray-500 border-gray-200';
                      }
                    }
                    const searchUrl = getPlatformSearchUrl(platform, buyerQuery);
                    return (
                      <div key={platform} className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-sm text-gray-700">{platform}</span>
                        <span className="flex items-center gap-2">
                          <a
                            href={searchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-medium text-[#6B5DD3] hover:underline whitespace-nowrap no-print-url print:hidden"
                          >
                            Search now →
                          </a>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${badgeCls}`}>
                            {displayLabel}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                {competitors.length === 0 && lead.awareness === 'Yes — competitors were cited instead of me' && (
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    You indicated competitors are appearing instead of you but didn&rsquo;t name them.
                    Your full AEO Visibility Report identifies exactly which brands are displacing you on each platform.{' '}
                    <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="text-[#534AB7] font-medium hover:underline">Get the full report →</a>
                  </p>
                )}
                {competitors.length === 0 && lead.awareness !== 'Yes — competitors were cited instead of me' && lead.awareness !== "No, I haven't tried this yet" && (
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    {lead.awareness === "Yes — but I wasn't mentioned at all"
                      ? 'No brands were returned for you on the platforms you tested. Enter your closest competitors to see how their visibility compares to yours.'
                      : lead.awareness === 'Yes — but details about me were wrong'
                      ? 'You were cited on these platforms, but the information presented was incorrect. Your full report identifies which sources AI is pulling from and what needs to change.'
                      : lead.awareness === 'Yes — but old/outdated info appeared'
                      ? 'You were cited on these platforms, but with outdated information. Your full report identifies which content AI is drawing on and how to update it.'
                      : 'Enter your closest competitors to see how their AI visibility compares to yours across these platforms.'
                    }
                  </p>
                )}
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Root cause</p>
            <p className="text-base font-bold text-gray-900 leading-snug mb-3">{rootCauseHeadline}</p>
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
              AI citation positions shift as these platforms update their information sources — sometimes significantly within a single quarter.
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
            &ldquo;{buyerQuery}&rdquo;
          </div>
          {isGenericQuery && (
            <p className="text-xs text-gray-500 mb-4">
              No target queries or positioning were provided, so this uses a general industry search. For a more accurate result, search for exactly what you do — e.g. your specific service or niche.
            </p>
          )}

          <a
            href={platformSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-5 py-3 rounded-lg hover:bg-gray-100 transition-colors no-print-url"
          >
            See the live result on {verifyPlatformName} →
          </a>
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
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {gap1Text}
            </p>
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 mb-3">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Business consequence:</strong>{' '}
                If AI can&rsquo;t extract a clear description of what{' '}{entityName}{' '}does, it won&rsquo;t recommend you — even when buyers are searching for exactly what you offer.
              </p>
            </div>
            <details className="group">
              <summary className="text-xs text-[#534AB7] cursor-pointer list-none flex items-center gap-1 select-none hover:underline">
                <span className="group-open:hidden">+ How AI evaluates content structure</span>
                <span className="hidden group-open:inline">− Hide</span>
              </summary>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                AI engines decide whether to recommend a business based partly on how its website content is formatted.
                If the format doesn&rsquo;t clearly identify the category, services, and audience, AI engines skip it — regardless of quality.
              </p>
            </details>
          </div>

          {/* Gap 2 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex-shrink-0 text-xs font-bold text-white bg-[#534AB7] px-2 py-0.5 rounded">Gap 2</span>
              <h3 className="text-sm font-bold text-gray-900">How well-known your brand is to AI</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {gap2Text}
            </p>
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 mb-3">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Business consequence:</strong>{' '}
                Until AI engines can describe{' '}{entityName}{' '}accurately and with confidence, your reputation won&rsquo;t translate into AI-generated referrals — regardless of how strong your actual work is.
              </p>
            </div>
            <details className="group">
              <summary className="text-xs text-[#534AB7] cursor-pointer list-none flex items-center gap-1 select-none hover:underline">
                <span className="group-open:hidden">+ How AI measures brand authority</span>
                <span className="hidden group-open:inline">− Hide</span>
              </summary>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Whether AI engines have enough reliable information about your brand to confidently recommend it.
                AI engines draw on publicly available sources — company directories, news coverage, review platforms — to build a picture of each business.
              </p>
            </details>
          </div>

          {/* Gap 3 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex-shrink-0 text-xs font-bold text-white bg-[#534AB7] px-2 py-0.5 rounded">Gap 3</span>
              <h3 className="text-sm font-bold text-gray-900">Who else is talking about you online</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {gap3Text}
            </p>
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 mb-3">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Business consequence:</strong>{' '}
                Without references from sources AI engines recognise, your brand is treated as unverified — and unverified brands are not recommended.
              </p>
            </div>
            <details className="group">
              <summary className="text-xs text-[#534AB7] cursor-pointer list-none flex items-center gap-1 select-none hover:underline">
                <span className="group-open:hidden">+ How third-party references affect AI citation</span>
                <span className="hidden group-open:inline">− Hide</span>
              </summary>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                The number of trusted third-party sources — industry publications, review platforms, analyst reports — that reference your brand.
                When AI engines encounter a business name, they check whether recognised external sources confirm it.
              </p>
            </details>
          </div>
        </div>

        {/* 6. Why timing matters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">Why timing matters</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            The brands that appear first in AI answers are not necessarily the biggest — they are the ones that structured their presence for AI discovery first.
            AI platforms update their citation sources regularly, and positions shift with each update.
            A brand that addresses these gaps now will hold a structural advantage over one that waits.
            {score > 0 && score < benchAvg
              ? <> At {score}%, {entityName} is currently {gap} percentage points below the {lead.industry} benchmark — a gap that is closable with targeted action, but widens if left unaddressed.</>
              : null
            }
          </p>
        </div>

        {/* 7. Three-option path forward */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">What would you like to do next?</h2>
          <p className="text-sm text-gray-500 mb-5">Three ways to move forward. No sales call required.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Option A — primary/recommended */}
            <div className="bg-white rounded-xl border-2 border-[#534AB7] p-5 flex flex-col relative">
              <span className="absolute -top-3 left-4 text-[10px] font-bold text-white bg-[#534AB7] px-2 py-0.5 rounded-full tracking-wide uppercase">Most requested</span>
              <span className="inline-block self-start text-xs font-bold text-[#534AB7] bg-[#EEEDFE] px-2 py-0.5 rounded mb-3 mt-1">A</span>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Get the full picture</h3>
              <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">
                AEO Visibility Report — one report, no subscription.
                Covers every fix in order of impact, plus the exact sources AI is drawing on about you.
              </p>
              <a
                href={reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm font-semibold text-white bg-[#534AB7] hover:bg-[#4640a0] rounded-lg px-4 py-2.5 transition-colors"
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

        {/* Share + Download */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Share or save this snapshot</h2>
          <p className="text-gray-500 text-sm mb-4">
            Send directly to your inbox — or forward to a colleague. Link is persistent.
          </p>
          <ShareByEmailButton
            defaultEmail={lead.email}
            firstName={toTitleCase(lead.first_name)}
            company={entityName}
          />
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
            <CopyLinkButton />
            <DownloadPdfButton />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center mb-3">
          <Image
            src="/maxifi-logo-black.png"
            alt="Maxifi Digital"
            height={20}
            width={100}
            className="h-5 w-auto opacity-30"
          />
        </div>
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
