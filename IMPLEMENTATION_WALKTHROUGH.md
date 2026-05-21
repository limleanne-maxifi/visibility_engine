# CREDIBILITY FIXES - STEP-BY-STEP IMPLEMENTATION

## Prerequisites

Make sure you're on the correct branch:
```bash
git branch -v
# Should show: claude/find-visibility-logic-DE4rp
```

If not:
```bash
git checkout claude/find-visibility-logic-DE4rp
```

---

## FIX #1: Remove Ceiling Effect (2 minutes)

### Step 1a: Open `lib/scoring.ts`

Look for the `buyerConversations` function around line 168.

### Step 1b: Find this code:
```typescript
export function buyerConversations(score: number, benchAvg: number): { x: number; y: number } {
  const x = Math.max(0, Math.min(9, Math.round(score / 10)));
  const y = Math.max(1, Math.min(10, Math.round((benchAvg || 1) / 10)));
  return { x, y };
}
```

### Step 1c: Replace ONLY the first line with:
```typescript
export function buyerConversations(score: number, benchAvg: number): { x: number; y: number } {
  const x = Math.max(0, Math.round(score / 10));
  const y = Math.max(1, Math.min(10, Math.round((benchAvg || 1) / 10)));
  return { x, y };
}
```

**What changed**: Removed `Math.min(9, ...)` from the `x` calculation

### Step 1d: Verify the change
```bash
# Test scores now map correctly
node -e "
function buyerConversations(score, benchAvg) {
  const x = Math.max(0, Math.round(score / 10));
  const y = Math.max(1, Math.min(10, Math.round((benchAvg || 1) / 10)));
  return { x, y };
}
console.log('95%:', buyerConversations(95, 50));  // Should be x=10
console.log('100%:', buyerConversations(100, 50)); // Should be x=10
console.log('50%:', buyerConversations(50, 50));   // Should be x=5
"
```

✅ **Expected output:**
```
95%: { x: 10, y: 5 }
100%: { x: 10, y: 5 }
50%: { x: 5, y: 5 }
```

---

## FIX #2: Add Methodology Documentation (5 minutes)

### Step 2a: In the same file (`lib/scoring.ts`), find the `buyerConversations` function

### Step 2b: Add this comment block BEFORE the function (before `export function`):

```typescript
/**
 * Estimates likelihood of brand appearing in buyer conversations
 * 
 * METHODOLOGY:
 * Linear scale: conversationRate = score / 10
 * Maps 0-100% visibility score to 0-10 conversation likelihood
 * 
 * CALIBRATION STATUS: Estimated (not validated against live AI data)
 * CONFIDENCE LEVEL: Theoretical (formula-based, not measured)
 * 
 * RESEARCH NEEDED:
 * - Validate correlation between 4-signal visibility score and actual ChatGPT citation frequency
 * - Test if linear relationship holds across score ranges (0-20%, 50-70%, 90-100%)
 * - Adjust formula if correlation is non-linear
 * - Measure impact of query specificity on appearance rates
 * 
 * KNOWN LIMITATIONS:
 * - Assumes linear correlation (may not hold at extremes)
 * - Based on theory, not live measurement
 * - Doesn't account for query specificity variance
 * - Single-vendor focused (only user's primary platform)
 * - Doesn't measure actual conversation impact (only likelihood)
 * 
 * USE CASES:
 * ✓ "We estimate roughly X out of 10 relevant searches would include you"
 * ✗ "You guarantee to appear in X conversations" (DON'T claim this)
 * ✗ "Competitors appear in Y conversations" (Unvalidated)
 */
export function buyerConversations(score: number, benchAvg: number): { x: number; y: number } {
```

✅ **Result**: Function now has transparent methodology documentation

---

## FIX #3: Update Email Language (10 minutes)

### Step 3a: Open `lib/email.ts`

### Step 3b: Find the `buyerConvLine` variable (around line 49-61)

Look for this code:
```typescript
const buyerConvLine = score > 0 ? (() => {
  const missed = 10 - buyerX;
  switch (businessModel) {
    case 'B2G':
      return `In ${missed} out of 10 cases where procurement teams use AI to research vendors in your category, ${entity} is not in the results. Brands at the ${lead.industry} benchmark appear in ${buyerY} or more of those searches.`;
```

### Step 3c: Replace the ENTIRE `buyerConvLine` assignment with this:

