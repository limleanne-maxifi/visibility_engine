import type { Metadata } from 'next';
import ReportPage from '@/components/report/ReportPage';
import { mockReportFree, mockReportPaid } from '@/data/fixtures/report_mock';
import { getReportByToken } from '@/lib/supabase';
import type { ReportData } from '@/lib/reportTypes';

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paid?: string }>;
}

async function getReport(token: string): Promise<ReportData | null> {
  // Preview tokens bypass Supabase and return fixtures directly
  if (token === 'preview-free') return mockReportFree;
  if (token === 'preview-paid') return mockReportPaid;
  return getReportByToken(token);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  return {
    title: `AI Visibility Report — ${token} · Maxifi Digital`,
    robots: { index: false, follow: false },
  };
}

export default async function ReportRoute({ params, searchParams }: Props) {
  const { token } = await params;
  await searchParams; // reserved for future query params

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
