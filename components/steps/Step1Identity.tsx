'use client';

import { FormData } from '@/lib/types';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
  errors: Partial<Record<keyof FormData, string>>;
}

export default function Step1Identity({ data, onChange, onNext, errors }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Let&apos;s get started</h1>
      <p className="text-sm text-gray-500 mb-6">
        Takes about 2 minutes. You&apos;ll get a free personalised action plan straight away — no sales call required.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="Your first name"
            className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors ${
              errors.firstName
                ? 'border-red-400 focus:border-red-500'
                : 'border-gray-200 focus:border-[#534AB7]'
            }`}
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Business email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="you@yourcompany.com"
            className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors ${
              errors.email
                ? 'border-red-400 focus:border-red-500'
                : 'border-gray-200 focus:border-[#534AB7]'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            Website URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="website"
            type="text"
            autoComplete="url"
            value={data.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="yourwebsite.com"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#534AB7] transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 w-full py-3 px-6 bg-[#534AB7] hover:bg-[#4640a0] text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Continue →
      </button>
    </form>
  );
}
