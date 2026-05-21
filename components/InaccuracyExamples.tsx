'use client';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function InaccuracyExamples({ value, onChange }: Props) {
  return (
    <div className="mb-5 border-l-4 border-red-500 bg-red-50 rounded-r-lg px-4 py-4">
      <label htmlFor="inaccuracy-examples" className="block text-[17px] text-gray-800 font-medium mb-2">
        What problems have you noticed?
      </label>
      <p className="text-xs text-gray-600 mb-3">
        Tell us about inaccuracies, outdated information, or unwanted associations you've seen in AI descriptions of your brand.
      </p>
      <textarea
        id="inaccuracy-examples"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., wrong job title, discontinued product, outdated founding date, false claim, unwanted topic association"
        className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-sm outline-none focus:border-red-500 transition-colors resize-none"
      />
      <p className="mt-2 text-xs text-gray-500">
        This helps us prioritize which AI sources to audit and what corrections to prioritize.
      </p>
    </div>
  );
}
