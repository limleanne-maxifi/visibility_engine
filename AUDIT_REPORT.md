# VISIBILITY SNAPSHOT SYSTEM - COMPREHENSIVE AUDIT REPORT
**Date**: May 21, 2026  
**Status**: Ready for Pre-Launch Review  
**Audit Scope**: Generation logic, scoring accuracy, report structure, data persistence, compliance

---

## EXECUTIVE SUMMARY

The visibility snapshot system is **structurally sound** but has **critical flaws in scoring logic, data validation, and narrative accuracy** that should be fixed before launch.

### Critical Issues Found: 8
### High-Priority Issues: 12
### Medium-Priority Issues: 15

**Recommendation**: Fix Critical + High-Priority issues before launch. Medium issues can be addressed in v1.1.

---

## CRITICAL ISSUES (MUST FIX BEFORE LAUNCH)

### 🔴 1. Competitor Displacement Scoring is Backwards
**File**: `lib/scoring.ts:31`  
**Issue**: Naming competitors reduces displacement score  
```
"competitors were cited" + 1 competitor named → score drops to 0
"competitors were cited" + 0 competitors named → score stays at 10
```
**Impact**: Users penalized for providing diagnostic data  
**Fix**: Change formula from `Math.max(0, 10 - n * 10)` to:
```javascript
awareness === 'Yes — competitors were cited instead of me'
  ? (n === 0 ? 10 : n === 1 ? 5 : n === 2 ? 3 : 0)
```

---

### 🔴 2. Response Parsing Vulnerable to Truncation
**File**: `lib/parsePlan.ts`  
**Issue**: If Claude forgets `STEP_END` delimiter, entire steps are silently dropped  
```
Missing STEP_END on step 1 → Step 1 never parsed
Step 2 onward → completely ignored
User receives incomplete plan without error notification
```
**Impact**: Users might get 1-2 steps instead of expected 3-5  
**Fix**:
```javascript
if (steps.length < stepCount) {
  throw new Error(
    `Expected ${stepCount} steps, got ${steps.length}. Raw response may be incomplete.`
  );
}
```

---

### 🔴 3. No Input Validation on Critical Fields
**File**: `app/api/generate/route.ts:29-34`  
**Issue**: Only `firstName`, `email`, `occupation` validated  
Missing validation:
- No email format check
- No industry validation (unknown industries default to benchmark 40%)
- No platform validation (empty array accepted)
- No aiPresence state validation (accepts any string)
- No text length limits (competitors/positioning could be 10KB)

**Impact**: Invalid data propagates through system, causing:
- Wrong benchmarks for unknown industries
- Generic plans when platforms undefined
- Database overflow with massive text fields

**Fix**: Add comprehensive validation:
```javascript
function validateFormData(data: FormData) {
  const errors = [];
  
  // Email format
  if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push('Invalid email format');
  }
  
  // Industry exists
  if (!INDUSTRY_BENCHMARKS[data.industry]) {
    errors.push('Industry not recognized');
  }
  
  // Platforms
  if (!data.platforms?.length || !data.platforms.find(p => p.priority === 'primary')) {
    errors.push('Must specify at least one primary platform');
  }
  
  // aiPresence is valid enum
  const validOptions = ["No, I haven't tried this yet", "Yes — and the results were accurate", ...];
  if (!validOptions.includes(data.aiPresence)) {
    errors.push('Invalid awareness state');
  }
  
  // String lengths
  if ((data.competitors?.length ?? 0) > 500) {
    errors.push('Competitors field too long');
  }
  
  return errors;
}
```

---

### 🔴 4. Competitor Parsing Breaks Company Names
**File**: `lib/scoring.ts:3-6`  
**Issue**: Company names with "&" are incorrectly split
```
Input: "Salesforce & HubSpot, Pipedrive"
Actual parsed: ["Salesforce", "HubSpot", "Pipedrive"]
Expected: ["Salesforce & HubSpot", "Pipedrive"]
```
**Impact**: 
- "Smith & Associates" becomes "Smith" and "Associates"
- Scoring sees 2 competitors instead of 1
- Competitor section in report shows split names

**Fix**:
```javascript
function getAllCompetitors(raw) {
  if (!raw?.trim()) return [];
  // Only split on comma, semicolon, newline (not ampersand)
  const entries = raw.split(/[,;\n]+/);
  return entries
    .map(e => e.trim())
    .filter(e => e.length > 0 && e.length < 100)
    .slice(0, 10);  // Max 10 competitors
}
```

---

