'use client';

interface Props {
  value?: string[];
  onChange: (value: string[]) => void;
}

const PLATFORM_OPTIONS = [
  { id: 'chatgpt', label: 'ChatGPT', description: 'OpenAI' },
  { id: 'claude', label: 'Claude', description: 'Anthropic' },
  { id: 'perplexity', label: 'Perplexity', description: 'Search-focused' },
  { id: 'google-ai', label: 'Google AI', description: 'Google Search Generative AI' },
  { id: 'other', label: 'Other platforms', description: 'Gemini, Copilot, etc.' },
];

export default function PlatformPreferences({ value = [], onChange }: Props) {
  const togglePlatform = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((p) => p !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="mb-5">
      <label className="block text-[17px] text-gray-700 mb-3">
        Which AI platforms should we prioritize?{' '}
        <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <p className="text-xs text-gray-500 mb-3">
        We'll audit all major platforms by default. Select specific ones to focus the snapshot on your key platforms.
      </p>
      <div className="space-y-2">
        {PLATFORM_OPTIONS.map((platform) => (
          <label key={platform.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
            <input
              type="checkbox"
              checked={value.includes(platform.id)}
              onChange={() => togglePlatform(platform.id)}
              className="w-4 h-4 rounded"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">{platform.label}</div>
              <div className="text-xs text-gray-500">{platform.description}</div>
            </div>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Leaving all unchecked = comprehensive audit across all platforms
      </p>
    </div>
  );
}
