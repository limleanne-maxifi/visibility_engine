import type { Metadata } from 'next';
import ReportPage from '@/components/report/ReportPage';
import { mockReportFree, mockReportPaid } from '@/data/fixtures/report_mock';
import { getLeadByToken } from '@/lib/supabase';
import type { ReportData } from '@/lib/reportTypes';

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string }>;
}

async function getReport(token: string, paidOverride: boolean): Promise<ReportData | null> {
  // Dev preview tokens bypass Supabase
  if (token === 'preview-free') return mockReportFree;
  if (token === 'preview-paid') return mockReportPaid;
  if (paidOverride && token === 'preview-paid') return mockReportPaid;

  try {
    const lead = await getLeadByToken(token);
    if (!lead) return null;

    // If report_data is stored, return it (with paid state reflecting database)
    if (lead.report_data) {
      const reportData = lead.report_data as ReportData;
      // Override the paid flag from DB so paid unlocks reflect Stripe state
      reportData.meta.paid = lead.paid;
      return reportData;
    }
  } catch (err) {
    console.error('[r/token] Supabase lookup failed:', err);
    return null;
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  return {
    title: `AI Visibility Report · Maxifi Digital`,
    robots: { index: false, follow: false },
  };
}

export default async function ReportRoute({ params, searchParams }: Props) {
  const { token } = await params;
  const { paid }  = await searchParams;
  const paidOverride = paid === '1' || paid === 'true';

  const data = await getReport(token, paidOverride);

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