### 🔴 5. Buyer Conversation Formula is Inaccurate
**File**: `lib/scoring.ts:168-172`  
**Issue**: Formula uses simple division without calibration  
```
Score 75% → 75/10 = 7.5 ≈ rounds to 8
Email says: "Appears in 8 out of 10 conversations"
Question: Is a 75% visibility score really an 80% appearance rate?
```
**Impact**: Users get inflated or deflated expectations  
**Fix**: Either calibrate with research or add explicit qualifier:
```javascript
"Based on your visibility score of ${score}%, 
 an estimated ${buyerX} out of 10 recommended uses 
 would include ${entityName}."
```

---

### 🔴 6. Stale Benchmark Data Risk
**File**: `lib/scoring.ts:60-106`  
**Issue**: No documentation of when benchmarks were last validated  
**Impact**: If benchmarks are 2+ years old, comparisons are misleading  
**Fix**: Add metadata:
```javascript
export const BENCHMARK_METADATA = {
  generatedDate: '2024-12-01',
  methodology: 'Median AI citation rate (ChatGPT, Perplexity, Claude)',
  samplesPerIndustry: 50,
  confidenceLevel: '95%',
  nextReviewDate: '2025-03-01'  // Quarterly review
};

// In email/report:
"Based on Q4 2024 industry analysis: ${benchAvg}% benchmark"
```

---

### 🔴 7. Industry Benchmark has Duplicate Entries
**File**: `lib/scoring.ts`  
**Issues**:
- "Cloud Infrastructure" AND "Cloud Infrastructure & DevOps" both at 74%
- "Legal" AND "Legal & Legal Services" both at 62%
- "Defense" at 35% AND "Defense & Government Systems" at 32%

**Impact**: Form dropdown has legacy and new names, scoring treats them differently  
**Fix**: 
1. Remove legacy names from form dropdown
2. Consolidate to single canonical names in benchmarks table
3. Add migration: if user selects old name, remap to new name

---

### 🔴 8. Database Insert Can Fail But Report Still Returned
**File**: `app/api/generate/route.ts:96-122`  
**Issue**: 
```javascript
try {
  const lead = await insertLead(formData, plan);
  id = lead.id;
} catch (err) {
  id = generateSessionId();  // ← Falls back to temporary ID
}
return NextResponse.json({ id, plan }, { status: 200 });  // ← Still returns report
```
**Impact**: 
- User can see report but it's not in database
- User closes tab, comes back later, report is gone (only in session memory)
- No way to retrieve report if insert failed

**Fix**: Require database success:
```javascript
try {
  const lead = await insertLead(formData, plan);
  id = lead.id;
} catch (err) {
  console.error('[generate] Database insert failed, not returning report');
  return NextResponse.json(
    {
      error: 'Failed to save your report. Please try again.',
      code: 'DATABASE_ERROR',
    },
    { status: 500 }
  );
}
return NextResponse.json({ id, plan }, { status: 200 });
```

---

## HIGH-PRIORITY ISSUES (SHOULD FIX BEFORE LAUNCH)

### ⚠️ 1. Visibility Score Can Reach Same Value for Different Scenarios
- "Haven't tried yet" = 0% (untested)
- "Invisible when tested" = 3% (tested, not found)
- Both should communicate different meanings

**Fix**: Add "Undiagnosed" state to scoring:
```javascript
const scoreLabel = 
  awareness === "No, I haven't tried this yet" ? 'Undiagnosed' :
  score === 0 ? 'Not cited' :
  `${score}%`;
```

---

### ⚠️ 2. Email Contains Ambiguous Framing
**Issues**:
- "73% visibility" is ambiguous (score? percentile? frequency?)
- "In 10 out of 10 cases" is an extrapolation, not a measurement
- Subject line lacks qualifier

**Fix**: Add disclaimers:
```
Subject: "Your AI Visibility Snapshot — Estimated ${score}% visibility"

Body: "Based on your self-reported testing and our analysis, 
       an estimated ${buyerX} out of 10 AI-generated recommendations 
       would include ${entityName}."
```

---

### ⚠️ 3. Root Cause Analysis Uses Generic Templates
**Issue**: Same three-gap framework applied to all users  
- "Content structure" is ONE possible cause, not the primary cause
- Users implementing structure fixes might not address their actual problem
- No website audit → can't definitively identify root cause

**Fix**: Add uncertainty language:
```
"Based on patterns we've observed, the most common reasons 
 brands in ${industry} aren't cited are related to one of 
 three areas. Your full AEO Visibility Report audits your 
 specific website to confirm which actually applies to you."
```

---

### ⚠️ 4. Business Model Mapping is Incorrect for Some Industries
**Issues**:
- Professional Services → B2B (wrong, many serve consumers)
- Accounting & Finance → B2B (wrong, many CPAs serve individuals)

**Fix**: Update mapping:
```javascript
const MIXED_INDUSTRIES = new Set([
  'Professional Services',  // Add this
  'Accounting & Finance',   // Add this
  'Healthcare & Life Sciences',
  // ... existing entries
]);
```

---

