'use client';

interface Props {
  competitors?: string[]; // List of competitors from CompetitorsStructured
  value: string;
  onChange: (value: string) => void;
}

export default function PrimaryCompetitorFocus({ competitors = [], value, onChange }: Props) {
  if (!competitors || competitors.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg px-4 py-4">
      <label htmlFor="primary-competitor" className="block text-[17px] text-gray-800 font-medium mb-2">
        Which competitor is your PRIMARY focus?
      </label>
      <p className="text-xs text-gray-600 mb-3">
        We'll focus our displacement analysis on beating this competitor first. You can tackle others later.
      </p>
      <select
        id="primary-competitor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-blue-200 bg-white text-sm outline-none focus:border-blue-500 transition-colors"
      >
        <option value="">Select primary competitor…</option>
        {competitors.map((comp) => (
          <option key={comp} value={comp}>
            {comp}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-gray-500">
        This determines which competitor analysis and displacement roadmap we prioritize.
      </p>
    </div>
  );
}
