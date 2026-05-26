import type { Metadata } from 'next';
import { getLeadByToken } from '@/lib/supabase';
import {
  getReportPrice,
  PRICE_STANDARD,
  STRIPE_LINK,
  CALENDLY_LINK,
} from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Unlock Your Full Measured Report — Maxifi Digital',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

interface Personalization {
  entity: string;
  score: number;
  industry: string;
}

async function loadPersonalization(token: string | undefined): Promise<Personalization | null> {
  if (!token) return null;
  try {
    const lead = await getLeadByToken(token);
    if (!lead) return null;
    const entity   = lead.company_name ?? lead.first_name;
    const score    = lead.report_data?.score?.score;
    const industry = lead.industry;
    if (!entity || typeof score !== 'number' || !industry) return null;
    return { entity, score, industry };
  } catch {
    return null;
  }
}

export default async function UnlockPage({ searchParams }: Props) {
  const { token }     = await searchParams;
  const personalize   = await loadPersonalization(token);
  const reportPrice   = getReportPrice();
  const standardPrice = PRICE_STANDARD;

  return (
    <div className="unlock-page">
      <style dangerouslySetInnerHTML={{ __html: UNLOCK_CSS }} />

      <div className="topbar">
        <div className="wrap">
          <div className="row">
            <div className="brand">Maxifi <span>Digital</span></div>
            <div className="topline">AI Visibility Report</div>
          </div>
        </div>
      </div>

      <div className="stage">
        <div className="wrap">
          <div className="card">
            <div className="eyebrow">Airspace World 2026 · Launch rate ends 30 June</div>
            <h1 className="hero-h1">
              Become the brand <span className="accent">AI recommends</span> — not the one it leaves out.
            </h1>
            <p className="hero-lead">
              Your free snapshot showed where you stand. The full report shows{' '}
              <strong>exactly which competitors AI cites instead of you</strong>, on which platforms,
              and the precise fixes to change it — measured across live AI tools, not estimated.
            </p>
            {personalize && (
              <div className="hero-you">
                Prepared for <b>{personalize.entity}</b> &nbsp;·&nbsp; Current visibility{' '}
                <b>{personalize.score} / 100</b> &nbsp;·&nbsp; {personalize.industry}
              </div>
            )}
          </div>

          <div className="card">
            <span className="section-num">What the full report measures</span>
            <h2 className="section-h2">Four measured sections. Real AI tests. Your actual gaps.</h2>
            <p className="section-sub">
              We run live queries across the AI platforms your buyers use and record exactly what
              they return — then turn it into a prioritised plan you can act on this week.
            </p>
            <div className="gets">
              <div className="get">
                <div className="n">5</div>
                <div>
                  <h3>Competitor Displacement</h3>
                  <p>The specific competitors cited instead of you, on each platform, and the structural advantage letting them win.</p>
                </div>
              </div>
              <div className="get">
                <div className="n">6</div>
                <div>
                  <h3>Positioning Gap Report</h3>
                  <p>How AI engines describe you today versus how they should — with the exact changes to close the gap.</p>
                </div>
              </div>
              <div className="get">
                <div className="n">7</div>
                <div>
                  <h3>Target Query Coverage</h3>
                  <p>Query-by-query results: which buyer questions you appear in, which you don&rsquo;t, and who&rsquo;s cited in your place.</p>
                </div>
              </div>
              <div className="get">
                <div className="n">8</div>
                <div>
                  <h3>60-Day Action Queue</h3>
                  <p>A week-by-week fix list ranked by impact and effort — the fastest path to getting cited.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <span className="section-num">A look inside</span>
            <h2 className="section-h2">This is the depth you&rsquo;ll get.</h2>
            <p className="section-sub">
              Below is an <strong>example</strong> of the Competitor Displacement section. Your report
              will show <em>your</em> actual competitors and platforms, measured from live tests.
            </p>
            <div className="sample">
              <div className="sample-label">Example — yours will show your data</div>
              <div className="sample-inner">
                <div className="st">Section 5 · Full report</div>
                <h4>Competitor Displacement Analysis</h4>
                <div className="cmp">
                  <div>
                    <div className="name">Competitor A</div>
                    <div className="tags">
                      <span className="tag">ChatGPT</span>
                      <span className="tag">Perplexity</span>
                      <span className="tag">Google AI</span>
                    </div>
                  </div>
                  <div className="pill">Cited 9 / 12</div>
                </div>
                <div className="cmp">
                  <div>
                    <div className="name">Competitor B</div>
                    <div className="tags">
                      <span className="tag">ChatGPT</span>
                      <span className="tag">Copilot</span>
                    </div>
                  </div>
                  <div className="pill">Cited 7 / 12</div>
                </div>
                <div className="cmp">
                  <div>
                    <div className="name">Competitor C</div>
                    <div className="tags">
                      <span className="tag">Perplexity</span>
                    </div>
                  </div>
                  <div className="pill">Cited 5 / 12</div>
                </div>
                <div className="cmp">
                  <div>
                    <div className="name">Your brand</div>
                    <div className="tags">
                      <span className="tag">—</span>
                    </div>
                  </div>
                  <div className="pill">Cited 0 / 12</div>
                </div>
              </div>
              <div className="sample-fade"></div>
              <div className="sample-cta">
                <span className="lock">🔒 Unlocked in your full measured report</span>
              </div>
            </div>
            <p className="proof-note">
              Sample shown for illustration. Every figure in your report comes from live tests run
              for your domain.
            </p>
          </div>

          <div className="offer" id="buy">
            <span className="flag">Airspace World 2026 launch rate</span>
            <div className="price-row">
              <span className="price">{reportPrice}</span>
              <span className="was">{standardPrice}</span>
            </div>
            <div className="price-cap">
              Launch price through 30 June · rises to {standardPrice} on 1 July
            </div>
            <a className="btn" href={STRIPE_LINK}>
              Get my full measured report
              <span className="small">All 8 sections · delivered as a PDF to your inbox</span>
            </a>
            <div className="guarantee">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2l7 3v6c0 4.5-3 8.3-7 9-4-0.7-7-4.5-7-9V5l7-3z" stroke="#10B981" strokeWidth="1.6" fill="rgba(16,185,129,.12)" />
                <path d="M9 12l2 2 4-4" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>
                Delivered to your inbox within <strong>1 business day</strong>. If it&rsquo;s not
                useful, tell us within 7 days for a full refund.
              </span>
            </div>
            <p className="micro">
              Secure checkout via Stripe · We&rsquo;ll ask for your website + email to run your report
            </p>
          </div>

          <div className="trust">
            <div className="t">
              <div className="ic">Tested</div>
              <h4>Live AI queries</h4>
              <p>Real prompts run across the platforms your buyers use.</p>
            </div>
            <div className="t">
              <div className="ic">Measured</div>
              <h4>Not estimated</h4>
              <p>Every figure traces to a recorded AI response.</p>
            </div>
            <div className="t">
              <div className="ic">Honest</div>
              <h4>Clearly sourced</h4>
              <p>Measured findings kept separate from assessment.</p>
            </div>
          </div>

          <div className="card">
            <span className="section-num">Going further</span>
            <h2 className="section-h2">Want the strategy, not just the data?</h2>
            <p className="section-sub">
              Start with the measured report. When you&rsquo;re ready to act on it, two options:
            </p>
            <div className="tiers">
              <a className="tier" href={CALENDLY_LINK}>
                <div className="info">
                  <h3>Strategic Baseline + Consult</h3>
                  <p>Your measured baseline, an interactive report, and a strategy call to turn findings into a plan.</p>
                </div>
                <div className="pr">
                  <div className="amt">SGD 2,500</div>
                  <div className="per">one-time</div>
                </div>
              </a>
              <a className="tier" href={CALENDLY_LINK}>
                <div className="info">
                  <h3>Visibility Engine — Monthly Tracking</h3>
                  <p>Ongoing monthly re-measurement to see how your AI visibility moves over time.</p>
                </div>
                <div className="pr">
                  <div className="amt">SGD 4,500</div>
                  <div className="per">per month</div>
                </div>
              </a>
            </div>
          </div>

          <div className="card">
            <span className="section-num">Before you buy</span>
            <h2 className="section-h2">Questions, answered.</h2>
            <div className="faq">
              <details>
                <summary>Is this automated or a real test?</summary>
                <p>Real. We run live queries against the AI platforms your buyers use and record exactly what each returns. The report is built from those recorded responses — not generated guesses.</p>
              </details>
              <details>
                <summary>How fast will I get it?</summary>
                <p>Within 1 business day. After checkout we run your report and email you the PDF. You&rsquo;ll get a confirmation the moment your payment goes through.</p>
              </details>
              <details>
                <summary>What do I need to provide?</summary>
                <p>Just your website URL and email at checkout — that&rsquo;s everything we need to run your report.</p>
              </details>
              <details>
                <summary>How is this different from the free snapshot?</summary>
                <p>The free snapshot is an assessment based on your own inputs. The full report adds four measured sections — real competitor citations, query-by-query coverage, and a prioritised 60-day fix plan — from live AI tests on your domain.</p>
              </details>
              <details>
                <summary>What if it&rsquo;s not useful?</summary>
                <p>Tell us within 7 days and we&rsquo;ll refund you in full. No forms, no friction.</p>
              </details>
            </div>
          </div>

          <div className="card final">
            <h2 className="section-h2">See what AI is really saying about you.</h2>
            <p className="section-sub">
              The launch rate ends 30 June. Get your full measured report today.
            </p>
            <a className="btn" href={STRIPE_LINK}>
              Get my full measured report — {reportPrice}
              <span className="small">All 8 sections · PDF by email within 1 business day</span>
            </a>
          </div>
        </div>
      </div>

      <footer>
        <div className="wrap">
          <div className="brand">Maxifi <span style={{ color: 'var(--unlock-gold)' }}>Digital</span></div>
          <div>AI Visibility Reports · Singapore · Tested. Measured. Honest.</div>
        </div>
      </footer>
    </div>
  );
}