### ⚠️ 5. No Rate Limiting on /api/generate
**Risk**: Attacker submits 1000 requests/minute → burns Claude API quota  
**Fix**: Add rate limiting:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour per IP
  message: 'Too many plans generated. Please try again later.',
});

export const POST = limiter(async (req) => { ... });
```

---

### ⚠️ 6. Missing Field in Database Schema: aeoOutcome
**Issue**: `aeoOutcome` is collected in form but NOT stored in database  
**Impact**: Can't analyze "Which outcomes do users want?" or "Do 'credibility' users respond differently?"  
**Fix**: Add `outcome` field to AeoLeadRow and insert logic

---

### ⚠️ 7. Supabase Data Normalization Issues
**Issues**:
- Challenges stored as delimited string "A; B; C" (could break if challenge contains ";")
- Competitors stored raw without parsing
- No validation on platform names

**Fix**: Pre-normalize before storage:
```javascript
const lead = await insertLead({
  ...formData,
  challenges: formData.challenges,  // Store as JSON array
  competitors: getAllCompetitors(formData.competitors),  // Parse first
});
```

---

### ⚠️ 8. Self-Reported Data Never Verified
**Issue**: Users can lie about their current visibility  
- User: "Competitors are cited instead of me"
- Reality: Actually invisible
- Result: Wrong recommendations

**Fix**: Add verification step in form:
```
Step 3 → "Let's verify your current visibility"
→ Show search link to ChatGPT with their query
→ Ask: "What did you find?"
→ Validate matches their earlier selection
```

---

### ⚠️ 9. Parsing Regex Could Break on Legitimate Content
**Issue**: Body regex terminates at ANY line starting with "NUM/TITLE/BODY"  
```
User's content: "TITLE: Best practices for success"
Regex sees: "^TITLE:" and thinks it's a new step delimiter
Result: Body is truncated
```
**Fix**: Only match delimiters with more strict pattern:
```javascript
// Current (too greedy):
const bodyMatch = block.match(/^BODY:\s*([\s\S]+?)(?=\n(?:NUM|TITLE|BODY|$)|\s*$)/m);

