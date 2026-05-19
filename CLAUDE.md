# Maxifi Digital — AI Visibility Snapshot

## Brand colours

| Token | Hex | Usage |
|---|---|---|
| `--navy-header` | `#091521` | Site header bar — always the darkest layer |
| `--navy-home` | `#0B1929` | Homepage and case study/work pages only |
| `--navy-sub` | `#152438` | Tool/form, insights/blog, and legal pages |
| `--gold` | `#C87A2F` | Primary CTA, progress bar, accents |
| `--gold-hover` | `#A8651E` | Hover state for gold elements |
| `--gold-bg` | `#FDF1E6` | Tinted background for selected/highlighted states |

## Background rules (page type → background)

| Page type | Background |
|---|---|
| Homepage | `#0B1929` (`--navy-home`) |
| Case studies / Work pages | `#0B1929` (`--navy-home`) |
| Hero sections (any page) | Same as the page background — do not lighten |
| Tool / form / legal pages | `#152438` (`--navy-sub`) |
| Insights / blog body | `#152438` (`--navy-sub`) |
| Navigation header | `#091521` (`--navy-header`) always |

The lighter subpage background (`#152438`) distinguishes tool and content pages
from the homepage without breaking brand cohesion. It is **not** for the homepage
or high-impact marketing pages, which stay on the deeper `#0B1929`.

## Naming

The tool is called **AI Visibility Snapshot** throughout all copy, UI, and email.
Do not use the old name "AEO Visibility Snapshot".

## Logos

- `public/maxifi-logo-white.png` — use on dark backgrounds (header, dark cards)
- `public/maxifi-logo-black.png` — use on light backgrounds (emails, PDFs)

## API routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/generate | None | Submit form, create free report |
| GET | /api/report/[id]/free | None | Fetch sections 1–4 |
| GET | /api/report/[id]/full | Session cookie + unlock | Fetch sections 5–8 |
| POST | /api/gate | None | Email gate — send magic link |
| POST | /api/gate/resend | None | Re-issue magic link |
| GET | /api/token/verify | Token query param | Verify link, set session cookie |
| POST | /api/stripe/checkout | Session cookie | Create Stripe Checkout Session |
| POST | /api/stripe/webhook | Stripe-Signature | Handle payment confirmation |
| GET | /api/admin/leads | x-admin-key header | Export leads CSV |

## Report tiers

Free (no email required): sections 1–4 (citation_snapshot, failure_mode_diagnosis,
platform_visibility, benchmark_comparison).

Locked (email + payment required): sections 5–8 (competitor_displacement,
positioning_gap, query_gap, action_queue).

## Database

Five tables: leads → snapshots → reports → unlock_events, report_tokens.
All DB access is server-side via SUPABASE_SERVICE_KEY. Anon key is not used.
RLS is enabled on all tables with deny-all default for anon role.
