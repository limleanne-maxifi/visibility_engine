interface ChoiceCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export default function ChoiceCard({ label, selected, onSelect }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150 ${
        selected
          ? 'border-[#534AB7] bg-[#EEEDFE] text-[#3C3489] font-medium'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            selected ? 'border-[#534AB7]' : 'border-gray-300'
          }`}
        >
          {selected && <span className="w-2 h-2 rounded-full bg-[#534AB7]" />}
        </span>
        {label}
      </span>
    </button>
  );
}
