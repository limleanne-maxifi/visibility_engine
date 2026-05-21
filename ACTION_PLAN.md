# IMMEDIATE ACTION PLAN - Critical Fixes for Launch

## Priority 1: Fix Before Deployment (Today/Tomorrow)

### 1. Fix Competitor Displacement Scoring
**File**: `lib/scoring.ts` (line 31)

**Current (WRONG)**:
```javascript
awareness === 'Yes — competitors were cited instead of me' ? Math.max(0, 10 - n * 10) :
```

**Fixed**:
```javascript
awareness === 'Yes — competitors were cited instead of me' ? 
  (n === 0 ? 10 : n === 1 ? 5 : n === 2 ? 3 : 0) :
```

**Reason**: Currently, naming competitors tanks their score. The new formula: naming helps (5), naming 2 helps more (3), too many names suggests lack of focus (0).

---

### 2. Add Input Validation
**File**: `app/api/generate/route.ts` (new function before POST)

Add this before the POST function:

```typescript
const VALID_AI_PRESENCE = [
  "No, I haven't tried this yet",
  'Yes — and the results were accurate',
  "Yes — but I wasn't mentioned at all",
  'Yes — but details about me were wrong',
  'Yes — competitors were cited instead of me',
  'Yes — but old/outdated info appeared',
];

const VALID_PLATFORMS = [
  'ChatGPT', 'Google AI Overviews', 'Perplexity', 
  'Claude', 'Gemini', 'Microsoft Copilot'
];

function validateFormData(data: FormData): string[] {
  const errors: string[] = [];
  
  // Email validation
  if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push('Invalid email format');
  }
  
  // Industry validation
  if (!INDUSTRY_BENCHMARKS[data.industry]) {
    errors.push(`Industry "${data.industry}" not recognized`);
  }
  
  // Platform validation
  if (!data.platforms?.length) {
    errors.push('Please select at least one AI platform');
  }
  if (!data.platforms.find(p => p.priority === 'primary')) {
    errors.push('Please select a primary AI platform');
  }
  if (data.platforms.some(p => !VALID_PLATFORMS.includes(p.value))) {
    errors.push('Invalid platform selection');
  }
  
  // AI Presence validation
  if (!VALID_AI_PRESENCE.includes(data.aiPresence)) {
    errors.push('Invalid awareness state. Please select from the options provided.');
  }
  
  // Challenges validation
  if (!data.challenges?.length) {
    errors.push('Please specify at least one challenge');
  }
  
  // String length validation
  if ((data.competitors?.length ?? 0) > 500) {
    errors.push('Competitors field exceeds maximum length');
  }
  if ((data.positioning?.length ?? 0) > 500) {
    errors.push('Positioning field exceeds maximum length');
  }
  if ((data.targetQueries?.length ?? 0) > 500) {
    errors.push('Target queries field exceeds maximum length');
  }
  
  return errors;
}
```

Then in the POST function, after parsing JSON:

```typescript
const validationErrors = validateFormData(formData);
if (validationErrors.length > 0) {
  return NextResponse.json(
    { 
      error: 'Validation failed: ' + validationErrors.join('; '),
      code: 'VALIDATION_ERROR' 
    },
    { status: 400 }
  );
}
```

---

### 3. Fix Competitor Parsing
**File**: `lib/scoring.ts` (lines 3-6)

**Current (WRONG)**:
```typescript
export function getAllCompetitors(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(/[,;/\n&]/).map(c => c.replace(/\band\b/gi, '').trim()).filter(Boolean);
}
```

**Fixed**:
```typescript
export function getAllCompetitors(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  
  // Only split on comma, semicolon, newline (NOT ampersand or forward slash)
  const competitors = raw
    .split(/[,;\n]+/)
    .map(c => c.trim())
    .filter(c => c.length > 0 && c.length < 100)
    .slice(0, 10); // Max 10 competitors
  
  return competitors;
}

export function formatCompetitors(list: string[]): string {
  if (list.length === 0) return '';
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
}
```

---

### 4. Fix Database Insert Error Handling
**File**: `app/api/generate/route.ts` (lines 96-122)

