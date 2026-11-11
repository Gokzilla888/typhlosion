import { useId } from 'react';
import type { SceneKind } from '../lib/format';

interface SceneProps {
  kind: SceneKind;
  /** km/h; speeds up the wind streaks. */
  wind: number;
  /** Rain or snow strength, 0–1. */
  intensity: number;
  /** US AQI; adds red pollution specks to clouds when the air is bad. */
  aqi: number | null;
}

const CLOUD: [number, number, number][] = [
  [62, 150, 30], [248, 150, 30], [96, 122, 46], [208, 120, 48], [152, 98, 62], [122, 156, 40], [186, 156, 42],
];
const SMALL_CLOUD: [number, number, number][] = [
  [150, 150, 26], [250, 150, 24], [178, 128, 36], [226, 128, 34], [204, 112, 44],
];

// Fixed speck positions so they don't jump between renders.
const SPECKS = Array.from({ length: 18 }, (_, i) => {
  const a = (i * 137.5 * Math.PI) / 180;
  const r = 20 + ((i * 29) % 70);
  return { x: 152 + Math.cos(a) * r * 1.35, y: 128 + Math.sin(a) * r * 0.45, s: 2 + ((i * 7) % 5) };
});

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function Balls({ list, fill }: { list: [number, number, number][]; fill: string }) {
  return (
    <>
      {list.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={fill} />
      ))}
    </>
  );
}

/** Glossy monochrome weather illustration. */
export function Scene({ kind, wind, intensity, aqi }: SceneProps) {
  const id = useId().replace(/:/g, '');
  const ball = `url(#${id}-ball)`;
  const hasCloud = kind === 'cloud' || kind === 'rain' || kind === 'storm' || kind === 'snow' || kind === 'partly';
  const cloud = kind === 'partly' ? SMALL_CLOUD : CLOUD;
  const specks = aqi == null ? 0 : Math.round(clamp((aqi - 60) / 160, 0, 1) * SPECKS.length);
  const streakDur = `${clamp(5 - wind / 10, 1.2, 5).toFixed(2)}s`;
  const drops = Math.round((kind === 'storm' ? 14 : 12) * clamp(intensity, 0.35, 1));

  return (
    <svg className="nb-scene" viewBox="0 0 300 240" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-ball`} cx="34%" cy="28%" r="75%">
          <stop offset="0" stopColor="#7a7a7a" />
          <stop offset="0.35" stopColor="#2a2a2a" />
          <stop offset="1" stopColor="#050505" />
        </radialGradient>
        <linearGradient id={`${id}-ray`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#444" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
        <mask id={`${id}-crescent`}>
          <rect width="300" height="240" fill="#fff" />
          <circle cx="182" cy="92" r="58" fill="#000" />
        </mask>
        <clipPath id={`${id}-below`}>
          <rect x="0" y="150" width="300" height="200" />
        </clipPath>
      </defs>


      {(kind === 'sun' || kind === 'partly') && (
        <g transform={kind === 'partly' ? 'translate(-38 -14) scale(0.82)' : undefined} style={{ transformOrigin: '150px 115px' }}>
          <g className="nb-spin">
            {Array.from({ length: 12 }, (_, i) => (
              <polygon key={i} points="142,30 158,30 150,6" fill={`url(#${id}-ray)`} transform={`rotate(${i * 30} 150 115)`} />
            ))}
          </g>
          <circle cx="150" cy="115" r="66" fill={ball} />
        </g>
      )}

      {kind === 'moon' && (
        <g className="nb-bob">
          <circle cx="150" cy="115" r="72" fill={ball} mask={`url(#${id}-crescent)`} />
          {[
            [228, 52, 3],
            [250, 120, 2],
            [70, 60, 2.5],
            [238, 178, 2],
          ].map(([x, y, r], i) => (
            <circle key={i} className="nb-twinkle" cx={x} cy={y} r={r} fill="#111" style={{ animationDelay: `${i * 0.7}s` }} />
          ))}
        </g>
      )}

      {kind === 'fog' &&
        [70, 102, 134, 166].map((y, i) => (
          <rect key={y} className="nb-fog" x={40 + (i % 2) * 24} y={y} width="200" height="18" rx="9" fill={i % 2 ? '#2b2b2b' : '#555'} style={{ animationDelay: `${-i * 1.3}s` }} />
        ))}

      {(kind === 'rain' || kind === 'storm') && (
        <g clipPath={`url(#${id}-below)`}>
          {Array.from({ length: drops }, (_, i) => (
            <g key={i} transform={`translate(${70 + ((i * 53) % 170)} 150)`}>
              <path
                className="nb-drop"
                d="M0 0C3 6 6 10 6 14A6 6 0 0 1-6 14C-6 10-3 6 0 0Z"
                fill="#fff"
                stroke="#111"
                strokeWidth="1.8"
                style={{ animationDelay: `${-((i * 0.37) % 1.2).toFixed(2)}s` }}
              />
            </g>
          ))}
        </g>
      )}

      {kind === 'snow' && (
        <g clipPath={`url(#${id}-below)`}>
          {Array.from({ length: Math.round(14 * clamp(intensity, 0.4, 1)) }, (_, i) => (
            <circle
              key={i}
              className="nb-flake"
              cx={66 + ((i * 47) % 176)}
              cy={150}
              r={3 + (i % 3)}
              fill="#fff"
              stroke="#111"
              strokeWidth="1.5"
              style={{ animationDelay: `${-((i * 0.61) % 3.4).toFixed(2)}s` }}
            />
          ))}
        </g>
      )}

      {kind === 'storm' && <polygon className="nb-bolt" points="158,150 132,196 150,196 138,236 176,180 156,180 170,150" fill="#E5322D" />}

      {hasCloud && (
        <g className="nb-bob">
          <Balls list={cloud} fill={ball} />
          {specks > 0 &&
            SPECKS.slice(0, specks).map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#D72B26" opacity="0.9" />)}
        </g>
      )}

      {/* Wind streaks */}
      {wind > 8 &&
        [
          [36, 96],
          [26, 140],
          [258, 82],
        ].map(([x, y], i) => (
          <path
            key={i}
            className="nb-streak"
            d={`M${x} ${y}q10-7 22-2`}
            fill="none"
            stroke="#111"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ animationDuration: streakDur, animationDelay: `${-i * 0.6}s` }}
          />
        ))}
    </svg>
  );
}
