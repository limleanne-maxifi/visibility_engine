'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import CopyLinkButton from './CopyLinkButton';
import DownloadPdfButton from './DownloadPdfButton';
import ShareByEmailButton from './ShareByEmailButton';
import {
  formatCompetitors,
  buyerConversations,
  inferBusinessModel,
  getPipelineLabel,
} from '@/lib/scoring';
import type {
  FreeReportResponse,
  FullReportSections,
} from '@/lib/types-v2';

// ─── Reverse-map failure mode → awareness string ──────────────────────────────

const FAILURE_MODE_TO_AWARENESS: Record<string, string> = {
  not_structured: "Yes — but I wasn't mentioned at all",
  inaccurate:     'Yes — but details about me were wrong',
  displaced:      'Yes — competitors were cited instead of me',
  stale:          'Yes — but old/outdated info appeared',
  untested:       "No, I haven't tried this yet",
  low_authority:  'Yes — and the results were accurate',
};

// ─── Data helpers (kept as fallback) ─────────────────────────────────────────

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
  cited:      { label: 'Cited ✓',            cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  displaced:  { label: 'Competitor',          cls: 'bg-red-100 text-red-700 border-red-200' },
  missing:    { label: 'Not found',           cls: 'bg-red-100 text-red-700 border-red-200' },
  inaccurate: { label: 'Cited — wrong info',  cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  stale:      { label: 'Cited — outdated',    cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  unknown:    { label: 'Not checked',         cls: 'bg-gray-100 text-gray-400 border-gray-200' },
};

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
    { signal: 'Platform presence',        measured: 'Are you cited on any AI platform your buyers use?',                                           ...platformEntry,    weight: '30%' },
    { signal: 'Competitor displacement',  measured: 'Do competitors appear instead of you on your core queries?',                                  ...displacementEntry, weight: '30%' },
    { signal: 'Query coverage',           measured: 'How many of your target queries return your brand?',                                          ...queryEntry,       weight: '25%' },
    { signal: 'Awareness consistency',    measured: 'Does AI produce consistent, accurate information about your brand when asked directly?',      ...consistencyEntry, weight: '15%' },
  ];
}

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
        body: `Without a live test, it is not yet clear whether ${entityName} is invisible, cited inaccurately, or simply being displaced by a competitor. Each scenario requires a different fix — but none requires starting from zero. The AI landscape is still early enough that a focused effort in the right areas creates measurable results within a quarter.`,
        displaced: false,
      };
  }
}

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

// ─── Full-fetch status type ───────────────────────────────────────────────────

