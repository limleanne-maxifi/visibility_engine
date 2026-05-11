'use client';

import { FormData, Occupation } from '@/lib/types';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Partial<Record<keyof FormData, string>>;
}

const OCCUPATIONS: Occupation[] = [
  'Individual / Personal brand',
  'Business owner',
  'Organisation leader',
  'Conference speaker',
  'Sales professional',
  'Conference delegate',
  'Independent consultant',
  'Academic or researcher',
  'Coach or trainer',
  'Other',
];

export default function Step2Context({ data, onChange, onNext, onBack, errors }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">About you</h1>
      <p className="text-sm text-gray-500 mb-6">
        This helps us tailor your action plan to your specific situation.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
            Occupation <span className="text-red-500">*</span>
          </label>
          <select
            id="occupation"
            value={data.occupation}
            onChange={(e) => onChange({ occupation: e.target.value as Occupation })}
            className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors bg-white ${
              errors.occupation
                ? 'border-red-400 focus:border-red-500'
                : 'border-gray-200 focus:border-[#534AB7]'
            }`}
          >
            <option value="">Select your occupation…</option>
            {OCCUPATIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          {errors.occupation && (
            <p className="mt-1 text-xs text-red-500">{errors.occupation}</p>
          )}
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
            Industry <span className="text-red-500">*</span>
          </label>
          <input
            id="industry"
            type="text"
            value={data.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
            placeholder="e.g. Marketing, Finance, Healthcare…"
            className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors ${
              errors.industry
                ? 'border-red-400 focus:border-red-500'
                : 'border-gray-200 focus:border-[#534AB7]'
            }`}
          />
          {errors.industry && (
            <p className="mt-1 text-xs text-red-500">{errors.industry}</p>
          )}
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
            Company or organisation <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="company"
            type="text"
            value={data.company}
            onChange={(e) => onChange({ company: e.target.value })}
            placeholder="Your company name"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#534AB7] transition-colors"
          />
        </div>
      </div>

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
          className="flex-1 py-3 px-6 bg-[#534AB7] hover:bg-[#4640a0] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Continue →
        </button>
      </div>
    </form>
  );
}
