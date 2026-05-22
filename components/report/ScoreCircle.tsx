'use client';

import type { ScoreBand } from '@/lib/reportTypes';

interface Props {
  score: number;
  band: ScoreBand;
}

const BAND_COLOR: Record<ScoreBand, string> = {
  Critical:   '#EF4444',
  Low:        '#F97316',
  Developing: '#F59E0B',
  Established:'#10B981',
  Strong:     '#22C55E',
};

const R = 52;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function ScoreCircle({ score, band }: Props) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE * (1 - clampedScore / 100);
  const color = BAND_COLOR[band];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        aria-label={`AI Visibility Score: ${clampedScore} out of 100`}
        role="img"
      >
        {/* Track */}
        <circle
          cx="70" cy="70" r={R}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
        />
        {/* Progress arc */}
        <circle
          cx="70" cy="70" r={R}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        {/* Score number */}
        <text
          x="70" y="63"
          textAnchor="middle"
          fill="white"
          fontSize="34"
          fontWeight="800"
          fontFamily="var(--font-inter), Inter, sans-serif"
        >
          {clampedScore}
        </text>
        {/* "/ 100" sub-label */}
        <text
          x="70" y="84"
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontSize="11"
          fontFamily="var(--font-inter), Inter, sans-serif"
        >
          out of 100
        </text>
      </svg>

      {/* Band pill */}
      <span
        className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
        style={{ background: `${color}22`, color }}
      >
        {band}
      </span>
    </div>
  );
}