type FullFetchStatus = 'idle' | 'loading' | 'loaded' | 'payment_required' | 'generating' | 'no_session' | 'error';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const params     = useParams();
  const snapshotId = params.id as string;

  const [freeData,    setFreeData]    = useState<FreeReportResponse | null>(null);
  const [fullData,    setFullData]    = useState<FullReportSections | null>(null);
  const [freeLoading, setFreeLoading] = useState(true);
  const [fullStatus,  setFullStatus]  = useState<FullFetchStatus>('idle');
  const [gateEmail,   setGateEmail]   = useState('');
  const [gateStatus,  setGateStatus]  = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [gateError,   setGateError]   = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);

  useEffect(() => {
    if (!snapshotId) return;
    setFreeLoading(true);
    setFullStatus('loading');

    Promise.all([
      fetch(`/api/report/${snapshotId}/free`),
      fetch(`/api/report/${snapshotId}/full`),
    ]).then(async ([freeRes, fullRes]) => {
      if (freeRes.ok) {
        const data = await freeRes.json();
        setFreeData(data);
      }
      setFreeLoading(false);

      if (fullRes.status === 200) {
        const data = await fullRes.json();
        setFullData(data.sections);
        setFullStatus('loaded');
      } else if (fullRes.status === 202) {
        setFullStatus('generating');
      } else if (fullRes.status === 401) {
        const data = await fullRes.json().catch(() => ({}));
        setFullStatus(data.code === 'PAYMENT_REQUIRED' ? 'payment_required' : 'no_session');
      } else if (fullRes.status === 403) {
        setFullStatus('payment_required');
      } else {
        setFullStatus('no_session');
      }
    }).catch(() => {
      setFreeLoading(false);
      setFullStatus('no_session');
    });
  }, [snapshotId]);

  async function handleGateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGateStatus('submitting');
    setGateError('');
    try {
      const res = await fetch('/api/gate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: gateEmail, snapshot_id: snapshotId }),
      });
      if (res.status === 200 || res.status === 202) {
        setGateStatus('sent');
      } else {
        const data = await res.json().catch(() => ({}));
        setGateError(data.error ?? 'Something went wrong. Please try again.');
        setGateStatus('error');
      }
    } catch {
      setGateError('Network error. Please try again.');
      setGateStatus('error');
    }
  }

  async function handleUnlock() {
    setUnlockLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ snapshot_id: snapshotId }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.checkout_url;
        return;
      }
      if (res.status === 401) {
        setFullStatus('no_session');
      }
    } catch {
      // swallow — button re-enables
    }
    setUnlockLoading(false);
  }

  // ── Derived values from API sections ─────────────────────────────────────────

  const cs = freeData?.sections.citation_snapshot;
  const fd = freeData?.sections.failure_mode_diagnosis;
  const bc = freeData?.sections.benchmark_comparison;

  const awareness  = FAILURE_MODE_TO_AWARENESS[fd?.primary_failure_mode ?? ''] ?? '';
  const entityName = 'your brand';
  const competitors: string[] = [];

  const score    = bc?.score    ?? 0;
  const benchAvg = bc?.benchmark ?? 50;
  const industry = bc?.industry  ?? '';
  const gap      = bc?.gap       ?? (benchAvg - score);

  const { x: buyerX, y: buyerY } = bc
    ? { x: bc.buyer_x, y: bc.buyer_y }
    : buyerConversations(score, benchAvg);

  const businessModel = inferBusinessModel(industry);
  const pipelineLabel = getPipelineLabel(businessModel);

  const buyerQuery     = cs?.query_used      ?? `best ${industry} firms`;
  const isGenericQuery = cs?.query_is_generic ?? true;
  const snapshotDate   = cs?.tested_date     ?? '';

  const checkedPlatforms = cs?.platforms.filter((p) => p.status !== 'unknown') ?? [];
  const primaryPlatform  = checkedPlatforms[0];
  const verifyPlatformName = primaryPlatform?.name ?? 'ChatGPT';
  const platformSearchUrl  = primaryPlatform?.search_url ?? getPlatformSearchUrl('ChatGPT', buyerQuery);

  // Use pre-generated text from API where available, helpers as fallback
  const opportunityFromApi = fd
    ? { headline: fd.opportunity_headline, body: fd.opportunity_body, displaced: fd.primary_failure_mode === 'displaced' }
    : null;
  const opportunity = opportunityFromApi ?? getOpportunityContent(awareness, entityName, competitors);

  const rootCausesFromApi = fd?.root_causes.map((rc) => rc.cause);
  const rootCauses        = rootCausesFromApi ?? getRootCauses(awareness, entityName, industry, competitors);

  const scoringRows         = getScoringRows(awareness, competitors, Math.max(checkedPlatforms.length, 1));
  const gap1Text            = getGap1Specific(awareness, entityName, industry, competitors, primaryPlatform?.name ?? '');
  const gap2Text            = getGap2Specific(entityName, industry, competitors, score, benchAvg);
  const gap3Text            = getGap3Specific(entityName, industry, awareness);
  const pageHeadline        = getPageHeadline(awareness, entityName, score, benchAvg);
  const scoreHeadline       = getScoreHeadline(score, benchAvg, industry);
  const competitiveHeadline = getCompetitiveHeadline(score, benchAvg, industry, competitors);
  const citationHeadline    = getCitationHeadline(awareness, checkedPlatforms.length, entityName);
  const rootCauseHeadline   = getRootCauseHeadline(awareness);

  const reportUrl   = process.env.NEXT_PUBLIC_REPORT_CHECKOUT_URL  ?? process.env.NEXT_PUBLIC_CALENDLY_URL ?? 'https://calendly.com/maxifi-digital';
  const monitorUrl  = process.env.NEXT_PUBLIC_MONITOR_CHECKOUT_URL ?? process.env.NEXT_PUBLIC_CALENDLY_URL ?? 'https://calendly.com/maxifi-digital';
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? 'https://calendly.com/maxifi-digital';
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'letsgetstarted@maxifidigital.com';

  // ── Loading skeleton ──────────────────────────────────────────────────────────

  if (freeLoading) {
    return (
      <div className="min-h-screen bg-[#152438] flex flex-col">
        <header className="flex items-center justify-between px-6 sm:px-8 h-14 border-b border-white/[0.07] bg-[#091521]/80 backdrop-blur-sm flex-shrink-0">
          <Image src="/maxifi-logo-white.png" alt="Maxifi Digital" height={28} width={140} className="h-7 w-auto" />
        </header>
        <div className="py-10 px-4">
          <div className="max-w-[640px] mx-auto space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!freeData) {
    return (
      <div className="min-h-screen bg-[#152438] flex items-center justify-center">
        <p className="text-white/60 text-sm">Report not found.</p>
      </div>
    );
  }

  // ── Sections 5-8 renderers ────────────────────────────────────────────────────

  function renderGateForm() {
    return (
      <div className="bg-white rounded-xl border-2 border-[#C87A2F] p-6 mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-2">Get your full AI Visibility Report</h2>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Enter your email to receive a magic link. Your full report includes competitor displacement analysis, positioning gaps, query coverage, and a 60-day action queue.
        </p>
        {gateStatus === 'sent' ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
            <p className="text-sm text-emerald-800 font-medium">Check your inbox — we&rsquo;ve sent you a magic link to view your full report.</p>
          </div>
        ) : (
          <form onSubmit={handleGateSubmit} className="flex gap-2">
            <input
              type="email"
              required
              value={gateEmail}
              onChange={(e) => setGateEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C87A2F]/40 focus:border-[#C87A2F]"
            />
            <button
              type="submit"
              disabled={gateStatus === 'submitting'}
              className="text-sm font-semibold text-white bg-[#C87A2F] hover:bg-[#A8651E] rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {gateStatus === 'submitting' ? 'Sending…' : 'Send link'}
            </button>
          </form>
        )}
        {gateStatus === 'error' && gateError && (
          <p className="text-sm text-red-600 mt-2">{gateError}</p>
        )}
      </div>
    );
  }

  function renderLockedSections() {
    const LOCKED_SECTIONS = [
      { title: 'Competitor displacement analysis', subtitle: 'Which competitors AI is citing instead of you, and why.' },
      { title: 'Positioning gap',                  subtitle: 'How your content is structured vs. what AI needs to cite you.' },
      { title: 'Query gap analysis',               subtitle: 'Which buyer queries you are missing and what to target.' },
      { title: '60-day action queue',              subtitle: 'Every fix, in order of impact, with effort estimates.' },
    ];
    return (
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Full AI Visibility Report</h2>
            <p className="text-sm text-gray-500 mt-1">Four sections. One-time unlock. No subscription.</p>
          </div>
          <button
            onClick={handleUnlock}
            disabled={unlockLoading}
            className="flex-shrink-0 text-sm font-semibold text-white bg-[#C87A2F] hover:bg-[#A8651E] rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {unlockLoading ? 'Redirecting…' : 'Unlock — SGD 299'}
          </button>
        </div>
        <div className="space-y-4">
          {LOCKED_SECTIONS.map((s) => (
            <div key={s.title} className="relative bg-white rounded-xl border border-gray-100 shadow-sm p-6 overflow-hidden">
              <div className="blur-sm select-none pointer-events-none">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{s.title}</p>
                <p className="text-base font-bold text-gray-900 mb-4">{s.subtitle}</p>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-5/6" />
                  <div className="h-3 bg-gray-100 rounded w-4/6" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-1.5">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-xs text-gray-500 font-medium">Unlock to view</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderGeneratingPlaceholder() {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 bg-[#C87A2F] rounded-full animate-pulse" />
          <p className="text-sm font-semibold text-gray-700">Generating your full report…</p>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Your competitor displacement analysis, positioning gap, query gap, and 60-day action queue are being prepared. This takes about 30–60 seconds. Refresh the page to check.
        </p>
      </div>
    );
  }

  function renderUnlockedSections() {
    if (!fullData) return null;
    const cd = fullData.competitor_displacement;
    const pg = fullData.positioning_gap;
    const qg = fullData.query_gap;
    const aq = fullData.action_queue;

    return (
      <div className="mb-8">
        {/* Section 5 — Competitor Displacement */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Competitor displacement analysis</p>
          <p className="text-base font-bold text-gray-900 leading-snug mb-4">{cd.displacement_summary}</p>
          {cd.competitors.length > 0 ? (
            <div className="space-y-3 mb-4">
              {cd.competitors.map((comp) => (
                <div key={comp.name} className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{comp.name}</span>
                    {comp.displacement_likely && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded border bg-red-100 text-red-700 border-red-200 whitespace-nowrap">Displacing you</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{comp.ai_generated_assessment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No named competitors were provided — the analysis reflects general category displacement patterns.</p>
          )}
          <p className="text-sm text-gray-700 leading-relaxed">{cd.ai_narrative}</p>
        </div>

        {/* Section 6 — Positioning Gap */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Positioning gap</p>
          <p className="text-base font-bold text-gray-900 leading-snug mb-4">{pg.gap_summary}</p>
          {pg.content_structure_issues.length > 0 && (
            <ul className="space-y-2 mb-4">
              {pg.content_structure_issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="flex-shrink-0 text-[#C87A2F] font-bold mt-0.5">▸</span>
                  {issue}
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-lg bg-[#FDF1E6] border border-amber-200 px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-[#7a4a10] uppercase tracking-wide mb-1">Recommended angle</p>
            <p className="text-sm text-[#7a4a10] leading-relaxed">{pg.recommended_angle}</p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{pg.ai_narrative}</p>
        </div>

        {/* Section 7 — Query Gap */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Query gap analysis</p>
          <p className="text-base font-bold text-gray-900 leading-snug mb-4">{qg.coverage_assessment}</p>
          {qg.missing_query_types.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Query types you are missing</p>
              <ul className="space-y-1">
                {qg.missing_query_types.map((qt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-400 font-bold mt-0.5 flex-shrink-0">✕</span>
                    {qt}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {qg.recommended_queries.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Recommended queries to target</p>
              <ul className="space-y-1.5">
                {qg.recommended_queries.map((q, i) => (
                  <li key={i} className="font-mono text-sm text-emerald-700 bg-emerald-50 rounded px-3 py-1.5">&ldquo;{q}&rdquo;</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-sm text-gray-700 leading-relaxed">{qg.ai_narrative}</p>
        </div>

        {/* Section 8 — 60-Day Action Queue */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">60-day action queue</p>
          <p className="text-base font-bold text-gray-900 leading-snug mb-1">
            {aq.total_steps} actions — start here first:
          </p>
          <p className="text-sm text-[#C87A2F] font-medium mb-4">{aq.quick_win}</p>
          <div className="space-y-3">
            {aq.steps.map((step) => (
              <div key={step.num} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#C87A2F] text-white text-xs font-bold flex items-center justify-center">{step.num}</span>
                    <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap ${step.effort === 'low' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : step.effort === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {step.effort} effort
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap ${step.impact === 'high' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : step.impact === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {step.impact} impact
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium px-1.5 py-0.5 whitespace-nowrap">Wk {step.week}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed pl-7">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#152438] flex flex-col">
      <style>{`
        @media print {
          body { background: white !important; font-size: 11pt; }
          .print\\:hidden { display: none !important; }
          * { box-shadow: none !important; }
          .page-break-before { page-break-before: always; }
          a[href]::after { content: " (" attr(href) ")"; font-size: 9pt; color: #C87A2F; }
          a[href^="mailto"]::after, a[href^="javascript"]::after, a[href="#"]::after { content: none; }
          .no-print-url::after { content: none !important; }
          @page { margin: 18mm 15mm; size: A4; }
        }
      `}</style>

      {/* Site header */}
      <header className="flex items-center justify-between px-6 sm:px-8 h-14 border-b border-white/[0.07] bg-[#091521]/80 backdrop-blur-sm flex-shrink-0 print:hidden">
        <a href="https://www.maxifidigital.com" aria-label="Maxifi Digital">
          <Image src="/maxifi-logo-white.png" alt="Maxifi Digital" height={28} width={140} className="h-7 w-auto" />
        </a>
        <a href="https://www.maxifidigital.com" className="text-xs text-white/40 hover:text-white/70 transition-colors">← maxifidigital.com</a>
      </header>

      <div className="py-10 px-4">
      <div className="max-w-[640px] mx-auto">

        {/* 1. Header */}
        <div className="mb-8">
          <div className="flex items-center w-full mb-4 pb-4 border-b border-gray-100">
            <div className="flex-none">
              <Image src="/maxifi-logo-black.png" alt="Maxifi Digital" height={60} width={300} className="h-[60px] w-auto" />
            </div>
            <div className="flex-1 flex justify-start min-w-0 pl-[16px]">
              <p
                className="text-2xl whitespace-nowrap"
                style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, whiteSpace: 'nowrap', color: '#1a2744', letterSpacing: '0.05em' }}
              >
                AI Visibility Snapshot
              </p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
            AI Visibility Snapshot
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            {industry}{industry && snapshotDate ? ' · ' : ''}{snapshotDate ? `Generated ${snapshotDate}` : ''}
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
                    <td className="py-3 text-right text-sm font-bold text-[#C87A2F] whitespace-nowrap align-top">{row.weight}</td>
                  </tr>
                ))}
                <tr className="bg-[#FDF1E6]">
                  <td className="py-3 pr-3 text-sm font-bold text-[#7a4a10] whitespace-nowrap">Your AI Visibility Score</td>
                  <td className="py-3 pr-3 text-sm text-[#C87A2F]">Weighted total across all four signals</td>
                  <td className="py-3 pr-3 font-bold text-[#7a4a10] text-base whitespace-nowrap">
                    {score > 0 ? `${score}%` : 'Undiagnosed'}
                  </td>
                  <td className="py-3 text-right text-sm text-[#C87A2F] whitespace-nowrap">100%</td>
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
                <li className="flex items-start gap-2"><span className="mt-0.5 text-blue-400">▸</span><span>{competitors.length > 0 ? 'Your named competitors appear' : `Brands at the ${industry} benchmark appear`} in <strong className="text-white">{buyerY} or more</strong> of those same situations.</span></li>
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
              The indicative benchmark for {industry || 'your sector'} is <strong>{benchAvg}%</strong> — based on Maxifi Digital&rsquo;s analysis of citation patterns across industries.
              {inferBusinessModel(industry) === 'B2G'
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
              <tr className="border-b border-dashed border-gray-200">
                <td className="py-3 pr-4 text-xs text-gray-400 whitespace-nowrap">Competitor</td>
                <td className="py-3 pr-4 text-gray-400 italic">Not yet compared</td>
                <td className="py-3 text-right text-gray-400">—</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-3 pr-4 text-xs text-gray-400 whitespace-nowrap">Industry median</td>
                <td className="py-3 pr-4 text-gray-600">{industry || 'Your industry'}</td>
                <td className="py-3 text-right text-gray-600">{benchAvg}%</td>
              </tr>
              <tr className={`border-b border-gray-100 ${score < benchAvg ? 'bg-red-50/40' : 'bg-emerald-50/40'}`}>
                <td className="py-3 pr-4 text-xs font-semibold text-[#C87A2F] whitespace-nowrap">Your position</td>
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
        </div>

        {/* 4. Structured finding block */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">

          {/* Opportunity framing */}
          <div className={`p-6 border-b border-gray-100 ${opportunity.displaced ? 'bg-blue-50/50' : ''}`}>
            <p className="text-xs font-semibold text-[#C87A2F] uppercase tracking-wide mb-3">
              Where your biggest opportunity lies right now
            </p>
            <p className="text-base font-bold text-gray-900 leading-snug mb-3">{opportunity.headline}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{opportunity.body}</p>
          </div>

          {/* Citation status by platform */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Citation status by platform</p>
            <p className="text-base font-bold text-gray-900 leading-snug mb-3">{citationHeadline}</p>
            {awareness === "No, I haven't tried this yet" ? (
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
                    const s = PLATFORM_STATUS_STYLES[platform.status as PlatformStatus] ?? PLATFORM_STATUS_STYLES.unknown;
                    const displayLabel = platform.badge_label || s.label;
                    return (
                      <div key={platform.name} className="flex items-center justify-between px-3 py-2.5">
                        <span className="text-sm text-gray-700">{platform.name}</span>
                        <span className="flex items-center gap-2">
                          <a
                            href={platform.search_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-medium text-[#C87A2F] hover:underline whitespace-nowrap no-print-url print:hidden"
                          >
                            Search now →
                          </a>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${s.cls}`}>
                            {displayLabel}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                No platforms have been tested yet. Search for your brand in ChatGPT or Perplexity to gather evidence.
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
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FDF1E6] text-[#C87A2F] text-xs font-bold flex items-center justify-center mt-0.5">
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

        {/* 4b. Verify callout */}
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
          <p className="text-sm text-gray-500 mb-5">Three gaps that explain your current AI visibility position.</p>

          {/* Gap 1 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex-shrink-0 text-xs font-bold text-white bg-[#C87A2F] px-2 py-0.5 rounded">Gap 1</span>
              <h3 className="text-sm font-bold text-gray-900">How your content is structured</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{gap1Text}</p>
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 mb-3">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Business consequence:</strong>{' '}
                If AI can&rsquo;t extract a clear description of what {entityName} does, it won&rsquo;t recommend you — even when buyers are searching for exactly what you offer.
              </p>
            </div>
            <details className="group">
              <summary className="text-xs text-[#C87A2F] cursor-pointer list-none flex items-center gap-1 select-none hover:underline">
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
              <span className="flex-shrink-0 text-xs font-bold text-white bg-[#C87A2F] px-2 py-0.5 rounded">Gap 2</span>
              <h3 className="text-sm font-bold text-gray-900">How well-known your brand is to AI</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{gap2Text}</p>
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 mb-3">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Business consequence:</strong>{' '}
                Until AI engines can describe {entityName} accurately and with confidence, your reputation won&rsquo;t translate into AI-generated referrals — regardless of how strong your actual work is.
              </p>
            </div>
            <details className="group">
              <summary className="text-xs text-[#C87A2F] cursor-pointer list-none flex items-center gap-1 select-none hover:underline">
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
              <span className="flex-shrink-0 text-xs font-bold text-white bg-[#C87A2F] px-2 py-0.5 rounded">Gap 3</span>
              <h3 className="text-sm font-bold text-gray-900">Who else is talking about you online</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{gap3Text}</p>
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 mb-3">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Business consequence:</strong>{' '}
                Without references from sources AI engines recognise, your brand is treated as unverified — and unverified brands are not recommended.
              </p>
            </div>
            <details className="group">
              <summary className="text-xs text-[#C87A2F] cursor-pointer list-none flex items-center gap-1 select-none hover:underline">
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
              ? <> At {score}%, {entityName} is currently {gap} percentage points below the {industry} benchmark — a gap that is closable with targeted action, but widens if left unaddressed.</>
              : null
            }
          </p>
        </div>

        {/* 7. Sections 5-8 (gate / locked / generating / unlocked) */}
        {fullStatus === 'loading'           && (
          <div className="space-y-4 mb-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}
        {fullStatus === 'no_session'        && renderGateForm()}
        {fullStatus === 'payment_required'  && renderLockedSections()}
        {fullStatus === 'generating'        && renderGeneratingPlaceholder()}
        {fullStatus === 'loaded'            && renderUnlockedSections()}

        {/* 8. Three-option path forward */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">What would you like to do next?</h2>
          <p className="text-sm text-gray-500 mb-5">Three ways to move forward. No sales call required.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div className="bg-white rounded-xl border-2 border-[#C87A2F] p-5 flex flex-col relative">
              <span className="absolute -top-3 left-4 text-[10px] font-bold text-white bg-[#C87A2F] px-2 py-0.5 rounded-full tracking-wide uppercase">Most requested</span>
              <span className="inline-block self-start text-xs font-bold text-[#C87A2F] bg-[#FDF1E6] px-2 py-0.5 rounded mb-3 mt-1">A</span>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Get the full picture</h3>
              <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">
                AI Visibility Report — one report, no subscription.
                Covers every fix in order of impact, plus the exact sources AI is drawing on about you.
              </p>
              {fullStatus === 'payment_required' ? (
                <button
                  onClick={handleUnlock}
                  disabled={unlockLoading}
                  className="block text-center text-sm font-semibold text-white bg-[#C87A2F] hover:bg-[#A8651E] rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60"
                >
                  {unlockLoading ? 'Redirecting…' : 'Get the report →'}
                </button>
              ) : (
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-sm font-semibold text-white bg-[#C87A2F] hover:bg-[#A8651E] rounded-lg px-4 py-2.5 transition-colors"
                >
                  Get the report →
                </a>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
              <span className="inline-block self-start text-xs font-bold text-[#C87A2F] bg-[#FDF1E6] px-2 py-0.5 rounded mb-3">B</span>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Track your position every month</h3>
              <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">
                AI Visibility Engine — monthly tracking across all AI platforms.
                Alerts when competitors move. Quarterly strategy review included.
              </p>
              <a href={monitorUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#C87A2F] hover:underline">
                Start tracking →
              </a>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
              <span className="inline-block self-start text-xs font-bold text-[#C87A2F] bg-[#FDF1E6] px-2 py-0.5 rounded mb-3">C</span>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Have us fix it for you</h3>
              <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">
                Done for you — Maxifi implements every fix.
                We handle the content formatting, brand presence, and citation work.
                Monthly reporting included.
              </p>
              <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#C87A2F] hover:underline">
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
            defaultEmail=""
            firstName=""
            company={entityName}
          />
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
            <CopyLinkButton />
            <DownloadPdfButton />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center mb-3">
          <Image src="/maxifi-logo-black.png" alt="Maxifi Digital" height={20} width={100} className="h-5 w-auto opacity-30" />
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
    </div>
  );
}
