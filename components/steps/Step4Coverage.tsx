'use client';

import { FormData, QueryCoverage, PlatformConsistency } from '@/lib/types';
import ChoiceCard from '@/components/ChoiceCard';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Partial<Record<keyof FormData, string>>;
}

const QUERY_COVERAGE_OPTIONS: QueryCoverage[] = [
  "I appear for most category and topic queries I've tested",
  'I appear for some queries but miss many category searches',
  'I only appear when my exact brand/company name is searched',
  "I haven't tested multiple query types",
];

const PLATFORM_CONSISTENCY_OPTIONS: PlatformConsistency[] = [
  'Yes — I appear consistently across all major AI platforms',
  'Yes — but results vary significantly by platform',
  "I've only checked one platform",
  "No — I haven't tested across platforms",
];

const PLATFORM_OPTIONS = [
  'ChatGPT',
  'Google AI Overviews',
  'Perplexity',
  'Microsoft Copilot',
  'Claude',
  'Gemini',
  'Other',
];

export default function Step4Coverage({ data, onChange, onNext, onBack, errors }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const togglePlatform = (value: string) => {
    const current = [...data.platforms];
    const idx = current.findIndex((p) => p.value === value);

    if (idx === -1) {
      // Unselected → primary (if no primary exists), else secondary
      const hasPrimary = current.some((p) => p.priority === 'primary');
      onChange({
        platforms: [...current, { value, priority: hasPrimary ? 'secondary' : 'primary' }],
      });
    } else if (current[idx].priority === 'primary') {
      // Primary → secondary
      const updated = [...current];
      updated[idx] = { value, priority: 'secondary' };
      onChange({ platforms: updated });
    } else {
      // Secondary → deselect
      onChange({ platforms: current.filter((p) => p.value !== value) });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl text-gray-900 mb-6">Where you appear across queries and platforms</h1>

      {/* Signal 3 — Query coverage */}
      <fieldset className="mb-6">
        <legend className="text-[17px] text-gray-700 mb-3">
          Beyond your brand name, how broadly do you appear for category or topic queries?{' '}
          <span className="text-red-500">*</span>
        </legend>
        <div className="space-y-2">
          {QUERY_COVERAGE_OPTIONS.map((option) => (
            <ChoiceCard
              key={option}
              label={option}
              selected={data.queryCoverage === option}
              onSelect={() => onChange({ queryCoverage: option })}
            />
          ))}
        </div>
        {errors.queryCoverage && (
          <p className="mt-1 text-xs text-red-500">{errors.queryCoverage}</p>
        )}
      </fieldset>

      {/* Signal 4 — Cross-platform consistency */}
      <fieldset className="mb-6">
        <legend className="text-[17px] text-gray-700 mb-3">
          Have you checked your visibility across multiple AI platforms?{' '}
          <span className="text-red-500">*</span>
        </legend>
        <div className="space-y-2">
          {PLATFORM_CONSISTENCY_OPTIONS.map((option) => (
            <ChoiceCard
              key={option}
              label={option}
              selected={data.platformConsistency === option}
              onSelect={() => onChange({ platformConsistency: option })}
            />
          ))}
        </div>
        {errors.platformConsistency && (
          <p className="mt-1 text-xs text-red-500">{errors.platformConsistency}</p>
        )}
      </fieldset>

      {/* Platform priorities */}
      <fieldset>
        <legend className="text-[17px] text-gray-700 mb-1">
          Which AI platforms matter to you?{' '}
          <span className="text-red-500">*</span>
        </legend>
        <p className="text-xs text-gray-400 mb-3">
          Click once for PRIMARY, again for 2nd, again to deselect.
        </p>
        <div className="space-y-2">
          {PLATFORM_OPTIONS.map((platform) => {
            const entry = data.platforms.find((p) => p.value === platform);
            const rank = entry ? data.platforms.indexOf(entry) + 1 : null;
            const isSelected = !!entry;
            const isDisabled = !isSelected && data.platforms.length >= 2;

            return (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                disabled={isDisabled}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150 ${
                  isSelected
                    ? 'border-[#C87A2F] bg-[#FDF1E6] text-[#7a4a10] font-medium'
                    : isDisabled
                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex-shrink-0 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-[#C87A2F] bg-[#C87A2F]'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <svg width="8" height="7" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {platform}
                  </span>
                  {isSelected && (
                    <span className="text-[11px] font-bold text-[#C87A2F]">
                      #{rank}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {errors.platforms && (
          <p className="mt-1 text-xs text-red-500">{errors.platforms}</p>
        )}
      </fieldset>

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
          className="flex-1 py-3 px-6 bg-[#C87A2F] hover:bg-[#A8651E] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Continue →
        </button>
      </div>
    </form>
  );
}
