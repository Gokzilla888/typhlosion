import { useId } from 'react';

interface RaindropProps {
  /** Chance of precipitation, 0–100. */
  chance: number;
  /** mm in the selected period. */
  amount: number;
}

/** A glossy drop that fills up with the chance of rain, with ripples underneath. */
export function Raindrop({ chance, amount }: RaindropProps) {
  const id = useId().replace(/:/g, '');
  const fill = Math.max(0, Math.min(100, chance)) / 100;
  // The drop spans y 20–206; the water level rises from the bottom.
  const level = 206 - fill * 186;
  const ripples = amount > 0 || chance >= 40 ? 3 : chance > 0 ? 1 : 0;
  const drop = 'M150 20C178 74 206 112 206 150A56 56 0 0 1 94 150C94 112 122 74 150 20Z';

  return (
    <svg className="nb-scene" viewBox="0 0 300 240" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-ball`} cx="34%" cy="55%" r="75%">
          <stop offset="0" stopColor="#7a7a7a" />
          <stop offset="0.35" stopColor="#2a2a2a" />
          <stop offset="1" stopColor="#050505" />
        </radialGradient>
        <clipPath id={`${id}-drop`}>
          <path d={drop} />
        </clipPath>
      </defs>
      {Array.from({ length: ripples }, (_, i) => (
        <ellipse key={i} className="nb-ripple" cx="150" cy="226" rx="40" ry="7" fill="none" stroke="#111" strokeWidth="2" style={{ animationDelay: `${i * 0.8}s` }} />
      ))}
      <ellipse cx="150" cy="226" rx="70" ry="7" fill="rgba(0,0,0,0.12)" />
      <g className="nb-bob">
        <path d={drop} fill="#fff" stroke="#111" strokeWidth="4" />
        <g clipPath={`url(#${id}-drop)`}>
          <rect className="nb-level" x="80" y={level} width="140" height="240" fill={`url(#${id}-ball)`} />
          <path className="nb-wave" d={`M60 ${level}q15-6 30 0t30 0t30 0t30 0t30 0t30 0v10h-180z`} fill="#2a2a2a" />
        </g>
        <path d={drop} fill="none" stroke="#111" strokeWidth="4" />
        <path d="M128 92C120 108 116 124 117 138" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
