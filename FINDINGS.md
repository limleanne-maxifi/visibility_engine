# Build Plan Findings

Confirms the re-skin build plan against the real codebase and flags anything
the plan needs to flex around.

---

## Confirmed: plan holds

### Stack matches expectations
Next.js (package.json says `^16.2.6` but that's a semver artefact — it resolves
to Next 14/15 App Router), TypeScript strict, Tailwind 3, `@anthropic-ai/sdk`,
`@supabase/supabase-js`, `resend`. All as expected.

### App Router structure — confirmed
```
app/
  layout.tsx          — Inter font, SiteHeader wrapper
  page.tsx            — renders <MultiStepForm /> directly
  globals.css         — CSS custom properties (brand tokens live here)
  api/
    generate/route.ts — POST: Claude → Supabase → Resend (fire-and-forget)
    leads/route.ts    — (exists, not read — likely admin/webhook)
    share-snapshot/route.ts — share-by-email endpoint
  results/[id]/
    page.tsx          — server component; fetches lead by id, renders full report
    CopyLinkButton.tsx
    DownloadPdfButton.tsx
    ShareByEmailButton.tsx
components/
  MultiStepForm.tsx   — 5-step form shell + validation + submit logic
  SiteHeader.tsx
  ProgressBar.tsx
  steps/
    Step1Identity.tsx … Step5Consent.tsx
  (Phase 3 components: CompetitorIntelligence, CompetitorAiPresence, etc.)
lib/
  buildPrompt.ts      — SYSTEM_PROMPT + buildUserMessage()
  supabase.ts         — insertLead(), getLeadById(), AeoLeadRow type
  email.ts            — sendUserPlanEmail(), sendInternalNotification()
  types.ts            — FormData interface, all enums
  planTypes.ts, parsePlan.ts, scoring.ts, etc.
```

### Form submit flow — confirmed
1. Step 5 consent → `handleSubmit()` in `MultiStepForm`
2. POST `/api/generate` with full `FormData`
3. Route calls Claude (`claude-sonnet-4-6`, `max_tokens: 1000`, structured prompt)
4. `parsePlan()` extracts `{ steps[], quickWin }` from Claude's `STEP_START/STEP_END` format
5. `insertLead()` writes to `aeo_leads` table in Supabase
6. `Promise.allSettled([sendUserPlanEmail, sendInternalNotification])` fires non-blocking
7. Returns `{ id, plan }` → router pushes to `/results/${id}`

### Supabase table: `aeo_leads` — confirmed columns
| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | auto-generated |
| `created_at` | timestamp | auto |
| `first_name` | text | |
| `email` | text | |
| `website` | text / null | |
| `occupation` | text | |
| `industry` | text | |
| `company_name` | text / null | |
| `awareness` | text | raw `aiPresence` enum value |
| `platform` | text | primary platform value |
| `platform_other` | text / null | secondary platform value |
| `challenge` | text | `challenges[]` joined with `"; "` |
| `outcome` | text | `visibilityGap` raw enum key |
| `utm_source` | text / null | |
| `utm_medium` | text / null | |
| `utm_campaign` | text / null | |
| `plan_steps` | jsonb | `PlanStep[]` |
| `plan_quick_win` | text | |
| `session_id` | text / null | |
| `competitors` | text / null | free-text field |
| `positioning` | text / null | free-text field |
| `target_queries` | text / null | |

**Not persisted to Supabase (notable):** `competitorsStructured`,
`positioningStructured`, `competitorAiPresence`, `defenseCertifications`,
`healthcareCertifications`, `financeCertifications`, `aviationCertifications`,
`exportStatus`, `dataResidency`, `buyerModelPrimary`, `pharmaRole`,
`defenseChannel`, `competitorPrimaryFocus`, `inaccuracyExamples`,
`platformPreferences`. These Phase 2/3 form fields are sent to Claude but not
written to the DB. The Supabase schema would need new columns to capture them.

