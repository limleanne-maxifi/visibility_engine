'use client';

import { CompetitorAiPresence as CompAiPresence } from '@/lib/types';

interface Props {
  value: CompAiPresence | '';
  onChange: (value: CompAiPresence) => void;
}

const OPTIONS: { value: CompAiPresence; label: string; description: string }[] = [
  {
    value: 'Competitors appear prominently in AI results',
    label: 'Competitors dominate AI results',
    description: 'Your competitors are already visible and cited prominently',
  },
  {
    value: 'Some competitors rank high on LinkedIn',
    label: 'Competitors active on LinkedIn',
    description: 'Competitors have strong LinkedIn presence and AI mentions',
  },
  {
    value: 'Competitors cited in analyst reports',
    label: 'Competitors in analyst research',
    description: 'Competitors appear in Gartner, Forrester, or industry analyst reports',
  },
  {
    value: 'No clear competitor AI visibility yet',
    label: 'No competitor AI visibility yet',
    description: 'Competitors not yet visible in AI results — blue ocean opportunity',
  },
  {
    value: 'Unknown',
    label: `Don't know`,
    description: `Haven't checked competitor AI visibility yet`,
  },
];

export default function CompetitorAiPresence({ value, onChange }: Props) {
  return (
    <div className="mb-5">
      <label className="block text-[17px] text-gray-700 mb-3">
        Competitor AI visibility <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <p className="text-xs text-gray-500 mb-3">
        Helps us identify gaps where you can move fast, or opportunities to displace entrenched players.
      </p>
      <div className="space-y-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150 ${
              value === opt.value
                ? 'border-[#534AB7] bg-[#EEEDFE] text-[#3C3489] font-medium'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-start gap-3">
              <span
                className={`flex-shrink-0 w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                  value === opt.value
                    ? 'border-[#534AB7] bg-[#534AB7]'
                    : 'border-gray-300'
                }`}
              >
                {value === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <div className="flex-1">
                <div className="font-medium">{opt.label}</div>
                <div className={`text-xs ${value === opt.value ? 'text-[#3C3489]' : 'text-gray-500'}`}>
                  {opt.description}
                </div>
              </div>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