// Better (only newline-prefixed delimiters):
const bodyMatch = block.match(/^BODY:\s*([\s\S]+?)(?=\n[A-Z]+:\s*|$)/m);
```

---

### ⚠️ 10. No Email Re-send Mechanism
**Issue**: If email send fails, user never knows  
**Impact**: User expects report in inbox, never receives it  
**Fix**: 
```javascript
// Log all email failures with timestamp
// Provide manual re-send button in UI:
"Email not received? <button>Resend to ${email}</button>"
```

---

### ⚠️ 11. Email Subject Line Can Be Very Long
**Issue**: 
```
"Your AI Visibility Snapshot — ACME Corporation is at 89% visibility"
```
Some email clients truncate long subjects. Competitor names make this worse.

**Fix**: Limit subject:
```javascript
const entity = (lead.company_name ?? lead.first_name).slice(0, 20);
const subject = `Your AI Visibility Snapshot — ${entity} at ${scoreDisplay}`;
```

---

### ⚠️ 12. No Logging of Why Parse Errors Occurred
**Issue**: When parse fails, error is logged but raw response is not retained  
**Impact**: Can't debug what Claude sent that broke the parser  
**Fix**: Always log raw response on parse error:
```javascript
} catch (err) {
  console.error('[generate] Parse error. Response length:', rawText.length);
  console.error('[generate] First 500 chars:', rawText.slice(0, 500));
  console.error('[generate] Error detail:', err.message);
  // Save failed responses for analysis
  await saveParseFallure(formData, rawText, err);
}
```

---

## MEDIUM-PRIORITY ISSUES (v1.1)

### 1. Duplicate Industry Entries Should Be Consolidated
- "Cloud Infrastructure" vs "Cloud Infrastructure & DevOps"
- "Legal" vs "Legal & Legal Services"  
- "Aviation & Aerospace" vs "Aviation, ATC & Aerospace"
- **Action**: Single source of truth for benchmarks

### 2. No Timezone Handling
- Reports generated with timestamp
- No timezone info stored
- **Action**: Store `created_at` in UTC, convert for display

### 3. Report Share Feature Lacks Authentication
- Anyone with link can see report
- **Action**: Add optional password protection or auth

### 4. QUICKWIN Could Exceed "30 minutes"
- No validation that quick win is actually quick
- **Action**: Add prompt constraint: "QUICKWIN must be completable in under 30 minutes"

### 5. Platforms List Could Be Better Validated
- User could enter "ChatGP" (typo for ChatGPT)
- No autocomplete or validation
- **Action**: Add platform dropdown with validation

### 6. Positioning Field Can Be Stored as JSON
- Currently stored as string
- **Action**: Consider structured data for positioning attributes

### 7. No Audit Trail
- Can't see who changed what in reports
- **Action**: Add `updated_at` and change log for enterprise features

### 8. Missing Seasonal Context
- "AI citation patterns shift quarterly"
- But no indication of Q
- **Action**: Show "Q4 2024 snapshot" vs just "2024 snapshot"

### 9. Large Text Fields Could Cause UI Overflow
- Very long competitor names or positioning statements
- **Action**: Add truncation in UI with "show more"

### 10. No Multi-Language Support
- International users see English content
- **Action**: Plan i18n for v1.1

### 11. Missing "Prefer not to say" Options
- Some fields should be optional with better labeling
- **Action**: Add "Rather not say" to challenges, competitors

### 12. Report PDF Generation Not Implemented
- Button exists but unclear if feature works
- **Action**: Test PDF download before launch

### 13. No User Feedback Loop
- No way for users to report "this analysis was wrong"
- **Action**: Add feedback form linked to report ID

### 14. Benchmark Comparison Should Indicate Confidence
- Some industries might have low sample sizes
- **Action**: Add confidence indicator: 95%, 75%, 50%

### 15. Missing Mobile Optimization Check
- Report should render well on phones
- **Action**: Test on iPhone 12, Samsung Galaxy

---

## PRE-LAUNCH VALIDATION CHECKLIST

### Functional Testing
- [ ] Generate 10 test reports across different industries
- [ ] Verify all scores are between 0-100
- [ ] Check each plan has 3-5 steps + quickwin
- [ ] Email rendering on Gmail, Outlook, Apple Mail
- [ ] Report PDF download works
- [ ] Share link functionality works
- [ ] Copy link to clipboard works

### Data Integrity
- [ ] Test edge case: 0 competitors
- [ ] Test edge case: 10+ competitors
- [ ] Test edge case: Very long positioning (500+ chars)
- [ ] Test edge case: Special characters in name (é, ñ, 中文)
- [ ] Test edge case: Industry not in benchmark list
- [ ] Test edge case: Missing optional fields
- [ ] Verify Supabase data is correctly formatted

### Benchmark Validation
- [ ] Verify "AI & Machine Learning" at 78% is current
- [ ] Verify "Defense & Government Systems" at 32% is current
- [ ] Check if "Real Estate & Property" at 35% needs update
- [ ] Confirm sample size and methodology for all benchmarks

### Accuracy Testing
- [ ] Manually verify 5 generated queries in ChatGPT
- [ ] Check that scores correlate with actual AI presence
- [ ] Verify root causes match awareness state
- [ ] Review email claims for overstatement

### Security
- [ ] No secrets (API keys, tokens) in error messages
- [ ] Email addresses properly validated
- [ ] Rate limiting is working
- [ ] XSS/injection attacks don't break parsing
- [ ] Database credentials not exposed in logs

### Performance
- [ ] API response time < 30 seconds (target)
- [ ] Load test: 100 concurrent requests
- [ ] Claude API quota capacity verified
- [ ] No timeout issues under load

### Monitoring Setup
- [ ] Error tracking (Sentry or similar) configured
- [ ] Parse error rate dashboard
- [ ] Score distribution dashboard
- [ ] Email engagement tracking
- [ ] Funnel analytics

---

## DEPLOYMENT CHECKLIST

Before going live:

- [ ] All 8 Critical issues resolved
- [ ] All 12 High-Priority issues resolved
- [ ] Email disclaimer added
- [ ] Benchmark date/methodology documented
- [ ] Rate limiting deployed
- [ ] Database backup strategy confirmed
- [ ] Support response plan ready
- [ ] Monitoring alerts configured
- [ ] Legal review completed (compliance)
- [ ] Post-launch feedback collection method ready

---

## POST-LAUNCH MONITORING

**Week 1**:
- Monitor error rate (target < 1%)
- Check parse error rate (target < 2%)
- Verify email delivery (target > 95%)

**Week 2**:
- Analyze score distribution (should be roughly normal)
- Review sample of generated reports (quality check)
- Monitor Claude API quota usage

**Week 4**:
- Benchmark accuracy sampling (20 users)
- User feedback review
- Performance metrics review

**Quarterly**:
- Validate benchmark accuracy
- Review new AEO patterns
- Update prompts if needed

---

## SIGN-OFF

**Status**: CONDITIONAL APPROVAL

✅ **Can launch if Critical issues are fixed before deployment**

⚠️ **Recommended delay**: 2-3 days to implement Critical + High-Priority fixes

📋 **Next steps**:
1. Create GitHub issues for all Critical items
2. Assign priority: Critical (today), High-Priority (this week)
3. Run through validation checklist
4. Set up monitoring dashboards
5. Schedule post-launch review (Day 3)

---

**Report Generated**: 2026-05-21  
**Auditor**: Claude Code Audit System  
**Session**: /home/user/visibility_view
