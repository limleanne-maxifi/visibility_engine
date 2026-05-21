import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import type { AeoLeadRow } from '@/lib/supabase'
import RequestForm from './RequestForm'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { lead_id?: string }
}

export default async function ReportRequestPage({ searchParams }: Props) {
  const { lead_id } = searchParams

  if (!lead_id) notFound()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: lead, error } = await supabase
    .from('aeo_leads')
    .select('*')
    .eq('id', lead_id)
    .single<AeoLeadRow>()

  if (error || !lead) notFound()

  const competitorList = lead.competitors
    ? lead.competitors.split(/[,;]/).map(c => c.trim()).filter(Boolean).slice(0, 3)
    : []

  const topPriorities = (lead.plan_steps ?? []).slice(0, 3).map(s => s.title)

  return (
    <main className="min-h-screen bg-[#F7F5F0] py-12 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <p className="text-sm font-semibold text-[#BA7517] uppercase tracking-wide mb-2">
            AI Visibility Report
          </p>
          <h1 className="text-3xl font-bold text-[#042C53] mb-3">
            Get the full picture
          </h1>
          <p className="text-[#042C53]/70 text-base">
            One report. Every fix in order of impact, plus the exact sources AI
            is drawing on about you — across ChatGPT, Claude, Gemini, Perplexity
            and Copilot.
          </p>
        </div>

        {topPriorities.length > 0 && (
          <div className="bg-white border border-[#042C53]/10 rounded-xl p-5 mb-6">
            <p className="text-sm font-semibold text-[#042C53] mb-3">
              Based on your snapshot, your report will address:
            </p>
            <ul className="space-y-2">
              {topPriorities.map((priority, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#042C53]/80">
                  <span className="mt-0.5 text-red-500 font-bold">✗</span>
                  <span>{priority}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between bg-[#042C53] text-white rounded-xl px-5 py-4 mb-6">
          <div>
            <p className="text-xl font-bold">SGD 2,500</p>
            <p className="text-white/70 text-sm">One-off. No subscription.</p>
          </div>
          <div className="text-right text-sm text-white/80">
            <p>Delivered within 5 business days</p>
            <p>Reviewed by a Maxifi analyst</p>
          </div>
        </div>

        <RequestForm lead={lead} competitorList={competitorList} />

      </div>
    </main>
  )
}
