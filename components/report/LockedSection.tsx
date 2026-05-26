interface Props {
  sectionNumber: number;
  title: string;
  unlockUrl: string;
  reportPrice: string;
  /** Placeholder rows to render blurred — purely visual */
  previewRows: React.ReactNode;
}

export default function LockedSection({
  sectionNumber,
  title,
  unlockUrl,
  reportPrice,
  previewRows,
}: Props) {
  return (
    <section className="mb-6" id={`section-${sectionNumber}`}>
      {/* Section header — visible, not blurred */}
      <div className="bg-white rounded-t-2xl px-6 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: '#FDF1E6', color: '#C87A2F' }}
            >
              {sectionNumber}
            </span>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
          </div>
          <span
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{ background: '#FDF1E6', color: '#C87A2F' }}
          >
            <svg width="9" height="10" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                clipRule="evenodd"
              />
            </svg>
            Full report
          </span>
        </div>
      </div>

      {/* Blurred preview */}
      <div className="relative bg-white rounded-b-2xl overflow-hidden">
        {/* Preview content — blurred */}
        <div
          className="px-6 py-5 select-none pointer-events-none"
          style={{ filter: 'blur(5px)', opacity: 0.6 }}
          aria-hidden="true"
        >
          {previewRows}
        </div>

        {/* Gradient fade + unlock overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 35%, rgba(255,255,255,0.97) 65%)',
          }}
        >
          <div className="mt-auto mb-8 flex flex-col items-center gap-3 px-6 text-center">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-full"
              style={{ background: '#FDF1E6' }}
            >
              <svg width="14" height="16" viewBox="0 0 20 20" fill="#C87A2F" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-800">
              This section is in your full report
            </p>
            <a
              href={unlockUrl}
              className="inline-flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-lg transition-colors bg-brand-gold hover:bg-brand-gold-hover"
            >
              Full measured report (all 8 sections) — emailed as PDF — {reportPrice}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
