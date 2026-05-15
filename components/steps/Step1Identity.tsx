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
      <h1 className="text-2xl text-gray-900 mb-1">Let&apos;s get started</h1>
      <p className="text-sm text-gray-500 mb-6">
        Takes about 2 minutes. You&apos;ll get a free personalised action plan straight away — no sales call required.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-[17px] text-gray-700 mb-1">
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
          <label htmlFor="email" className="block text-[17px] text-gray-700 mb-1">
            Business email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="off"
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
          <label htmlFor="websiteUrl" className="block text-[17px] text-gray-700 mb-1">
            Website URL <span className="text-red-500">*</span>
          </label>
          <input
            id="websiteUrl"
            type="text"
            autoComplete="url"
            value={data.websiteUrl}
            onChange={(e) => onChange({ websiteUrl: e.target.value })}
            placeholder="yourwebsite.com"
            className={`w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors ${
              errors.websiteUrl
                ? 'border-red-400 focus:border-red-500'
                : 'border-gray-200 focus:border-[#534AB7]'
            }`}
          />
          {errors.websiteUrl ? (
            <p className="mt-1 text-xs text-red-500">{errors.websiteUrl}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">Needed for your site-level AEO audit.</p>
          )}
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
