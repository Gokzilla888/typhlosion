import { useId, useState, type CSSProperties } from 'react';

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
}

const BASE = { x: 150, y: 222 };
const STEM = 128;
/** Petals that fall off first as the air worsens. */
const DROP_ORDER = [4, 2, 6, 0, 3];
const SPECKS = [
  [-6, -26], [8, -20], [20, -4], [-18, 6], [4, 22], [-24, -12], [14, 14], [-10, 18],
];

/**
 * A flower that shows the air: it stands tall in clean air, then droops,
 * loses petals, darkens, gathers red pollution specks and smog as it worsens.
 */
export function Flower({ health: h }: { health: number }) {
  const id = useId().replace(/:/g, '');
  const [wiggle, setWiggle] = useState(0);
  const droop = (1 - h) * 80;
  const rad = (droop * Math.PI) / 180;
  const head = { x: BASE.x + STEM * 0.5 * Math.sin(rad), y: BASE.y - STEM * Math.cos(rad * 0.9) };
  const ctrl = { x: BASE.x, y: BASE.y - STEM * 0.62 };
  const t = 0.42;
  const leaf = {
    x: (1 - t) ** 2 * BASE.x + 2 * (1 - t) * t * ctrl.x + t ** 2 * head.x,
    y: (1 - t) ** 2 * BASE.y + 2 * (1 - t) * t * ctrl.y + t ** 2 * head.y,
  };
  const leafDroop = -26 + (1 - h) * 72;
  const petal = mix('#FFFFFF', '#6E6A66', 1 - h);
  const lost = Math.round((1 - h) * DROP_ORDER.length);
  const specks = Math.round(Math.max(0, (0.8 - h) / 0.8) * SPECKS.length);
  const smog = Math.min(0.7, (1 - h) * 0.85);
  const sway = { '--sway': `${(1.5 + 4 * h).toFixed(2)}deg`, animationDuration: `${(3 + (1 - h) * 3).toFixed(2)}s` } as CSSProperties;
  const state = h > 0.75 ? 'thriving' : h > 0.45 ? 'struggling' : 'wilting';

  return (
    <button type="button" className="nb-flower" aria-label={`Air quality flower, ${state}. Tap to shake it.`} onClick={() => setWiggle((n) => n + 1)}>
      <svg className="nb-scene" viewBox="0 0 300 240" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}-ball`} cx="34%" cy="28%" r="75%">
            <stop offset="0" stopColor="#7a7a7a" />
            <stop offset="0.35" stopColor="#2a2a2a" />
            <stop offset="1" stopColor="#050505" />
          </radialGradient>
        </defs>
        <g opacity={smog} className="nb-smog">
          <ellipse cx="70" cy="110" rx="60" ry="16" fill="#8d8d8d" />
          <ellipse cx="230" cy="80" rx="54" ry="14" fill="#9a9a9a" />
          <ellipse cx="190" cy="160" rx="70" ry="15" fill="#a5a5a5" />
        </g>
        <ellipse cx={BASE.x} cy={BASE.y + 6} rx="64" ry="7" fill="rgba(0,0,0,0.14)" />

        <g key={wiggle} className={wiggle ? 'nb-wiggle' : ''}>
          <g className="nb-sway" style={sway}>
            <path d={`M${BASE.x} ${BASE.y}Q${ctrl.x} ${ctrl.y} ${head.x.toFixed(1)} ${head.y.toFixed(1)}`} fill="none" stroke="#111" strokeWidth="6" strokeLinecap="round" />
            <g transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)})`}>
              <path d="M0 0C12-14 34-12 46 0C34 11 12 12 0 0Z" fill={`url(#${id}-ball)`} transform={`rotate(${leafDroop.toFixed(1)})`} />
              <path d="M0 0C12-14 34-12 46 0C34 11 12 12 0 0Z" fill={`url(#${id}-ball)`} transform={`scale(-1 1) rotate(${(leafDroop + 8).toFixed(1)})`} />
            </g>
            <g transform={`translate(${head.x.toFixed(1)} ${head.y.toFixed(1)}) rotate(${(droop * 1.25).toFixed(1)})`}>
              <g transform={`scale(${(0.74 + 0.26 * h).toFixed(3)})`}>
                {Array.from({ length: 8 }, (_, i) => (
                  <ellipse
                    key={i}
                    cx="0"
                    cy="-24"
                    rx="12"
                    ry="21"
                    fill={petal}
                    stroke="#111"
                    strokeWidth="3"
                    transform={`rotate(${i * 45})`}
                    className="nb-petal"
                    style={{ opacity: DROP_ORDER.indexOf(i) > -1 && DROP_ORDER.indexOf(i) < lost ? 0 : 1 }}
                  />
                ))}
                {SPECKS.slice(0, specks).map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="3" fill="#D72B26" />
                ))}
                <circle r="13" fill={`url(#${id}-ball)`} />
              </g>
              {h < 0.85 && <ellipse className="nb-petal-fall" cx="8" cy="12" rx="8" ry="13" fill={petal} stroke="#111" strokeWidth="2" />}
              {h < 0.5 && <ellipse className="nb-petal-fall nb-petal-fall--late" cx="-8" cy="10" rx="8" ry="13" fill={petal} stroke="#111" strokeWidth="2" />}
            </g>
          </g>
        </g>
        {h > 0.7 && (
          <g fill="#111" opacity={(h - 0.7) / 0.3}>
            <path className="nb-twinkle" d="M232 52l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
            <path className="nb-twinkle" style={{ animationDelay: '0.8s' }} d="M70 70l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
            <path className="nb-twinkle" style={{ animationDelay: '1.6s' }} d="M222 132l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          </g>
        )}
      </svg>
    </button>
  );
}
