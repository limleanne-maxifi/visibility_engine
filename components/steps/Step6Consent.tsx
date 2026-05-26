'use client';

import { FormData } from '@/lib/types';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  errors: Partial<Record<keyof FormData, string>>;
  isLoading: boolean;
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/(^|[\s-])(\w)/g, (_, sep, char) => sep + char.toUpperCase());
}

const FREE_SECTIONS = [
  'Current citation snapshot',
  'Failure mode diagnosis',
  'Platform visibility overview',
  'Industry benchmark comparison',
];

const LOCKED_SECTIONS = [
  'Competitor displacement analysis',
  'Positioning gap analysis',
  'Target query gap analysis',
  '60-day prioritised action queue',
];

export default function Step6Consent({ data, onChange, onSubmit, onBack, errors, isLoading }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-10 h-10 border-4 border-[#FDF1E6] border-t-[#C87A2F] rounded-full animate-spin mb-4" />
        <p className="text-lg text-gray-900">
          Hang tight — we&apos;re building your personalised snapshot…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl text-gray-900 mb-1">
        Almost there, {data.firstName ? toTitleCase(data.firstName) : 'there'} — you&apos;re 10 seconds away
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        We&apos;ll email your personalised AI Visibility action plan to you straight away — free, no catch.
      </p>

      {/* Summary row */}
      <div className="bg-gray-50 rounded-[10px] py-3.5 px-4 mb-[18px] space-y-1 text-sm">
        <div className="flex justify-between py-[3px]">
          <span className="text-gray-400">Name</span>
          <span className="font-semibold text-gray-900">{data.firstName}</span>
        </div>
        <div className="flex justify-between py-[3px]">
          <span className="text-gray-400">Email</span>
          <span className="font-semibold text-gray-900">{data.email}</span>
        </div>
        {data.company && (
          <div className="flex justify-between py-[3px]">
            <span className="text-gray-400">Company</span>
            <span className="font-semibold text-gray-900">{data.company}</span>
          </div>
        )}
      </div>

      {/* Plan preview */}
      <div
        className="mb-[18px] rounded-xl p-4"
        style={{
          border: '1px solid rgba(200,122,47,0.22)',
          background: 'rgba(200,122,47,0.04)',
        }}
      >

        {/* Free section */}
        <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2.5 inline-flex items-center gap-1" style={{ letterSpacing: '0.14em' }}>
          <svg width="10" height="9" viewBox="0 0 10 8" fill="none" aria-hidden="true">
            <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Included free
        </p>
        <ul className="space-y-[7px]">
          {FREE_SECTIONS.map((section) => (
            <li key={section} className="flex items-center gap-2.5 text-sm text-gray-700">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                  <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {section}
            </li>
          ))}
        </ul>

        <hr className="my-3.5" style={{ border: 'none', borderTop: '1px solid rgba(200,122,47,0.15)' }} />

        {/* Locked section */}
        <p className="text-[10px] font-bold text-[#C87A2F] uppercase mb-2.5 inline-flex items-center gap-1.5" style={{ letterSpacing: '0.14em' }}>
          <svg className="w-2.5 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
          Unlocked in full report
        </p>
        <ul className="space-y-[7px]">
          {LOCKED_SECTIONS.map((section) => (
            <li key={section} className="flex items-center gap-2.5 text-sm text-gray-400">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-2 h-2.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
              </span>
              {section}
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-400 mt-2.5">
          Unlock the full report after your free snapshot is delivered.
        </p>

      </div>

      {/* Consent checkbox */}
      <label className="flex gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={data.consent}
          onChange={(e) => onChange({ consent: e.target.checked })}
          className="mt-0.5 flex-shrink-0 w-[15px] h-[15px]"
          style={{ accentColor: '#C87A2F' }}
        />
        <span className="text-sm text-gray-600 leading-snug">
          I agree to receive my free AI Visibility action plan and occasional insights from Maxifi Digital.
          Unsubscribe anytime.{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-[#C87A2F] hover:text-[#A8651E]"
          >
            Privacy policy
          </a>
          .
        </span>
      </label>
      {errors.consent && (
        <p className="mt-1 text-xs text-red-500">{errors.consent}</p>
      )}

      <div className="mt-6 flex gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 px-6 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={!data.consent}
          className="flex-1 py-3 px-6 bg-[#C87A2F] hover:bg-[#A8651E] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Generate my free AI Visibility Snapshot →
        </button>
      </div>

      {data.email && (
        <p className="mt-3 text-center text-xs text-gray-400">
          Your plan will also be emailed to {data.email}
        </p>
      )}
    </form>
  );
}
