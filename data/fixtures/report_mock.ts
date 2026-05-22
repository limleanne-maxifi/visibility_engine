import type { ReportData } from '@/lib/reportTypes';

// ─── Shared sections (same for both free and paid fixture) ────────────────────

const SHARED_SECTIONS: Omit<ReportData, 'meta' | 's5Competitors' | 's6PositioningGap' | 's7QueryGap' | 's8ActionQueue'> = {
  score: {
    score: 31,
    band: 'Low',
    benchmarkAvg: 76,
    benchmarkLabel: 'B2B SaaS / Enterprise Software average',
    scoringNote:
      'Score estimated from your self-reported testing across the four visibility signals. A full measured assessment may differ.',
  },

  s1Visibility: {
    headline: 'Current Visibility Assessment',
    summary:
      'Based on your self-reported testing in ChatGPT and Perplexity, our analysis suggests Orbis Analytics is not being surfaced when buyers ask AI tools for analytics recommendations. The platforms you tested account for the majority of business buyer AI queries in your sector.',
    platforms: [
      {
        platform: 'ChatGPT',
        status: 'likely-absent',
        note: 'You tested this platform — our analysis suggests you are not currently cited.',
      },
      {
        platform: 'Perplexity',
        status: 'likely-absent',
        note: 'You tested this platform — our analysis suggests you are not currently cited.',
      },
      {
        platform: 'Google AI Overviews',
        status: 'not-tested',
        note: 'Not yet checked. High buyer use for B2B SaaS discovery — worth testing.',
      },
      {
        platform: 'Microsoft Copilot',
        status: 'not-tested',
        note: 'Not yet checked. Growing adoption in enterprise software evaluation.',
      },
      {
        platform: 'Claude',
        status: 'not-tested',
        note: 'Not yet checked. Used by technical buyers and product evaluators.',
      },
      {
        platform: 'Gemini',
        status: 'not-tested',
        note: 'Not yet checked. Lower priority for B2B SaaS but worth a baseline check.',
      },
    ],
    assessmentCaveat:
      'Statuses above are based on your self-reported testing and are assessments, not live measurements. The full report includes engine-verified citation tests across all platforms.',
  },

  s2Diagnosis: {
    failureMode: 'not-cited',
    modeLabel: 'Not being cited',
    severity: 'high',
    headline: 'Likely failure mode: absent from AI results entirely',
    explanation:
      'Based on your reported experience, our analysis suggests Orbis Analytics is not appearing in AI responses to relevant buyer queries. This is not the same as being unknown — it likely means the content structure and citation signals AI engines rely on are not yet in place.',
    rootCauses: [
      'Content on orbisanalytics.io likely does not directly answer the specific questions buyers ask AI tools — such as "best analytics platform for finance teams" or "mid-market BI tool comparison."',
      'AI engines cross-reference brands against external sources before citing them. Third-party coverage of Orbis Analytics in analyst reviews, industry publications, and directory listings appears to be limited.',
      'The entity description across your web properties may not be consistent enough for AI engines to form a reliable, confident picture of what Orbis Analytics does and who it serves.',
    ],
    likelyImpact:
      'When a finance team or IT buyer asks an AI tool for analytics platform recommendations in your category, Orbis Analytics is likely not in the response — regardless of how strong your actual product is.',
  },

  s3Platforms: {
    headline: 'Platform Priority Overview',
    summary:
      'Our analysis suggests where to focus first based on your industry, buyer model, and what AI platforms your buyers are most likely using. These are qualitative priorities — platform-by-platform citation measurements are in the full report.',
    platforms: [
      {
        platform: 'ChatGPT',
        priority: 'primary',
        rationale:
          'The dominant AI tool for B2B software evaluation. Finance and operations buyers use it heavily for vendor comparisons, feature lists, and category research.',
        buyerPresence: 'high',
      },
      {
        platform: 'Perplexity',
        priority: 'primary',
        rationale:
          'Widely used by technical buyers and product evaluators in B2B SaaS. Often used for structured comparisons and detailed vendor research.',
        buyerPresence: 'high',
      },
      {
        platform: 'Google AI Overviews',
        priority: 'secondary',
        rationale:
          'Appears in search results for category queries. Important for buyers starting a vendor search via Google before going deeper.',
        buyerPresence: 'medium',
      },
      {
        platform: 'Microsoft Copilot',
        priority: 'secondary',
        rationale:
          'Growing use in enterprise procurement workflows. Relevant for larger deals where buyers work within Microsoft 365.',
        buyerPresence: 'medium',
      },
      {
        platform: 'Claude',
        priority: 'monitor',
        rationale:
          'Used by technical evaluators and engineering-led buyers. Worth monitoring as adoption in B2B evaluation grows.',
        buyerPresence: 'low',
      },
      {
        platform: 'Gemini',
        priority: 'monitor',
        rationale:
          'Lower penetration in B2B SaaS buyer research today. Worth a baseline check but not a primary focus.',
        buyerPresence: 'low',
      },
    ],
    priorityNote:
      'Platform priority is based on reported buyer behaviour patterns in B2B SaaS, not live citation measurements. Your full report includes verified citation rates per platform.',
  },

  s4Positioning: {
    headline: 'Positioning vs. Sector Assessment',
    entityPositioning: 'Real-time analytics for mid-market finance teams',
    sectorContext:
      'In B2B SaaS, AI engines most reliably cite vendors who own a specific, narrow category claim and have external validation of that claim across reviews, analyst reports, and press coverage.',
    alignmentLevel: 'partial',
    alignmentLabel: 'Partial alignment — too broad to own a clear AI citation category',
    observations: [
      '"Real-time analytics" is a crowded category term used by dozens of vendors. AI engines struggle to differentiate between them without additional signals.',
      'The "mid-market finance teams" qualifier is useful but may not appear consistently across your web properties, making it harder for AI engines to associate Orbis Analytics with this specific buyer segment.',
      'Competitors in your category — particularly those with strong G2 and Capterra profiles — have clearer category ownership in AI citations.',
    ],
    opportunities: [
      'Owning a more specific claim such as "real-time cash-flow analytics for Series A–C finance teams" would narrow the competition set AI engines need to choose from.',
      'Structured FAQ content answering "what analytics tool do mid-market CFOs use" and related queries would directly address the format AI engines prefer for citations.',
      'Consistent use of your positioning statement across your site, G2 profile, press releases, and LinkedIn Company page would strengthen the cross-source signal.',
    ],
    assessmentCaveat:
      'This assessment is based on your stated positioning and general patterns in your sector — not a measured audit of how AI engines currently describe Orbis Analytics. Your full report includes that audit.',
  },

  reportPrice: '$249',
  unlockUrl: '#unlock',
  calendlyUrl: '#book-walkthrough',
};