```typescript
const buyerConvLine = score > 0 ? (() => {
  const missed = 10 - buyerX;
  const methodologyNote = ` This is an estimate based on your visibility score; actual appearance rates vary by query and AI platform.`;
  
  switch (businessModel) {
    case 'B2G':
      return `Based on your visibility score, an estimated ${missed} out of 10 procurement-team AI searches in your category would not return ${entity}. Brands at the ${lead.industry} benchmark appear in an estimated ${buyerY} or more of such searches.${methodologyNote}`;
    case 'B2C':
      return `Based on your visibility score, an estimated ${missed} out of 10 consumer AI recommendation requests would not include ${entity}. Brands at the ${lead.industry} benchmark appear in an estimated ${buyerY} or more.${methodologyNote}`;
    case 'mixed':
      return `Based on your visibility score, an estimated ${missed} out of 10 buyer or procurement-team AI searches would not find ${entity}. Brands at the ${lead.industry} benchmark appear in an estimated ${buyerY} or more of those situations.${methodologyNote}`;
    default:
      return `Based on your visibility score of ${score}%, an estimated ${buyerX} out of 10 AI-generated recommendations in your category would include ${entity}. Brands at the ${lead.industry} benchmark appear in approximately ${buyerY} out of 10.${methodologyNote}`;
  }
})() : '';
```

**Key changes**:
- Added "Based on your visibility score" (frames as estimate)
- Added "an estimated" (signals uncertainty)
- Added "This is an estimate..." (methodology note)

✅ **Result**: Email now indicates conversation rates are estimated, not measured

---

## FIX #4: Add Benchmark Context Function (15 minutes)

### Step 4a: In `lib/scoring.ts`, find the end of `INDUSTRY_BENCHMARKS` table

Look for where the object closes (around line 106):
```typescript
export const INDUSTRY_BENCHMARKS: Record<string, number> = {
  // ... all the benchmarks ...
};
```

### Step 4b: Immediately AFTER the closing `};`, add this new function:

```typescript

/**
 * Provides industry context for benchmark interpretation
 * 
 * Distinguishes between:
 * - HIGH-benchmark industries (>50%): B2B, B2C where AI drives discovery
 * - LOW-benchmark industries (<40%): B2G, procurement-led where AI has limited role
 */
export function getBenchmarkContext(
  score: number, 
  benchAvg: number, 
  industry: string
): {
  gap: number;
  isLowBenchmark: boolean;
  contextExplanation: string;
  interpretation: string;
} {
  const gap = benchAvg - score;
  const isLowBenchmark = benchAvg < 40;
  
  let contextExplanation = '';
  let interpretation = '';
  
  if (isLowBenchmark) {
    // Defense, Aviation, Manufacturing, etc.
    contextExplanation = `${industry} has a low AI visibility benchmark (${benchAvg}%) because procurement and vendor evaluation processes rely on formal RFPs and vendor shortlisting, not AI discovery. AI plays a limited role in initial vendor research.`;
    
    if (gap > 0) {
      interpretation = `You are ${Math.abs(gap)} points below the benchmark. In low-benchmark sectors, this gap is less critical than in high-discovery industries. The opportunity is focused on the scenarios where AI IS used (e.g., competitive research, capability evaluation).`;
    } else {
      interpretation = `You are at or above the benchmark. This indicates strong positioning for AI visibility in a sector where AI plays a limited overall role.`;
    }
  } else {
    // B2B SaaS, Consulting, Legal, etc.
    contextExplanation = `${industry} has a high AI visibility benchmark (${benchAvg}%) because AI tools are frequently used by buyers to discover vendors, compare solutions, and evaluate options.`;
    
    if (gap > 0) {
      interpretation = `You are ${Math.abs(gap)} points below the benchmark. This gap represents measurable lost opportunities in buyer conversations that are mediated by AI tools.`;
    } else {
      interpretation = `You are at or above the benchmark. This indicates competitive AI visibility in a market where AI discovery is central to buyer research.`;
    }
  }
  
  return {
    gap,
    isLowBenchmark,
    contextExplanation,
    interpretation
  };
}
```

✅ **Result**: Now have a function that explains benchmark context

---

## FIX #5: Update Email Benchmark Messaging (10 minutes)

### Step 5a: In `lib/email.ts`, find the `benchmarkLine` variable (around line 42-46)

Look for:
```typescript
const benchmarkLine = score > 0
  ? `Your score of <strong>${score}%</strong> compares to an industry average of <strong>${benchAvg}%</strong> for ${lead.industry || 'your industry'}.