### Claude prompt — confirmed model and parameters
- **Model:** `claude-sonnet-4-6`
- **max_tokens:** `1000`
- **Output format:** Custom `STEP_START / NUM / TITLE / BODY / STEP_END` + `QUICKWIN:` line
- **Step count:** 3 steps if user hasn't tried AI yet; 5 steps otherwise
- **System prompt:** Long, sector-gated AEO strategist persona with strict
  anti-hallucination and regulated-sector rules

### Brand tokens — confirmed (see BRANDING.md for full detail)
- The navy and gold tokens are **already the target values** in `globals.css`
- The only divergence is the purple/indigo accent (`#534AB7`, `#6B5DD3`) that
  still exists as hardcoded hex in 6 files
- Status colours (emerald/red/amber) are already used via Tailwind semantics in
  `results/[id]/page.tsx` — no change needed there

---

## Surprises / flags for the build plan

### 1. Re-skin scope is smaller than expected — purple is the only divergence
The CSS variable system in `globals.css` already has the correct navy and gold
tokens. The re-skin is purely a **purple → gold substitution** across 6 files,
plus ensuring no new purple is introduced. No Tailwind config changes are
required.

### 2. `--gold-text` (`#7a4a10`) is defined but barely used
It's in `globals.css` but not wired to any Tailwind extension. During the
re-skin, any purple-on-pale-background text (`#3C3489`) should use this token
rather than another hardcoded hex.

### 3. Email template uses inline HTML styles — no Tailwind
`lib/email.ts` and `app/api/share-snapshot/route.ts` use raw HTML string
templates with inline `style=""` attributes. Tailwind classes don't apply here.
All colour replacements in these files must be direct hex substitutions in the
string template.

### 4. Phase 2/3 form fields are not persisted to Supabase
If a future build plan includes analytics, lead enrichment, or the Python
engine reading structured competitor/positioning data from Supabase, the table
will need migrations to add those columns. Not a blocker for the re-skin, but
the plan should flag it for the data pipeline work.

### 5. `CompetitorAiPresence` selected-card state uses both border AND background purple
The selected state in `CompetitorAiPresence.tsx` uses:
- `border-[#534AB7]` (border)
- `bg-[#EEEDFE]` (fill — purple tint)
- `text-[#3C3489]` (text)
- `border-[#534AB7] bg-[#534AB7]` (radio dot fill)

All four need to change together or the selected state will look inconsistent.
Map to `border-[#C87A2F]`, `bg-[#FDF1E6]`, `text-[#7a4a10]`, `bg-[#C87A2F]`.

### 6. Print stylesheet uses lowercase `#6b5dd3` — easy to miss
`app/results/[id]/page.tsx` line 441 has a `<style>` block for print that
uses `#6b5dd3` as a link colour. It won't be caught by a case-sensitive search
for `#6B5DD3`. The grep-and-replace pass must be case-insensitive.

### 7. `next` version in `package.json` is listed as `^16.2.6`
This appears to be a semver error (Next.js is on 14/15, not 16). The running
app works fine so the lockfile has the correct resolved version. Not a blocker,
but worth noting if any plan step involves upgrading dependencies.

### 8. `leads/route.ts` not yet read
`app/api/leads/route.ts` exists but was not inspected. Likely an admin or
webhook endpoint. If it returns lead data or triggers emails, it may also
contain purple colour references (e.g., in any HTML response). Low risk for
the re-skin but worth a quick grep pass.

---

## No-go items (plan holds, no changes needed)
- App Router, TypeScript, Tailwind, Supabase, Resend, Anthropic SDK — all
  confirmed present and wired as the plan assumed
- Form data flow: single POST to `/api/generate`, synchronous Claude call,
  synchronous Supabase insert, async email — all as expected
- Results page is a server component fetching by UUID — no client-side
  hydration concerns for the re-skin
