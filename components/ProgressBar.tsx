interface ProgressBarProps {
  step: number;
  totalSteps: number;
}

export default function ProgressBar({ step, totalSteps }: ProgressBarProps) {
  const percent = Math.round((step / totalSteps) * 100);

  return (
    <div className="w-full" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-[3px] w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#534AB7] rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-400 text-right">Step {step} of {totalSteps}</p>
    </div>
  );
}
