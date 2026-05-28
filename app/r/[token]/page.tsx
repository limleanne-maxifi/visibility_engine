import type { Metadata } from 'next';
import ReportPage from '@/components/report/ReportPage';
import { mockReportFree, mockReportPaid } from '@/data/fixtures/report_mock';
import { getLeadByToken } from '@/lib/supabase';
import { buildReportFromLead } from '@/lib/buildTeaserReport';
import type { ReportData } from '@/lib/reportTypes';
import { getReportPrice } from '@/lib/pricing';

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string }>;
}

function getEnv() {
  // Strip trailing slashes — env values often arrive with one, which produces
  // double-slash URLs on concat.
  const baseUrl     = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://visibilityview.netlify.app').replace(/\/+$/, '');
  const unlockBase  = `${baseUrl}/report/unlock`;
  const calendlyUrl = process.env.CALENDLY_URL ?? 'https://lunacal.ai/maxifidigital/';
  const reportPrice = process.env.REPORT_PRICE || getReportPrice();
  return { unlockBase, calendlyUrl, reportPrice };
}

async function getReport(token: string): Promise<ReportData | null> {
  // Dev preview tokens — bypass Supabase entirely
  if (token === 'preview-free') return mockReportFree;
  if (token === 'preview-paid') return mockReportPaid;

  let lead;
  try {
    lead = await getLeadByToken(token);
  } catch (err) {
    console.error('[r/token] Supabase lookup failed:', err);
    return null;
  }

  if (!lead) return null;

  const { unlockBase, calendlyUrl, reportPrice } = getEnv();
  const unlockUrl = `${unlockBase}?token=${token}`;

  if (lead.paid && lead.report_data) {
    // Paid: serve the analyst-populated report_data (contains real S5–S8).
    // Override paid flag from DB — it's the authoritative source.
    const reportData = lead.report_data as ReportData;
    reportData.meta.paid = true;
    // Apply current env price in case stored value is empty (stale or missing).
    reportData.reportPrice = reportData.reportPrice || reportPrice;
    return reportData;
  }

  // Free: always rebuild live from stored lead fields so any code fixes
  // take effect immediately for all existing tokens.
  return buildReportFromLead(lead, reportPrice, unlockUrl, calendlyUrl);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await params; // satisfy Next.js async params contract
  return {
    title: `AI Visibility Report · Maxifi Digital`,
    robots: { index: false, follow: false },
  };
}

export default async function ReportRoute({ params, searchParams }: Props) {
  const { token } = await params;
  await searchParams; // retained for future use

  const data = await getReport(token);

  if (!data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--navy-sub)' }}
      >
        <div className="text-center">
          <p className="text-sm font-semibold text-white/60 mb-2">Report not found</p>
          <p className="text-xs text-white/30">
            Token <code className="text-white/40">{token}</code> doesn&rsquo;t match any report.
          </p>
        </div>
      </div>
    );
  }

  return <ReportPage data={data} />;
}
