'use client';

import { useState } from 'react';
import { PositioningDimension as PosDim, PositioningStructured } from '@/lib/types';

interface Props {
  data?: PositioningStructured;
  freeText: string;
  onChange: (updates: {
    positioningStructured?: PositioningStructured;
    positioning?: string;
  }) => void;
  family?: string;
}

const DIMENSION_OPTIONS: { value: PosDim; label: string; description: string }[] = [
  {
    value: 'speed',
    label: 'Speed / Efficiency',
    description: 'Fastest, quickest, most efficient solution',
  },
  {
    value: 'cost',
    label: 'Cost / Price',
    description: 'Most affordable, lowest-cost option',
  },
  {
    value: 'quality',
    label: 'Quality / Excellence',
    description: 'Best-in-class, highest quality, premium',
  },
  {
    value: 'trust',
    label: 'Trust / Reliability',
    description: 'Most reliable, most trusted, safest',
  },
  {
    value: 'niche',
    label: 'Niche / Specialization',
    description: 'Specialist in a specific vertical or use case',
  },
  {
    value: 'integration',
    label: 'Integration / Ecosystem',
    description: 'Best integrations, ecosystem player, platform',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Different positioning',
  },
];

const EXAMPLE_STRATEGIES: Record<PosDim, string> = {
  speed: 'Emphasize benchmarks, time-to-value case studies, deployment speed comparisons, time-savings calculators',
  cost: 'Highlight pricing comparisons, ROI calculators, cost-benefit analyses, total cost of ownership studies',
  quality: 'Focus on certifications, third-party reviews, quality standards, industry awards, quality metrics',
  trust: 'Leverage security certifications, compliance credentials, customer testimonials, case studies from known brands',
  niche: 'Build thought leadership in your vertical, community authority, specialized expertise, vertical-specific content',
  integration: 'Appear in ecosystem research, integration guides, API documentation, partner visibility, platform reviews',
  other: 'Custom positioning strategy',
  '': '',
};

export default function PositioningDimension({ data, freeText, onChange, family }: Props) {
  const [showStructured, setShowStructured] = useState(!!data?.statement);
  const [dimension, setDimension] = useState<PosDim>(data?.dimension ?? 'other');
  const [statement, setStatement] = useState(data?.statement ?? '');
  const [proof, setProof] = useState(data?.proof ?? '');

  const handleSwitchMode = () => {
    if (showStructured) {
      // Switch to free text
      setShowStructured(false);
      if (statement) {
        onChange({ positioning: statement, positioningStructured: undefined });
      }
    } else {
      // Switch to structured
      setShowStructured(true);
      if (freeText.trim()) {
        setStatement(freeText);
      }
    }
  };

  const handleSaveStructured = () => {
    if (!statement.trim()) return;
    onChange({
      positioningStructured: {
        dimension,
        statement: statement.trim(),
        proof: proof.trim() || undefined,
      },
      positioning: undefined,
    });
  };

  if (showStructured) {
    return (
      <div className="mb-5 border-l-4 border-green-500 bg-green-50 rounded-r-lg px-4 pt-4 pb-3">
        <div className="flex justify-between items-start mb-3">
          <label className="block text-[17px] text-gray-800">
            In one phrase, what do you want to be known for in AI answers?
          </label>
          <button
            type="button"
            onClick={handleSwitchMode}
            className="text-xs text-green-600 hover:text-green-700 font-medium"
          >
            Simple mode
          </button>
        </div>

        <p className="text-xs text-gray-600 mb-4">
          Your positioning type shapes the content and strategy recommendations below.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="positioning-dimension" className="block text-xs font-medium text-gray-700 mb-2">
              What's your competitive advantage?
            </label>
            <div className="space-y-2">
              {DIMENSION_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-green-100">
                  <input
                    type="radio"
                    name="positioning-dimension"
                    value={opt.value}
                    checked={dimension === opt.value}
                    onChange={(e) => setDimension(e.target.value as PosDim)}
                    className="mt-1 flex-shrink-0"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{opt.label}</div>
                    <div className="text-xs text-gray-600">{opt.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="positioning-statement" className="block text-xs font-medium text-gray-700 mb-1">
              Positioning statement <span className="text-red-500">*</span>
            </label>
            <input
              id="positioning-statement"
              type="text"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="e.g., 'Fastest deployment in the market' or 'Most trusted by enterprises'"
              className="w-full px-3 py-2 rounded-lg border border-green-200 bg-white text-sm outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="positioning-proof" className="block text-xs font-medium text-gray-700 mb-1">
              Proof point <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="positioning-proof"
              rows={2}
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder="e.g., 'Sub-1-hour setup vs. competitor's 3-day implementation'"
              className="w-full px-3 py-2 rounded-lg border border-green-200 bg-white text-sm outline-none focus:border-green-500 transition-colors resize-none"
            />
          </div>

          <div className="bg-white rounded p-3 border border-green-200">
            <p className="text-xs font-medium text-gray-700 mb-2">Recommended AEO strategy:</p>
            <p className="text-xs text-gray-600">{EXAMPLE_STRATEGIES[dimension]}</p>
          </div>

          <button
            type="button"
            onClick={handleSaveStructured}
            disabled={!statement.trim()}
            className="w-full text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-3 py-2 rounded transition-colors"
          >
            Save structured positioning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 border-l-4 border-green-500 bg-green-50 rounded-r-lg px-4 pt-4 pb-3">
      <label htmlFor="positioning" className="block text-[17px] text-gray-800 mb-1">
        In one phrase, what do you want to be known for in AI answers?
        <button
          type="button"
          onClick={handleSwitchMode}
          className="float-right text-xs text-green-600 hover:text-green-700 font-medium"
        >
          detailed mode
        </button>
      </label>
      <p className="text-xs text-gray-500 mb-2">
        This single input shapes your positioning analysis, content recommendations, and competitor framing.
        Be specific.
      </p>
      <textarea
        id="positioning"
        name="x-positioning"
        rows={2}
        value={freeText}
        onChange={(e) => onChange({ positioning: e.target.value })}
        placeholder="Your positioning phrase…"
        autoComplete="new-password"
        className="w-full px-3 py-2 rounded-lg border border-green-200 bg-white text-sm outline-none focus:border-green-500 transition-colors resize-none"
      />
    </div>
  );
}
