import type {
  VisibilityAssessmentSection,
  DiagnosisSection,
  PlatformPrioritySection,
  PositioningAssessmentSection,
} from '@/lib/reportTypes';

export interface TeaserSections {
  scoringNote: string;
  s1Visibility: VisibilityAssessmentSection;
  s2Diagnosis: DiagnosisSection;
  s3Platforms: PlatformPrioritySection;
  s4Positioning: PositioningAssessmentSection;
}

export function parseTeaserSections(raw: string): TeaserSections {
  // Strip markdown fences if Claude wraps in ```json
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Teaser response is not valid JSON. First 300 chars: ${cleaned.slice(0, 300)}`);
  }

  const missing: string[] = [];

  const requireString = (path: string, val: unknown) => {
    if (typeof val !== 'string' || !val.trim()) missing.push(path);
  };
  const requireArray = (path: string, val: unknown) => {
    if (!Array.isArray(val) || val.length === 0) missing.push(path);
  };
  const requireObject = (path: string, val: unknown) => {
    if (!val || typeof val !== 'object') missing.push(path);
  };

  requireString('scoringNote', parsed.scoringNote);
  requireObject('s1Visibility', parsed.s1Visibility);
  requireObject('s2Diagnosis', parsed.s2Diagnosis);
  requireObject('s3Platforms', parsed.s3Platforms);
  requireObject('s4Positioning', parsed.s4Positioning);

  const s1 = parsed.s1Visibility as Record<string, unknown> | undefined;
  if (s1) {
    requireString('s1Visibility.headline', s1.headline);
    requireString('s1Visibility.summary', s1.summary);
    requireArray('s1Visibility.platforms', s1.platforms);
    requireString('s1Visibility.assessmentCaveat', s1.assessmentCaveat);
  }

  const s2 = parsed.s2Diagnosis as Record<string, unknown> | undefined;
  if (s2) {
    requireString('s2Diagnosis.failureMode', s2.failureMode);
    requireString('s2Diagnosis.modeLabel', s2.modeLabel);
    requireString('s2Diagnosis.severity', s2.severity);
    requireString('s2Diagnosis.headline', s2.headline);
    requireString('s2Diagnosis.explanation', s2.explanation);
    requireArray('s2Diagnosis.rootCauses', s2.rootCauses);
    requireString('s2Diagnosis.likelyImpact', s2.likelyImpact);
  }

  const s3 = parsed.s3Platforms as Record<string, unknown> | undefined;
  if (s3) {
    requireString('s3Platforms.headline', s3.headline);
    requireString('s3Platforms.summary', s3.summary);
    requireArray('s3Platforms.platforms', s3.platforms);
    requireString('s3Platforms.priorityNote', s3.priorityNote);
  }

  const s4 = parsed.s4Positioning as Record<string, unknown> | undefined;
  if (s4) {
    requireString('s4Positioning.headline', s4.headline);
    requireString('s4Positioning.sectorContext', s4.sectorContext);
    requireString('s4Positioning.alignmentLevel', s4.alignmentLevel);
    requireString('s4Positioning.alignmentLabel', s4.alignmentLabel);
    requireArray('s4Positioning.observations', s4.observations);
    requireArray('s4Positioning.opportunities', s4.opportunities);
    requireString('s4Positioning.assessmentCaveat', s4.assessmentCaveat);
  }

  if (missing.length > 0) {
    throw new Error(`Teaser JSON is missing required fields: ${missing.join(', ')}`);
  }

  return parsed as unknown as TeaserSections;
}
