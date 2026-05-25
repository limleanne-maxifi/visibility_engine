# Branding Token Reference

Source of truth for the Visibility View re-skin and for aligning the Python
engine's report template and Lunacal booking page.

---

## Current tokens (as-built — pre re-skin)

These are the tokens actually in use today. They live in two places:

1. **`app/globals.css`** — CSS custom properties (applied via `var()` inline
   styles throughout the app)
2. **Inline hex values** scattered across components and the email template
   (see "Dirty hex inventory" below)

### CSS variables (`app/globals.css`)

| Variable | Value | Where used |
|---|---|---|
| `--navy-sub` | `#152438` | `body` background |
| `--navy-header` | `#091521` | `SiteHeader` background |
| `--gold` | `#C87A2F` | Progress bar, step labels, CTA buttons, gap badges, scoring table accents |
| `--gold-hover` | `#A8651E` | CTA button hover state |
| `--gold-pale` | `#FDF1E6` | Step-number badge background, choice-card selected bg |
| `--gold-text` | `#7a4a10` | (defined, not yet widely used) |

> Note: `--navy-sub` and `--navy-header` are already the target values.
> The gold tokens are already the target values. **The only divergence between
> current and target is the purple/indigo accent.**

### Dirty hex inventory — purple accent (to be replaced)

These hardcoded hex values exist **outside** the CSS variable system and must
be migrated to the gold token or removed entirely during the re-skin:

| Hex | Variant | Files |
|---|---|---|
| `#534AB7` | Older purple accent | `app/results/[id]/page.tsx` (×1), `components/CompetitorAiPresence.tsx` (×2), `components/CompetitorIntelligence.tsx` (×1), `components/steps/Step4Goals.tsx` (×3) |
| `#6B5DD3` | Brighter purple accent | `app/results/[id]/page.tsx` (×2), `lib/email.ts` (×4), `app/api/share-snapshot/route.ts` (×2) |
| `#6b5dd3` | Same as above, lowercase | `app/results/[id]/page.tsx` (×1 — print stylesheet) |
| `#3C3489` | Dark purple (selected text) | `components/CompetitorAiPresence.tsx` (×1) |
| `#EEEDFE` | Purple tint (selected bg) | `components/CompetitorAiPresence.tsx` (×1) |
| `#4640a0` | Purple hover | `components/steps/Step4Goals.tsx` (×1) |
| `#ddd6fe` | Purple-tint body copy | `lib/email.ts` (×1) |
| `#c4b5fd` | Purple-tint fine print | `lib/email.ts` (×1) |

### Tailwind config (`tailwind.config.ts`)

Minimal — only maps `background` and `foreground` to CSS vars. All brand
colours are applied via inline `style` props or Tailwind arbitrary values
(`text-[#C87A2F]`). No `brand.*` palette defined at the config level.

---

## Target tokens (post re-skin)

These are the values to use for every new surface and to replace every purple
reference above.

### Core palette

| Token name | Hex | Usage |
|---|---|---|
| `navy` | `#091521` | Page background (header), deepest surface |
| `navy-sub` | `#152438` | Body/page background, card backdrop |
| `gold` | `#C87A2F` | Primary CTA, active states, accent badges, progress bar, links on dark bg |
| `gold-hover` | `#A8651E` | CTA hover / focus state |
| `gold-pale` | `#FDF1E6` | Gold-tinted chip/badge backgrounds, selected-card fill |
| `gold-text` | `#7a4a10` | Gold text on pale background (accessibility) |

> All six of these are already defined as CSS custom properties in
> `app/globals.css`. No new variables need to be created — just the purple
> hardcodes need to be replaced with references to these.

### Status / signal colours (report mockup)

Used in the platform presence matrix, scoring table, and gap badge system on
the results page. These are already partially in use via Tailwind semantic
classes (`bg-emerald-100`, `bg-red-100`, etc.) and should remain as Tailwind
utilities — do NOT replace with inline hex.

| Role | Tailwind class | Approx hex | Current usage |
|---|---|---|---|
| Positive / cited | `emerald-*` | `#10B981` (500) | Platform status "Cited ✓", scoring table positive rows |
| Danger / missing | `red-*` | `#EF4444` (500) | Platform status "Not found" / "Competitor", bad scoring rows |
| Warning / stale | `amber-*` | `#F59E0B` (500) | Platform status "Cited — outdated" |
| Caution / inaccurate | `orange-*` | (orange-700 ≈ `#C2410C`) | Platform status "Cited — wrong info" |

### Typography and neutrals

Already using system/Inter stack. No changes needed here. Grey neutrals
(`#111827`, `#374151`, `#6b7280`, `#9ca3af`) are standard Tailwind gray and
should stay as-is.

---

## Replacement mapping (purple → gold)

When replacing purple accent instances, apply this mapping:

| Old (purple) | New (gold) | Context |
|---|---|---|
| `#534AB7` (CTA bg, selected border) | `#C87A2F` | Active/selected state borders and backgrounds |
| `#6B5DD3` / `#6b5dd3` (accent, link, CTA bg) | `#C87A2F` | All accent uses — links, labels, CTA backgrounds |
| `#4640a0` (hover) | `#A8651E` | Hover state on CTA buttons |
| `#3C3489` (selected text) | `#7a4a10` | Text on gold-pale selected background |
| `#EEEDFE` (selected bg tint) | `#FDF1E6` | Selected-card / chip fill |
| `#ddd6fe` (email body copy tint) | keep as `#e8d5b8` or remove | Email template only — use a warm pale |
| `#c4b5fd` (email fine print tint) | `rgba(255,255,255,0.65)` or similar | Email template fine print on gold CTA block |

---

## Surfaces to update during re-skin

Listed in dependency order (shared lib before pages):

1. `components/steps/Step4Goals.tsx` — 3 focus-border refs + 1 CTA button
2. `components/CompetitorAiPresence.tsx` — selected card border/bg/text (4 refs)
3. `components/CompetitorIntelligence.tsx` — 1 focus-border ref
4. `app/results/[id]/page.tsx` — print stylesheet + 2 inline link/label refs
5. `lib/email.ts` — 4 refs in HTML email template (header label, CTA card bg, CTA button text colour, link colour)
6. `app/api/share-snapshot/route.ts` — 2 refs in share email template

---

## Python engine / Lunacal alignment

The Python report template (`src/visibility_engine/`) and any Lunacal booking
page customisation should use the same core palette:

- Background: `#091521` (navy) / `#152438` (navy-sub)
- Primary accent / CTA: `#C87A2F` (gold)
- Hover: `#A8651E` (gold-hover)
- Status: emerald `#10B981` / red `#EF4444` / amber `#F59E0B`
- Do **not** carry forward any `#534AB7` / `#6B5DD3` purple.
