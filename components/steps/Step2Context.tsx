'use client';

import { FormData, Occupation, BusinessModelOverride, PharmaRole, DefenseChannel } from '@/lib/types';
import { shouldShowPharmaRole, shouldShowDefenseChannel, isDefenseIndustry } from '@/lib/industryConstants';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Partial<Record<keyof FormData, string>>;
}

const OCCUPATIONS: Occupation[] = [
  'Executive / Founder',
  'Head of / VP',
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
const inputNormal = 'border-gray-200 focus:border-[#C87A2F]';
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

        {/* Phase 2: Pharma Role (conditional) */}
        {shouldShowPharmaRole(data.industry) && (
          <div>
            <label htmlFor="pharma-role" className="block text-[17px] text-gray-700 mb-1">
              Your role in pharma/biotech{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              id="pharma-role"
              value={data.pharmaRole ?? ''}
              onChange={(e) => onChange({ pharmaRole: e.target.value as PharmaRole })}
              className={`${inputBase} ${inputNormal}`}
            >
              <option value="">Select role…</option>
              <option value="Drug Developer">Drug Developer</option>
              <option value="CRO / CMO">CRO / CMO</option>
              <option value="Biotech Platform">Biotech Platform</option>
              <option value="Other">Other</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Helps tailor guidance to your specific regulatory and market context.
            </p>
          </div>
        )}

        {/* Phase 2: Defense/Aerospace Channel (conditional) */}
        {shouldShowDefenseChannel(data.industry) && (
          <div>
            <label htmlFor="defense-channel" className="block text-[17px] text-gray-700 mb-1">
              Primary procurement channel{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              id="defense-channel"
              value={data.defenseChannel ?? ''}
              onChange={(e) => onChange({ defenseChannel: e.target.value as DefenseChannel })}
              className={`${inputBase} ${inputNormal}`}
            >
              <option value="">Select channel…</option>
              <option value="Military">Military / Government</option>
              <option value="Commercial Aviation">Commercial Aviation</option>
              {isDefenseIndustry(data.industry) && (
                <option value="Space / Satellite">Space / Satellite</option>
              )}
              <option value="Mixed">Mixed</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Different channels have different export controls and visibility strategies.
            </p>
          </div>
        )}
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
          className="flex-1 py-[13px] px-6 bg-[#C87A2F] hover:bg-[#A8651E] text-white text-sm font-bold rounded-lg transition-colors"
        >
          Continue →
        </button>
      </div>
    </form>
  );
}
