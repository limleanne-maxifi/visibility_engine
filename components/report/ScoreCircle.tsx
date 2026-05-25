'use client';

import type { ScoreBand } from '@/lib/reportTypes';

interface Props {
  score: number;
  band: ScoreBand;
  /** When false (free/teaser tier) show only the band arc, not the numeric score */
  showScore?: boolean;
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

export default function ScoreCircle({ score, band, showScore = true }: Props) {
  const clampedScore = Math.max(0, Math.min(100, score));
  // Teaser: arc fills to band midpoint so the ring has meaningful shape without revealing the number
  const arcScore = showScore ? clampedScore : { Critical: 10, Low: 30, Developing: 50, Established: 68, Strong: 88 }[band];
  const offset = CIRCUMFERENCE * (1 - arcScore / 100);
  const color = BAND_COLOR[band];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        aria-label={showScore ? `AI Visibility Score: ${clampedScore} out of 100` : `AI Visibility Band: ${band}`}
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
        {showScore ? (
          <>
            {/* Measured numeric score */}
            <text x="70" y="63" textAnchor="middle" fill="white" fontSize="34" fontWeight="800"
              fontFamily="var(--font-inter), Inter, sans-serif">
              {clampedScore}
            </text>
            <text x="70" y="84" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11"
              fontFamily="var(--font-inter), Inter, sans-serif">
              out of 100
            </text>
          </>
        ) : (
          <>
            {/* Teaser: band label only, no number */}
            <text x="70" y="66" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10"
              fontFamily="var(--font-inter), Inter, sans-serif" letterSpacing="0.08em">
              VISIBILITY
            </text>
            <text x="70" y="82" textAnchor="middle" fill="white" fontSize="15" fontWeight="700"
              fontFamily="var(--font-inter), Inter, sans-serif">
              {band}
            </text>
          </>
        )}
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
