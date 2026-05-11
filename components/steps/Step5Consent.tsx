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

export default function Step5Consent({ data, onChange, onSubmit, onBack, errors, isLoading }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-10 h-10 border-4 border-[#EEEDFE] border-t-[#534AB7] rounded-full animate-spin mb-4" />
        <p className="text-lg font-semibold text-gray-900">Hang tight — we&apos;re building your personalised plan…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        Almost there, {data.firstName || 'there'} — you&apos;re 10 seconds away
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        We&apos;ll email your personalised AEO action plan to you straight away — free, no catch.
      </p>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span className="text-gray-400">Name</span>
          <span className="font-medium text-gray-900">{data.firstName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Email</span>
          <span className="font-medium text-gray-900">{data.email}</span>
        </div>
        {data.company && (
          <div className="flex justify-between">
            <span className="text-gray-400">Company</span>
            <span className="font-medium text-gray-900">{data.company}</span>
          </div>
        )}
      </div>

      <label className="flex gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={data.consent}
          onChange={(e) => onChange({ consent: e.target.checked })}
          className="mt-0.5 flex-shrink-0 w-4 h-4 accent-[#534AB7]"
        />
        <span className="text-sm text-gray-600">
          I agree to receive my free AEO action plan and occasional insights from Maxifi Digital.
          Unsubscribe anytime.
        </span>
      </label>
      {errors.consent && (
        <p className="mt-1 text-xs text-red-500">{errors.consent}</p>
      )}

      <div className="mt-6 flex gap-3">
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
          className="flex-1 py-3 px-6 bg-[#534AB7] hover:bg-[#4640a0] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Generate my free AEO plan →
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
