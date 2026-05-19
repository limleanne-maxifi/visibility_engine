import { NextRequest, NextResponse } from 'next/server';
import { getAllLeads } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const leads = await getAllLeads();
    
    const csvHeaders = [
      'id',
      'created_at',
      'first_name',
      'email',
      'occupation',
      'industry',
      'company_name',
      'website',
      'awareness',
      'platform',
      'challenge',
      'outcome',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'session_id',
    ];

    const csvRows = leads.map((lead) => [
      lead.id,
      lead.created_at,
      lead.first_name,
      lead.email,
      lead.occupation,
      lead.industry,
      lead.company_name || '',
      lead.website || '',
      lead.awareness,
      lead.platform,
      lead.challenge,
      lead.outcome,
      lead.utm_source || '',
      lead.utm_medium || '',
      lead.utm_campaign || '',
      lead.session_id || '',
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      ),
    ].join('\n');

    const date = new Date().toISOString().split('T')[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="aeo-leads-${date}.csv"`,
      },
    });
  } catch (error) {
    console.error('[leads] Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}