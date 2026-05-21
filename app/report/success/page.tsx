interface Props {
  searchParams: { email?: string; name?: string }
}

export default function ReportSuccessPage({ searchParams }: Props) {
  const name  = searchParams.name  ? decodeURIComponent(searchParams.name)  : null
  const email = searchParams.email ? decodeURIComponent(searchParams.email) : null
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL ?? 'https://lunacal.ai/maxifidigital/'

  return (
    <main className="min-h-screen bg-[#F7F5F0] flex items-center justify-center py-16 px-4">
      <div className="max-w-lg w-full text-center">

        <div className="w-16 h-16 rounded-full bg-[#1D9E75]/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#1D9E75]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[#042C53] mb-2">
          {name ? `Got it, ${name}.` : 'Request received.'}
        </h1>
        <p className="text-[#042C53]/70 text-base mb-8">
          Your AI Visibility Report request is in.
        </p>

        <div className="bg-white rounded-xl border border-[#042C53]/10 p-6 text-left mb-6 space-y-4">
          <p className="text-sm font-semibold text-[#042C53] uppercase tracking-wide">What happens next</p>
          <Step n={1} text={`We'll send you an invoice for SGD 2,500 within 24 hours${email ? ` to ${email}` : ''}.`} />
          <Step n={2} text="On payment, a Maxifi analyst runs your full cross-LLM analysis across ChatGPT, Claude, Gemini, Perplexity and Copilot." />
          <Step n={3} text="We benchmark you against the competitors you named and build a prioritised roadmap." />
          <Step n={4} text={`Your board-ready report is delivered to ${email ?? 'your email'} within 5 business days.`} />
        </div>

        <div className="bg-[#042C53]/5 rounded-xl p-5 text-left">
          <p className="text-sm font-semibold text-[#042C53] mb-1">Want to discuss your results live?</p>
          <p className="text-sm text-[#042C53]/70 mb-3">
            Book a 30-minute Visibility Strategy Call. We'll walk through your report
            together and map the highest-impact next steps.
          </p>
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
            className="inline-block text-sm font-semibold text-[#BA7517] hover:text-[#9a6012] transition-colors">
            Book a strategy call →
          </a>
        </div>

      </div>
    </main>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#BA7517] text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <p className="text-sm text-[#042C53]/80">{text}</p>
    </div>
  )
}