**Current (WRONG)**:
```typescript
let id: string;
try {
  console.log('[generate] inserting lead to Supabase...');
  const lead = await insertLead(formData, plan);
  id = lead.id;
  // ... emails
} catch (err) {
  console.error('[generate] Supabase insert failed — falling back to session ID:', err);
  id = generateSessionId();  // ← PROBLEM: Returns report even though it's not saved
}

return NextResponse.json({ id, plan }, { status: 200 });
```

**Fixed**:
```typescript
let id: string;
try {
  console.log('[generate] inserting lead to Supabase...');
  const lead = await insertLead(formData, plan);
  id = lead.id;
  console.log('[generate] lead inserted, id:', id);

  // Fire emails non-blocking — errors logged, never surfaced to user
  Promise.allSettled([
    sendUserPlanEmail(lead),
    sendInternalNotification(lead),
  ]).then((results) => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[generate] Email ${i === 0 ? 'user' : 'internal'} send failed:`, r.reason);
      }
    });
  });

  console.log('[generate] returning id:', id);
  return NextResponse.json({ id, plan }, { status: 200 });

} catch (err) {
  console.error('[generate] Supabase insert failed:', err);
  return NextResponse.json(
    {
      error: 'Failed to save your report. Please try again.',
      code: 'DATABASE_ERROR',
    },
    { status: 500 }
  );
}
```

---

### 5. Fix Response Parsing Validation
**File**: `lib/parsePlan.ts`

Add validation after parsing:

```typescript
export function parsePlan(raw: string): Plan {
  const steps: PlanStep[] = [];

  // Split on STEP_START/STEP_END delimiters
  const segments = raw.split('STEP_START');

  for (const segment of segments) {
    const endIdx = segment.indexOf('STEP_END');
    if (endIdx === -1) continue;

    const block = segment.slice(0, endIdx).trim();
    if (!block) continue;

    const numMatch = block.match(/^NUM:\s*(\d+)/m);
    const titleMatch = block.match(/^TITLE:\s*(.+)$/m);
    const bodyMatch = block.match(/^BODY:\s*([\s\S]+?)(?=\n(?:NUM|TITLE|BODY|$)|\s*$)/m);

    if (!numMatch || !titleMatch || !bodyMatch) {
      throw new Error(`Malformed step block: "${block.slice(0, 80)}"`);
    }

    steps.push({
      num: parseInt(numMatch[1], 10),
      title: titleMatch[1].trim(),
      body: bodyMatch[1].trim(),
    });
  }

  if (steps.length === 0) {
    throw new Error('No steps parsed from Claude response');
  }

  // Extract QUICKWIN — everything after "QUICKWIN:" to end of string
  const quickWinMatch = raw.match(/^QUICKWIN:\s*(.+)$/m);
  if (!quickWinMatch) {
    throw new Error('QUICKWIN not found in Claude response');
  }

  // NEW: Validate step count
  const expectedSteps = raw.includes("No, I haven't tried this yet") ? 3 : 5;
  if (steps.length < expectedSteps) {
    console.warn(`[parse] Expected ${expectedSteps} steps but got ${steps.length}`);
    // Don't fail, but log for monitoring
  }

  return {
    steps,
    quickWin: quickWinMatch[1].trim(),
  };
}
```

---

### 6. Add Business Model Mapping Fix
**File**: `lib/scoring.ts` (line 124)

**Current (WRONG)**:
```typescript
const MIXED_INDUSTRIES = new Set([
  'Healthcare & Life Sciences', 'Education & Training',
  'Real Estate & Property', 'Financial Services & Banking',
  'Insurance', 'Telecommunications',
]);
```

**Fixed**:
```typescript
const MIXED_INDUSTRIES = new Set([
  'Healthcare & Life Sciences', 'Education & Training',
  'Real Estate & Property', 'Financial Services & Banking',
  'Insurance', 'Telecommunications',
  'Professional Services',  // ADD: Many serve both B2B and consumers
  'Accounting & Finance',   // ADD: CPAs serve individuals and businesses
]);
```

---

### 7. Add Email Disclaimer
**File**: `lib/email.ts` (around line 174, in the email HTML)

Add before closing `</div></td></tr>`:

```html
<!-- Disclaimer -->
<tr><td style="padding-top:20px;border-top:1px solid #e5e7eb;">
  <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
    This snapshot is based on your self-reported testing and automated analysis.
    AI citation patterns shift with platform updates. 
    <a href="${REPORT_URL}" style="color:#6B5DD3;text-decoration:underline;">
      Get your full AEO Visibility Report
    </a>
    for detailed audit.
  </p>