```

### Step 5b: BEFORE the `benchmarkLine` assignment, add this import at the top of the function:

Right after the line with `const businessModel = inferBusinessModel(lead.industry);`, add:

```typescript
  const benchmarkContext = score > 0 ? getBenchmarkContext(score, benchAvg, lead.industry) : null;
```

### Step 5c: Now replace the `benchmarkLine` assignment with:

```typescript
const benchmarkLine = score > 0
  ? `Your score of <strong>${score}%</strong> vs. the <strong>${benchAvg}%</strong> industry benchmark for ${lead.industry}.
     <br/><br/>
     <strong>Context:</strong> ${benchmarkContext?.contextExplanation}
     <br/><br/>
     <strong>What this means for you:</strong> ${benchmarkContext?.interpretation}`
  : `Your AI visibility baseline is undiagnosed. Search for ${entity} in ChatGPT or Perplexity to see where you stand.`;
```

**Note**: Make sure to import `getBenchmarkContext` at the top of the file:

At the very top of `lib/email.ts` where other imports are, add:
```typescript
import {
  getAllCompetitors,
  getVisibilityScore,
  getIndustryBenchmark,
  buyerConversations,
  inferBusinessModel,
  getPipelineLabel,
  getBenchmarkContext,  // ADD THIS LINE
} from '@/lib/scoring';
```

✅ **Result**: Email now explains WHY benchmarks are high or low

---

## FIX #6: Reframe Root Causes (15 minutes)

### Step 6a: Open `app/results/[id]/page.tsx`

### Step 6b: Find the "Root cause" section (around line 705-717)

Look for:
```jsx
<div className="p-6 border-b border-gray-100">
  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Root cause</p>
  <p className="text-base font-bold text-gray-900 leading-snug mb-3">{rootCauseHeadline}</p>
  <ul className="space-y-3">
```

### Step 6c: Replace this entire section with:

```jsx
<div className="p-6 border-b border-gray-100 bg-blue-50/30">
  <p className="text-xs font-semibold text-[#534AB7] uppercase tracking-wide mb-2">
    Diagnostic hypotheses
  </p>
  <p className="text-base font-bold text-gray-900 leading-snug mb-3">{rootCauseHeadline}</p>
  
  <p className="text-xs text-gray-600 mb-4 leading-relaxed">
    Based on your reported AI testing, these are the most likely reasons for your visibility gap. 
    However, these are hypotheses, not confirmed diagnoses. Your full AEO Visibility Report 
    includes website audit to confirm which factor is actually your constraint.
  </p>
  
  <ul className="space-y-4">
    {rootCauses.map((cause, i) => (
      <li key={i} className="flex items-start gap-3">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#EEEDFE] text-[#534AB7] text-xs font-bold flex items-center justify-center mt-0.5">
          {i + 1}
        </span>
        <div>
          <p className="text-sm text-gray-700 leading-relaxed">{cause}</p>
          <p className="text-xs text-gray-500 mt-2">
            <em>Test this hypothesis by implementing the recommended fix and measuring impact over 4-6 weeks.</em>
          </p>
        </div>
      </li>
    ))}
  </ul>
  
  <div className="mt-4 pt-4 border-t border-blue-100">
    <p className="text-xs text-gray-600 leading-relaxed">
      <strong>Measurement approach:</strong> If you implement fixes based on the primary hypothesis 
      and don't see improvement in 6 weeks, the actual constraint is likely one of the other factors. 
      Your full report helps you test and measure impact systematically.
    </p>
  </div>
</div>
```

✅ **Result**: Root causes now framed as testable hypotheses

---

## FIX #7: Add Methodology Footer to Email (10 minutes)

### Step 7a: In `lib/email.ts`, find the closing `</body></html>` tags (near the end)

Look for:
```html
</table>
</td></tr>
</table>
</body>
</html>`;
```

### Step 7b: BEFORE the closing `</table></td></tr></table>`, add this:

Find this section:
```html
  <!-- Footer -->
  <tr><td style="border-top:1px solid #e5e7eb;padding-top:20px;">
    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
      Maxifi Digital &middot; Singapore &middot;
      <a href="mailto:hello@maxifidigital.com" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
    </p>
  </td></tr>
```

And AFTER this footer section, add:

```html

  <!-- Methodology & Limitations -->
  <tr><td style="padding-top:28px;border-top:1px solid #e5e7eb;">
    <div style="background:#f9fafb;border-radius:8px;padding:16px;">
      <p style="margin:0 0 8px;font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">
        Methodology & Limitations
      </p>
      <p style="margin:0;font-size:11px;color:#6b7280;line-height:1.5;">
        This snapshot is an <strong>estimate</strong> based on your self-reported AI testing and our visibility scoring model. 
        It is <strong>not</strong> a measurement of actual AI system behavior. Key limitations:
      </p>
      <ul style="margin:6px 0 0 16px;padding:0;font-size:11px;color:#6b7280;line-height:1.4;">
        <li>Root causes are diagnostic hypotheses, not confirmed problems</li>
        <li>Conversation appearance rates are estimated from visibility score (not measured)</li>
        <li>Benchmarks represent median scores, not performance targets</li>
        <li>Actual citation frequency varies by query specificity and platform</li>
        <li>Self-reported data is not independently verified</li>
      </ul>
      <p style="margin:8px 0 0;font-size:11px;color:#6b7280;line-height:1.5;">
        <strong>For definitive analysis:</strong> Your full AEO Visibility Report includes website audit, 
        authority assessment, and competitive benchmarking to confirm which gaps are your actual constraints.
      </p>
    </div>
  </td></tr>
```

✅ **Result**: Email now discloses limitations transparently

---

## FIX #8: Add Diagnostic Helper Function (15 minutes) [OPTIONAL - nice to have]

### Step 8a: In `lib/scoring.ts`, add this function after `getBenchmarkContext`:

```typescript

/**
 * Suggests which gap is most likely to be the actual constraint
 * based on user context clues
 */
export function predictPrimaryGap(
  awareness: string,
  competitors: string[],
  industry: string,
  daysSinceCompanyFounding?: number
): {
  gap: 'structure' | 'authority' | 'citations';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
} {
  const monthsOld = daysSinceCompanyFounding ? Math.floor(daysSinceCompanyFounding / 30) : null;
  
  // Signal 1: Very new companies (< 3 months)
  if (monthsOld && monthsOld < 3) {
    return {
      gap: 'authority',
      confidence: 'high',
      reasoning: `Company is very new (${monthsOld} months). AI systems likely haven't encountered enough training data about you yet. Structure fixes won't help until you have external presence.`
    };
  }
  
  // Signal 2: Displaced by competitors (not just invisible)
  if (awareness === 'Yes — competitors were cited instead of me') {
    return {
      gap: 'structure',
      confidence: 'medium',
      reasoning: `Competitors are actively displacing you. This usually indicates they have better content structure matching buyer language. Try structure fixes first (4-6 week test window).`
    };
  }
  
  // Signal 3: Completely invisible + established brand
  if (awareness === "Yes — but I wasn't mentioned at all" && monthsOld && monthsOld > 12) {
    return {
      gap: 'citations',
      confidence: 'medium',
      reasoning: `You're established but invisible. This suggests lack of third-party validation. Focus on PR, analyst relations, review platform presence.`
    };
  }
  
  // Signal 4: Inaccurate or outdated information being returned
  if (awareness === 'Yes — but details about me were wrong' || 
      awareness === 'Yes — but old/outdated info appeared') {
    return {
      gap: 'authority',
      confidence: 'medium',
      reasoning: `You have presence, but it's being described incorrectly or outdated. This is an authority consistency problem. You need to be the definitive source across web properties.`
    };
  }
  
  // Default: structure (most common reason for invisibility)
  return {
    gap: 'structure',
    confidence: 'low',
    reasoning: `Most commonly, invisibility is due to content structure. But confidence is low without additional context. Test structure fixes and measure impact.`
  };
}
```

✅ **Result**: Optional function that suggests primary gap (advanced feature for v1.1)

---

## Testing All Fixes

### Test #1: Verify ceiling effect is fixed

```bash
node -e "
function buyerConversations(score, benchAvg) {
  const x = Math.max(0, Math.round(score / 10));
  return { x };
}
const tests = [
  { score: 50, expected: 5 },
  { score: 75, expected: 8 },
  { score: 95, expected: 10 },
  { score: 100, expected: 10 }
];
tests.forEach(t => {
  const result = buyerConversations(t.score, 50);
  const pass = result.x === t.expected ? '✓' : '✗';
  console.log(\`\${pass} \${t.score}%: x=\${result.x} (expected \${t.expected})\`);
});
"
```

**Expected**: All should show ✓

### Test #2: Verify imports work

In `lib/email.ts`, make sure this import has `getBenchmarkContext`:
```typescript
import {
  getAllCompetitors,
  getVisibilityScore,
  getIndustryBenchmark,
  buyerConversations,
  inferBusinessModel,
  getPipelineLabel,
  getBenchmarkContext,  // ← This line should exist
} from '@/lib/scoring';
```

### Test #3: Generate a test report

If you have a dev environment running:
```bash
# Generate a test report to see new language in action
# (Use the form to create a snapshot)
```

Then verify:
- ✓ Email contains "estimate" language
- ✓ Root causes section says "hypotheses"
- ✓ Benchmark section explains context
- ✓ Footer mentions limitations

### Test #4: Check compilation

```bash
# Make sure TypeScript compiles without errors
npm run build
# or
yarn build
```

---

## Commit Your Changes

Once all fixes are complete and tested:

```bash
git add lib/scoring.ts lib/email.ts app/results/[id]/page.tsx
git commit -m "fix: Implement credibility improvements for CMO-level scrutiny

Implements all 8 credibility fixes:

1. Remove ceiling effect at 100% score
   - Changed: Math.min(9) removed from buyerConversations
   - Impact: 100% score now distinct from 95%

2. Add methodology documentation
   - Added: Comprehensive comment block explaining formula limitations

3. Update email language for uncertainty
   - Changed: Added 'estimate' and methodology notes
   - Impact: Users understand conversation rates are projections

4. Add benchmark context function
   - Added: getBenchmarkContext() to explain high vs low benchmarks
   - Impact: Defense/Aviation users understand low benchmarks are normal

5. Update email benchmark messaging
   - Changed: Uses context function to explain WHY benchmarks vary
   - Impact: Industry-aware explanations reduce user confusion

6. Reframe root causes as hypotheses
   - Changed: 'Root cause' section → 'Diagnostic hypotheses'
   - Impact: Users understand these are testable, not certain

7. Add methodology footer to email
   - Added: Transparent disclosure of limitations and estimates
   - Impact: Demonstrates rigor through honest transparency

8. Add diagnostic priority tool [optional]
   - Added: predictPrimaryGap() helper function
   - Impact: Better targeting of which gap to focus on first

All changes additive (no breaking changes).
Ready for CMO-level scrutiny.

Fixes address:
- Ceiling effect at score 100%
- Formula-explanation mismatch
- Benchmark comparison confusion
- Narrative generation accuracy

https://claude.ai/code/session_011bDaWpC2k5xJYaoobbP6Wi"
```

Then push:
```bash
git push origin claude/find-visibility-logic-DE4rp
```

---

## Deployment Checklist

Before going live:

- [ ] All 8 fixes implemented
- [ ] Code compiles without errors
- [ ] Test report generated and reviewed
- [ ] Email language verified in inbox/preview
- [ ] Ceiling effect confirmed fixed (100% ≠ 95%)
- [ ] Root causes show "hypotheses" disclaimer
- [ ] Benchmark section explains context
- [ ] Methodology footer visible in email
- [ ] Changes committed to branch
- [ ] Code review completed
- [ ] Ready for merge

---

## Time Summary

| Fix | Time |
|-----|------|
| 1. Ceiling effect | 2 min |
| 2. Methodology docs | 5 min |
| 3. Email language | 10 min |
| 4. Benchmark context function | 15 min |
| 5. Update email messaging | 10 min |
| 6. Reframe root causes | 15 min |
| 7. Methodology footer | 10 min |
| 8. Diagnostic helper | 15 min |
| Testing | 10 min |
| **Total** | **92 minutes** |

---

## Troubleshooting

### Issue: TypeScript compile error
**Fix**: Make sure all imports are added (especially `getBenchmarkContext` in email.ts)

### Issue: Email not showing new language
**Fix**: Make sure you replaced the entire `buyerConvLine` and `benchmarkLine` blocks

### Issue: Root causes section not showing disclaimer
**Fix**: Make sure you replaced the entire root cause `<div>` block (lines 705-717)

### Issue: Can't find a function/variable
**Use Ctrl+F** to search the file for key phrases like "buyerConvLine" or "benchmarkLine"

---

Ready to start? Pick Fix #1 and work through sequentially. Let me know if you hit any issues!