// Scoped CSS — every selector prefixed with `.unlock-page` so this page's
// styles do not leak to SiteHeader or other routes mounted in the same layout.
const UNLOCK_CSS = `
.unlock-page{
  --navy-sub:#152438; --navy-header:#091521;
  --unlock-gold:#C87A2F; --gold-hover:#A8651E; --gold-pale:#FDF1E6; --gold-text:#7a4a10;
  --red:#EF4444; --amber:#F59E0B; --emerald:#10B981;
  --gray-50:#F9FAFB; --gray-100:#F3F4F6; --gray-200:#E5E7EB; --gray-300:#D1D5DB;
  --gray-400:#9CA3AF; --gray-500:#6B7280; --gray-600:#4B5563; --gray-700:#374151;
  --gray-800:#1F2937; --gray-900:#111827;
  --card-shadow:0 24px 48px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.04);

  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  background:var(--navy-sub); color:var(--gray-700); line-height:1.6;
  -webkit-font-smoothing:antialiased;
  min-height:100vh;
}
.unlock-page *{box-sizing:border-box}
.unlock-page h1,.unlock-page h2,.unlock-page h3,.unlock-page h4,.unlock-page p,.unlock-page ul,.unlock-page ol,.unlock-page li,.unlock-page figure,.unlock-page blockquote,.unlock-page dl,.unlock-page dd{margin:0;padding:0}
.unlock-page .wrap{max-width:720px;margin:0 auto;padding:0 20px}
.unlock-page .topbar{background:var(--navy-header)}
.unlock-page .topbar .row{display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.07)}
.unlock-page .brand{font-weight:700;color:#fff;font-size:15px;letter-spacing:0.02em}
.unlock-page .brand span{color:var(--unlock-gold)}
.unlock-page .topline{font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--gray-400)}
.unlock-page .eyebrow{font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--unlock-gold);margin-bottom:14px}
.unlock-page .stage{padding:30px 0 8px}
.unlock-page .card{background:#fff;border-radius:16px;border:1px solid rgba(255,255,255,0.07);padding:32px 36px;margin-bottom:18px;box-shadow:var(--card-shadow)}
.unlock-page .hero-h1{font-size:28px;font-weight:700;color:var(--gray-900);line-height:1.25;margin-bottom:10px}
.unlock-page .hero-h1 .accent{color:var(--unlock-gold)}
.unlock-page .hero-lead{font-size:15px;color:var(--gray-600);line-height:1.6}
.unlock-page .hero-lead strong{color:var(--gray-900);font-weight:700}
.unlock-page .hero-you{margin-top:20px;padding:12px 16px;background:var(--gray-50);border-left:3px solid var(--unlock-gold);border-radius:0 8px 8px 0;font-size:13px;color:var(--gray-600)}
.unlock-page .hero-you b{color:var(--gray-900);font-weight:700}
.unlock-page .section-num{display:inline-block;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--unlock-gold);margin-bottom:8px}
.unlock-page .section-h2{font-size:22px;font-weight:700;color:var(--gray-900);margin-bottom:6px;line-height:1.3}
.unlock-page .section-sub{font-size:14px;color:var(--gray-600);line-height:1.6}
.unlock-page .gets{margin-top:22px;display:grid;gap:0}
.unlock-page .get{display:flex;gap:14px;align-items:flex-start;padding:16px 0;border-top:1px solid var(--gray-200)}
.unlock-page .get:first-child{border-top:none;padding-top:4px}
.unlock-page .get .n{flex:none;width:28px;height:28px;border-radius:7px;background:var(--gold-pale);color:var(--gold-text);font-weight:700;font-size:13px;display:grid;place-items:center}
.unlock-page .get h3{color:var(--gray-900);font-size:15px;font-weight:700;margin-bottom:2px}
.unlock-page .get p{font-size:13.5px;color:var(--gray-600)}
.unlock-page .sample{position:relative;margin-top:20px;border:1px solid var(--gray-200);border-radius:12px;overflow:hidden;background:#fff}
.unlock-page .sample-label{position:absolute;top:13px;left:13px;z-index:3;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--gold-text);background:var(--gold-pale);border:1px solid rgba(200,122,47,0.3);padding:5px 10px;border-radius:6px}
.unlock-page .sample-inner{padding:28px 26px 36px;filter:blur(4px);opacity:.93;user-select:none;pointer-events:none}
.unlock-page .sample-inner .st{font-size:10px;font-weight:700;color:var(--gold-text);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px}
.unlock-page .sample-inner h4{color:var(--gray-900);font-size:20px;font-weight:700;margin-bottom:14px}
.unlock-page .cmp{display:flex;align-items:center;justify-content:space-between;padding:13px 0;border-bottom:1px solid var(--gray-200)}
.unlock-page .cmp .name{font-weight:700;color:var(--gray-900);font-size:15px}
.unlock-page .cmp .tags{display:flex;gap:6px;margin-top:6px}
.unlock-page .cmp .tag{font-size:10px;background:var(--gray-100);color:var(--gray-600);padding:3px 8px;border-radius:5px;font-weight:600}
.unlock-page .cmp .pill{font-size:11px;font-weight:700;color:var(--red);background:#FEE2E2;padding:5px 10px;border-radius:6px}
.unlock-page .sample-fade{position:absolute;left:0;right:0;bottom:0;height:130px;background:linear-gradient(to bottom,rgba(255,255,255,0),#fff)}
.unlock-page .sample-cta{position:absolute;left:0;right:0;bottom:20px;z-index:3;text-align:center}
.unlock-page .sample-cta .lock{font-size:12.5px;color:var(--gray-700);font-weight:600;display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid var(--gray-200);padding:9px 15px;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,.08)}
.unlock-page .proof-note{margin-top:14px;font-size:12.5px;color:var(--gray-500)}
.unlock-page .offer{background:#fff;border-radius:16px;padding:34px 36px;margin-bottom:18px;box-shadow:var(--card-shadow);border-top:4px solid var(--unlock-gold)}
.unlock-page .offer .flag{display:inline-block;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--unlock-gold);background:var(--gold-pale);padding:5px 10px;border-radius:6px;margin-bottom:16px}
.unlock-page .price-row{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:4px}
.unlock-page .price{font-size:42px;font-weight:800;color:var(--gray-900);letter-spacing:-0.02em;line-height:1}
.unlock-page .was{font-size:16px;color:var(--gray-400);text-decoration:line-through;font-weight:600}
.unlock-page .price-cap{font-size:13px;color:var(--gold-text);font-weight:600;margin-bottom:20px}
.unlock-page .btn{display:block;width:100%;text-align:center;background:var(--unlock-gold);color:#fff;font-weight:700;font-size:15.5px;padding:16px 22px;border-radius:10px;text-decoration:none;border:none;cursor:pointer;transition:background .15s,transform .1s}
.unlock-page .btn:hover{background:var(--gold-hover);transform:translateY(-1px)}
.unlock-page .btn .small{display:block;font-size:11.5px;font-weight:500;opacity:.9;margin-top:3px}
.unlock-page .guarantee{margin-top:16px;display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--gray-600)}
.unlock-page .guarantee svg{flex:none;margin-top:2px}
.unlock-page .guarantee strong{color:var(--gray-900)}
.unlock-page .micro{margin-top:13px;font-size:11.5px;color:var(--gray-400);text-align:center}
.unlock-page .trust{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}
.unlock-page .trust .t{background:#fff;border-radius:12px;padding:18px 16px;text-align:center;box-shadow:var(--card-shadow)}
.unlock-page .trust .t .ic{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--unlock-gold);margin-bottom:6px}
.unlock-page .trust .t h4{color:var(--gray-900);font-size:14px;font-weight:700;margin-bottom:3px}
.unlock-page .trust .t p{font-size:12px;color:var(--gray-600);line-height:1.5}
.unlock-page .tiers{margin-top:20px;display:grid;gap:12px}
.unlock-page .tier{display:flex;justify-content:space-between;align-items:center;gap:16px;border:1px solid var(--gray-200);border-radius:12px;padding:18px 20px;text-decoration:none;transition:border-color .15s,background .15s}
.unlock-page .tier:hover{border-color:var(--unlock-gold);background:var(--gold-pale)}
.unlock-page .tier .info h3{color:var(--gray-900);font-size:15px;font-weight:700;margin-bottom:2px}
.unlock-page .tier .info p{font-size:13px;color:var(--gray-600)}
.unlock-page .tier .pr{flex:none;text-align:right}
.unlock-page .tier .pr .amt{color:var(--gold-text);font-weight:700;font-size:16px}
.unlock-page .tier .pr .per{font-size:11px;color:var(--gray-500)}
.unlock-page .faq{margin-top:6px}
.unlock-page details{border-bottom:1px solid var(--gray-200)}
.unlock-page summary{cursor:pointer;list-style:none;padding:16px 0;color:var(--gray-900);font-weight:600;font-size:14.5px;display:flex;justify-content:space-between;align-items:center;gap:16px}
.unlock-page summary::-webkit-details-marker{display:none}
.unlock-page summary::after{content:"+";color:var(--unlock-gold);font-size:20px;font-weight:400;line-height:1;flex:none}
.unlock-page details[open] summary::after{content:"\\2013"}
.unlock-page details p{padding:0 0 16px;font-size:13.5px;color:var(--gray-600);line-height:1.6}
.unlock-page .final{text-align:center}
.unlock-page .final .section-h2{margin-bottom:8px}
.unlock-page .final .section-sub{margin:0 auto 22px;max-width:480px}
.unlock-page .final .btn{max-width:420px;margin:0 auto}
.unlock-page footer{padding:26px 0 36px;text-align:center;font-size:11.5px;color:var(--gray-500)}
.unlock-page footer .brand{font-size:13px;margin-bottom:6px;color:#fff}
@media(max-width:560px){
  .unlock-page .card,.unlock-page .offer{padding:24px 22px}
  .unlock-page .trust{grid-template-columns:1fr}
  .unlock-page .tier{flex-direction:column;align-items:flex-start}
  .unlock-page .tier .pr{text-align:left}
}
`;
