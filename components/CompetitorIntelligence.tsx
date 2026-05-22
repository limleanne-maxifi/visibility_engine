'use client';

import { useState } from 'react';
import { CompetitorsStructured } from '@/lib/types';

interface Props {
  data?: CompetitorsStructured;
  freeText: string;
  gap?: string; // Phase 5: visibility gap context
  onChange: (updates: {
    competitorsStructured?: CompetitorsStructured;
    competitors?: string;
  }) => void;
}

export default function CompetitorIntelligence({ data, freeText, gap, onChange }: Props) {
  // Phase 5: Auto-switch to detailed mode if gap is "competitors-cited" (Gap 2)
  const isCompetitiveGap = gap === 'competitors-cited';
  const [showStructured, setShowStructured] = useState(
    isCompetitiveGap || !!data?.direct?.length || !!data?.indirect?.length
  );
  const [direct, setDirect] = useState((data?.direct ?? []).join(', '));
  const [indirect, setIndirect] = useState((data?.indirect ?? []).join(', '));
  const [noteworthy, setNoteworthy] = useState(data?.noteworthy ?? '');

  const handleSwitchMode = () => {
    if (showStructured) {
      // Switch to free text
      setShowStructured(false);
      const allCompetitors = [
        ...(data?.direct ?? []),
        ...(data?.indirect ?? []),
      ].join(', ');
      onChange({ competitors: allCompetitors, competitorsStructured: undefined });
    } else {
      // Switch to structured (parse free text if available)
      setShowStructured(true);
      if (freeText.trim()) {
        const competitors = freeText.split(/[,;/\n&]/).map(c => c.trim()).filter(Boolean);
        if (competitors.length > 0) {
          setDirect(competitors[0] || '');
          setIndirect(competitors.slice(1).join(', '));
        }
      }
    }
  };

  const handleSaveStructured = () => {
    onChange({
      competitorsStructured: {
        direct: direct.split(',').map(c => c.trim()).filter(Boolean),
        indirect: indirect.split(',').map(c => c.trim()).filter(Boolean),
        noteworthy: noteworthy.trim() || undefined,
      },
      competitors: undefined,
    });
  };

  if (showStructured) {
    return (
      <div className="mb-5 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg px-4 py-4">
        <div className="flex justify-between items-start mb-3">
          <label className="block text-[17px] text-gray-800">
            Competitive landscape{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <button
            type="button"
            onClick={handleSwitchMode}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Simple mode
          </button>
        </div>

        <p className="text-xs text-gray-600 mb-3">
          {isCompetitiveGap
            ? 'Tell us which competitors are cited instead of you — this helps us analyze displacement opportunities.'
            : 'Help us understand your competitive position. Separate multiple names with commas.'}
        </p>

        <div className="space-y-3">
          <div>
            <label htmlFor="direct-competitors" className="block text-xs font-medium text-gray-700 mb-1">
              Direct competitors <span className="text-gray-400">(same customer, same solution)</span>
            </label>
            <input
              id="direct-competitors"
              type="text"
              value={direct}
              onChange={(e) => setDirect(e.target.value)}
              placeholder="e.g., Acme, TechFlow, CloudCorp"
              className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="indirect-competitors" className="block text-xs font-medium text-gray-700 mb-1">
              Alternative solutions <span className="text-gray-400">(different approach, same problem)</span>
            </label>
            <input
              id="indirect-competitors"
              type="text"
              value={indirect}
              onChange={(e) => setIndirect(e.target.value)}
              placeholder="e.g., open source alternatives, adjacent categories"
              className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="market-context" className="block text-xs font-medium text-gray-700 mb-1">
              Market context <span className="text-gray-400">(e.g., dominance, disruption)</span>
            </label>
            <textarea
              id="market-context"
              rows={2}
              value={noteworthy}
              onChange={(e) => setNoteworthy(e.target.value)}
              placeholder="e.g., Acme dominates 70% of enterprise segment, but new entrants are disrupting with low-cost models"
              className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveStructured}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
          >
            Save structured data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <label htmlFor="competitors" className="block text-[17px] text-gray-700 mb-1">
        Who shows up when your customers search for what you do?{' '}
        <span className="text-gray-400 font-normal">(optional)</span>
        <button
          type="button"
          onClick={handleSwitchMode}
          className="float-right text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          detailed mode
        </button>
      </label>
      <input
        id="competitors"
        type="text"
        name="x-competitors"
        value={freeText}
        onChange={(e) => onChange({ competitors: e.target.value })}
        placeholder="Your closest competitors by name"
        autoComplete="new-password"
        className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-brand-gold transition-colors"
      />
      <p className="mt-1 text-xs text-gray-400">
        Optional — add competitors to unlock side-by-side displacement analysis in your plan.
      </p>
    </div>
  );
}
