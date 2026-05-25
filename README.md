# AI Visibility Check

## 1. Project Overview

AEO Visibility Check is a lead generation tool built for Maxifi Digital that helps professionals and businesses understand their current presence in AI-powered search (ChatGPT, Perplexity, Google AI Overviews, etc.). Visitors complete a short 5-step assessment about their role, industry, and AEO awareness; the tool calls the Claude API to generate a personalised action plan, stores the lead in Supabase, sends the plan to the user via email, and notifies the Maxifi team — all in a single form submission. The results page is shareable by link and includes a booking CTA for Maxifi's AEO audit service.

## 2. Tech Stack

- **Next.js 14** — App Router, Server Components, API Routes
- **TypeScript** — strict mode throughout, no `any` types
- **Tailwind CSS** — utility-first styling, accent colour `#534AB7`
- **Claude API** (`claude-sonnet-4-20250514`) — AI plan generation via `@anthropic-ai/sdk`
- **Supabase** — PostgreSQL lead storage via `@supabase/supabase-js`
- **Resend** — Transactional email (HTML plan email to user + plain text notification to Maxifi)

## 3. Environment Variables

| Variable | Description | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API key for plan generation | [console.anthropic.com](https://console.anthropic.com) |
| `SUPABASE_URL` | Your Supabase project URL | Supabase dashboard → Project Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase dashboard → Project Settings → API |
| `RESEND_API_KEY` | Resend API key for email delivery | [resend.com](https://resend.com) → API Keys |
| `MAXIFI_NOTIFY_EMAIL` | Internal inbox for new lead notifications | Set to your team email (e.g. `hello@maxifidigital.com`) |
| `MAXIFI_CONTACT_EMAIL` | Contact email shown in server-rendered pages | e.g. `letsgetstarted@maxifidigital.com` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact email in client components | Same value as `MAXIFI_CONTACT_EMAIL` |
| `NEXT_PUBLIC_ADMIN_KEY` | Secret key protecting `GET /api/leads` | Generate any strong random string |
| `CALENDLY_URL` | Booking link used on the results page CTA | Your Calendly scheduling URL |

## 4. Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd aeo-visibility-check
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create your local environment file**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in all values in `.env.local` — see the table above.

4. **Run the Supabase migration**

   In the Supabase SQL editor, run the following to create the `aeo_leads` table:

   ```sql
   create table aeo_leads (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz default now(),
     first_name text not null,
     email text not null,
     website text,
     occupation text not null,
     industry text not null,
     company_name text,
     awareness text not null,
     platform text not null,
     platform_other text,
     challenge text not null,
     outcome text not null,
     utm_source text,
     utm_medium text,
     utm_campaign text,
     plan_steps jsonb not null,
     plan_quick_win text not null,
     session_id text
   );
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## 5. Lead Export

Download all leads as a CSV file using the admin key:

```bash
curl -H "x-admin-key: YOUR_KEY" https://yourdomain.com/api/leads --output leads.csv
```

Replace `YOUR_KEY` with the value of `NEXT_PUBLIC_ADMIN_KEY`. The CSV includes: id, created\_at, first\_name, email, occupation, industry, company\_name, website, awareness, platform, challenge, outcome, utm\_source, utm\_medium, utm\_campaign, session\_id.

## 6. Deployment

**Vercel is recommended** for deployment (zero-config Next.js support).

1. Push the repository to GitHub
2. Import the project in the [Vercel dashboard](https://vercel.com/new)
3. Set all environment variables listed in section 3 under **Project Settings → Environment Variables**
4. Deploy

> **Note on `NEXT_PUBLIC_ADMIN_KEY`:** Despite the `NEXT_PUBLIC_` prefix (which would normally expose a variable to the browser bundle), this key is only used server-side in the `GET /api/leads` route handler. The prefix was chosen for consistency with the rest of the env var naming. Treat it as a secret — use a strong random value and do not share it publicly.
