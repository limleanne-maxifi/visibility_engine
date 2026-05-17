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
  'Executive / Founder',
  'Marketing & Communications',
  'Sales & Business Development',
  'Operations & Strategy',
  'Technology & Digital',
  'Finance',
  'Product & Innovation',
  'Other',
];

const INDUSTRIES = [
  // Technology
  'AI & Machine Learning',
  'B2B SaaS / Enterprise Software',
  'Cloud Infrastructure & DevOps',
  'Cybersecurity',
  'Marketing Technology',
  // Financial Services
  'Accounting & Finance',
  'Financial Services & Banking',
  'Fintech / Financial Technology',
  'Insurance',
  // Professional Services
  'Consulting & Advisory',
  'Human Resources & Recruitment',
  'Legal & Legal Services',
  'Professional Services',
  // Healthcare & Life Sciences
  'Healthcare & Life Sciences',
  'Healthcare Technology / Digital Health',
  'Pharmaceuticals & Biotech',
  // Industrial & Infrastructure
  'Architecture, Engineering & Construction',
  'Energy & Utilities',
  'Logistics & Supply Chain',
  'Manufacturing & Industrial',
  'Telecommunications',
  // Government & Regulated Sectors
  'Aviation, ATC & Aerospace',
  'Defense & Government Systems',
  // Consumer & Media
  'Education & Training',
  'Hospitality & Travel',
  'Media & Publishing',
  'Real Estate & Property',
  'Retail & E-commerce',
  'Other',
];

const inputBase =
  'w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors bg-white';
const inputNormal = 'border-gray-200 focus:border-[#534AB7]';
const inputError = 'border-red-400 focus:border-red-500';

export default function Step2Context({ data, onChange, onNext, onBack, errors }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl text-gray-900 mb-1">About you</h1>
      <p className="text-sm text-gray-500 mb-6">
        This helps us tailor your action plan to your specific situation.
      </p>

      <div className="space-y-4">
        {/* Industry */}
        <div>
          <label htmlFor="industry" className="block text-[17px] text-gray-700 mb-1">
            Industry <span className="text-red-500">*</span>
          </label>
          <select
            id="industry"
            value={data.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
            className={`${inputBase} ${errors.industry ? inputError : inputNormal}`}
          >
            <option value="">Select your industry…</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          {errors.industry && (
            <p className="mt-1 text-xs text-red-500">{errors.industry}</p>
          )}
        </div>

        {/* Role */}
        <div>
          <label htmlFor="occupation" className="block text-[17px] text-gray-700 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            id="occupation"
            value={data.occupation}
            onChange={(e) => onChange({ occupation: e.target.value as Occupation })}
            className={`${inputBase} ${errors.occupation ? inputError : inputNormal}`}
          >
            <option value="">Select your role…</option>
            {OCCUPATIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          {errors.occupation && (
            <p className="mt-1 text-xs text-red-500">{errors.occupation}</p>
          )}
        </div>

        {/* Company */}
        <div>
          <label htmlFor="company" className="block text-[17px] text-gray-700 mb-1">
            Company or organisation <span className="text-red-500">*</span>
          </label>
          <input
            id="company"
            type="text"
            value={data.company}
            onChange={(e) => onChange({ company: e.target.value })}
            placeholder="Your company name"
            className={`${inputBase} ${errors.company ? inputError : inputNormal}`}
          />
          {errors.company ? (
            <p className="mt-1 text-xs text-red-500">{errors.company}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">
              Needed for brand citation lookup across AI platforms.
            </p>
          )}
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