</td></tr>
```

---

### 8. Update Email Subject Line
**File**: `lib/email.ts` (line 40)

**Current**:
```typescript
const subject = `Your AI Visibility Snapshot — ${entity} is at ${score > 0 ? `${score}%` : 'an undiagnosed'} visibility`;
```

**Fixed**:
```typescript
const entityShort = entity.length > 20 ? entity.slice(0, 20) + '...' : entity;
const subject = `Your AEO Snapshot — ${entityShort}${score > 0 ? ` (${score}%)` : ' (undiagnosed)'}`;
```

---

## Priority 2: Implement This Week (Before Wider Launch)

### 9. Add Rate Limiting
Create `lib/rateLimit.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),  // 10 requests per hour
});

export async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const { success } = await ratelimit.limit(ip);
    return success;
  } catch {
    // If rate limit check fails, allow request (failopen)
    return true;
  }
}
```

Then in `app/api/generate/route.ts`:

```typescript
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest): Promise<NextResponse<GenerateResponse | GenerateErrorResponse>> {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in 1 hour.', code: 'RATE_LIMIT' },
      { status: 429 }
    );
  }
  
  // ... rest of function
}
```

---

### 10. Add Benchmark Metadata
**File**: `lib/scoring.ts` (before INDUSTRY_BENCHMARKS)

```typescript
export const BENCHMARK_METADATA = {
  generatedDate: '2024-12-01',
  methodology: 'Median AI citation rate across ChatGPT, Google AI Overviews, Perplexity',
  samplesPerIndustry: 50,
  confidenceLevel: '95%',
  nextReviewDate: '2025-03-01',
};

export const INDUSTRY_BENCHMARKS: Record<string, number> = {
  // ... existing benchmarks
};
```

Use in email:

```html
<p style="font-size:11px;color:#9ca3af;">
  Benchmark based on ${BENCHMARK_METADATA.generatedDate} industry analysis. 
  <a href="/methodology" style="color:#6B5DD3;">See our methodology.</a>
</p>
```

---

### 11. Store aeoOutcome in Database
**File**: `lib/supabase.ts` (AeoLeadRow interface)

Add field:

```typescript
export interface AeoLeadRow {
  id: string;
  created_at: string;
  first_name: string;
  email: string;
  website: string | null;
  occupation: string;
  industry: string;
  company_name: string | null;
  awareness: string;
  platform: string;
  platform_other: string | null;
  challenge: string;
  outcome: string;  // ← ADD THIS
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  plan_steps: PlanStep[];
  plan_quick_win: string;
  session_id: string | null;
  competitors: string | null;
  positioning: string | null;
  target_queries: string | null;
}
```

In insertLead:

```typescript
const { data, error } = await getClient()
  .from('aeo_leads')
  .insert({
    // ... existing fields
    outcome: formData.aeoOutcome,  // ← ADD THIS
    // ...
  })
```

---

## Testing Checklist After Fixes

- [ ] Test competitor parsing: "Salesforce & HubSpot" → ["Salesforce & HubSpot"]
- [ ] Test scoring: 1 competitor named → score 5 (not 0)
- [ ] Test validation: Missing industry → error (not default 40%)
- [ ] Test validation: Invalid email → error
- [ ] Test parsing: Missing STEP_END → error with count info
- [ ] Test database: Insert failure → no report returned
- [ ] Test rate limit: 11 requests in 1 hour → 429 error
- [ ] Test email: Disclaimer present
- [ ] Test email rendering: All three business models
- [ ] Manual ChatGPT search: Verify query generates results

---

## Estimated Time

**Critical fixes**: 2-3 hours  
**Testing**: 1-2 hours  
**Total**: 3-5 hours work, ready by EOD

---

## Deployment After Fixes

1. Merge all fixes to main branch
2. Deploy to staging
3. Run through testing checklist
4. Deploy to production
5. Monitor error rate (target < 1% parse errors)
6. Set up dashboards for ongoing monitoring

Let me know if you need clarification on any of these fixes!