// ─── Paid sections ────────────────────────────────────────────────────────────

const PAID_SECTIONS: Pick<ReportData, 's5Competitors' | 's6PositioningGap' | 's7QueryGap' | 's8ActionQueue'> = {
  s5Competitors: {
    headline: 'Competitor Displacement Analysis',
    summary:
      'Engine testing across 12 queries on ChatGPT and Perplexity found three vendors consistently cited in categories where Orbis Analytics could reasonably appear. Each has a specific structural advantage.',
    competitors: [
      {
        name: 'Tableau',
        platforms: ['ChatGPT', 'Perplexity', 'Google AI Overviews'],
        advantage:
          'Extensive third-party coverage across analyst reports, G2, and Gartner Magic Quadrant. AI engines have high-confidence citations from multiple independent sources.',
        yourGap:
          'Orbis Analytics lacks the volume of cross-platform citations that would let AI engines confidently select it alongside or instead of Tableau.',
      },
      {
        name: 'Power BI',
        platforms: ['ChatGPT', 'Perplexity', 'Microsoft Copilot'],
        advantage:
          'Microsoft ecosystem integration creates a natural citation path in Copilot and ChatGPT. Category queries about "analytics for finance teams" frequently return Microsoft-stack recommendations.',
        yourGap:
          'No clear differentiation from Power BI in the mid-market finance segment is visible in your public content. AI engines default to the more familiar brand.',
      },
      {
        name: 'Looker',
        platforms: ['ChatGPT', 'Perplexity'],
        advantage:
          'Google ownership gives Looker strong authority signals. Frequently cited in "BI tools for mid-market" queries due to G2 category leadership and PR volume.',
        yourGap:
          'Orbis Analytics needs a stronger SEO and review profile specifically in the "mid-market" segment to appear alongside Looker in structured comparisons.',
      },
    ],
    displacementPattern:
      'In 9 of 12 tested queries, at least one of Tableau, Power BI, or Looker appeared in the AI response. Orbis Analytics appeared in 0 of 12. The displacement is consistent across platforms and query types.',
    queriesAnalyzed: 12,
  },

  s6PositioningGap: {
    headline: 'Positioning Gap Report',
    currentPerception:
      'AI engines currently have insufficient data to confidently describe Orbis Analytics. When prompted directly, ChatGPT produces a generic description ("a business analytics platform") that does not reflect the mid-market finance specialisation.',
    targetPerception:
      'AI engines should cite Orbis Analytics as the specialist real-time analytics platform for mid-market finance and operations teams, distinguishing it from enterprise BI tools through its speed-to-insight and finance-specific workflows.',
    gapScore: 74,
    gaps: [
      {
        gap: 'Category ownership: no consistent claim to "finance-specific analytics" across external sources',
        severity: 'high',
        fixApproach:
          'Update G2, Capterra, Crunchbase, and LinkedIn Company page to consistently use "finance analytics" and "mid-market" in the category and description fields.',
      },
      {
        gap: 'Proof points: no third-party validation of the "real-time" claim in a finance context',
        severity: 'high',
        fixApproach:
          'Publish at least two case studies framed around time-to-insight (e.g. "reduced close cycle from 3 days to 4 hours") and submit them as structured data on your site.',
      },
      {
        gap: 'Buyer language: website copy uses vendor-centric language rather than buyer-query language',
        severity: 'medium',
        fixApproach:
          'Add an FAQ section to the home page that directly answers "what analytics tool do mid-market CFOs use" and similar queries. Write answers that cite Orbis by name.',
      },
    ],
    urgencyNote:
      'Competitors with strong positioning in your category are actively building citations. Each quarter of inaction increases the effort required to displace them.',
  },

  s7QueryGap: {
    headline: 'Target Query Coverage',
    summary:
      'Engine testing on ChatGPT shows Orbis Analytics is not returning in any of the five target query categories identified from your stated positioning. Competitors appear in four of the five.',
    queries: [
      {
        query: 'best analytics platform for mid-market finance teams',
        status: 'competitor-cited',
        competitorCited: 'Tableau, Power BI',
        priority: 'high',
      },
      {
        query: 'real-time cash flow analytics for CFOs',
        status: 'not-appearing',
        priority: 'high',
      },
      {
        query: 'BI tool for Series B finance operations',
        status: 'competitor-cited',
        competitorCited: 'Looker, Power BI',
        priority: 'high',
      },
      {
        query: 'analytics software mid-market B2B comparison',
        status: 'competitor-cited',
        competitorCited: 'Tableau',
        priority: 'medium',
      },
      {
        query: 'Orbis Analytics review',
        status: 'inaccurate',
        priority: 'medium',
      },
    ],
    primaryPlatform: 'ChatGPT',
    queriesAnalyzed: 5,
    queriesWon: 0,
  },

  s8ActionQueue: {
    headline: '60-Day Action Queue',
    quickWin:
      'Open your G2 profile today and update the "About" field to include the exact phrase "real-time analytics for mid-market finance teams." This takes under 20 minutes and directly improves the external citation signal AI engines read.',
    actions: [
      {
        week: 1,
        title: 'Standardise your entity description across all platforms',
        description:
          'Update G2, Capterra, Crunchbase, LinkedIn Company, and your About page to use the same core positioning statement — "real-time analytics for mid-market finance and operations teams." Consistency across sources is a primary AI citation signal.',
        effort: 'low',
        impact: 'high',
        category: 'authority',
      },
      {
        week: 1,
        title: 'Add an AEO-structured FAQ to your home page',
        description:
          'Write 5–7 questions that mirror how buyers ask AI tools about your category. Format them as proper FAQ schema (JSON-LD). Include direct mentions of Orbis Analytics by name in each answer. Publish at /faq or embed in the home page.',
        effort: 'medium',
        impact: 'high',
        category: 'content',
      },
      {
        week: 2,
        title: 'Publish two finance-specific case studies',
        description:
          'Write case studies focused on measurable finance outcomes — close cycle reduction, reporting time saved. Structure them with a Problem / Solution / Result format and include schema markup. These become third-party-citable proof points.',
        effort: 'high',
        impact: 'high',
        category: 'content',
      },
      {
        week: 2,
        title: 'Add Organisation schema to your website',
        description:
          'Implement JSON-LD Organisation schema on your home page including name, url, description, sameAs links to G2, LinkedIn, and Crunchbase. This directly tells AI engines how to describe Orbis Analytics.',
        effort: 'low',
        impact: 'medium',
        category: 'technical',
      },
      {
        week: 3,
        title: 'Solicit 10 new verified G2 reviews with finance-specific framing',
        description:
          'Reach out to current customers in finance roles and ask for reviews that mention specific use cases (cash flow, close cycle, FP&A reporting). Reviews with category-specific language increase G2\'s AI citation authority for your target queries.',
        effort: 'medium',
        impact: 'high',
        category: 'authority',
      },
      {
        week: 4,
        title: 'Pitch two B2B SaaS industry publications for coverage',
        description:
          'Target publications that appear frequently in AI-cited sources for your category (e.g. SaaStr, CFO Dive, G2 Learn Hub). A single cited article in one of these can materially improve your AI authority score for finance-specific queries.',
        effort: 'high',
        impact: 'medium',
        category: 'authority',
      },
      {
        week: 5,
        title: 'Create a "vs. competitor" comparison page',
        description:
          'Publish a structured comparison page for each primary competitor (Tableau, Power BI, Looker). Use clear headings, an HTML comparison table, and Product schema. These pages directly intercept AI queries comparing vendors.',
        effort: 'medium',
        impact: 'high',
        category: 'competitive',
      },
      {
        week: 6,
        title: 'Test and document your citation progress',
        description:
          'Re-run the five target queries on ChatGPT and Perplexity. Record responses and compare to baseline. Document any new citations or changes in competitor positions. This measurement loop tells you which of weeks 1–5 had the most impact.',
        effort: 'low',
        impact: 'medium',
        category: 'technical',
      },
    ],
    expectedOutcome:
      'Following this queue consistently should improve citation rate on your two primary platforms (ChatGPT, Perplexity) within 8–12 weeks. The G2, FAQ, and schema changes are the fastest-acting; the publication and review work compounds over time.',
  },
};

// ─── Exported fixtures ────────────────────────────────────────────────────────

export const mockReportFree: ReportData = {
  meta: {
    token: 'preview-free',
    generatedAt: '2026-05-22T06:00:00.000Z',
    entityName: 'Orbis Analytics',
    industry: 'B2B SaaS / Enterprise Software',
    occupation: 'Head of Marketing',
    website: 'orbisanalytics.io',
    paid: false,
  },
  ...SHARED_SECTIONS,
  s5Competitors: null,
  s6PositioningGap: null,
  s7QueryGap: null,
  s8ActionQueue: null,
};

export const mockReportPaid: ReportData = {
  meta: {
    token: 'preview-paid',
    generatedAt: '2026-05-22T06:00:00.000Z',
    entityName: 'Orbis Analytics',
    industry: 'B2B SaaS / Enterprise Software',
    occupation: 'Head of Marketing',
    website: 'orbisanalytics.io',
    paid: true,
  },
  ...SHARED_SECTIONS,
  ...PAID_SECTIONS,
};
