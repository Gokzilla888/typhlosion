import type { CSSProperties } from 'react';
import { SKY_KINDS, SKY_THEMES } from '../lib/skies';
import type { SkyKind } from '../lib/format';

/** Small seeded generator so particles sit in the same places on every render. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scatter<T>(seed: number, count: number, make: (r: () => number) => T): T[] {
  const r = seeded(seed);
  return Array.from({ length: count }, () => make(r));
}

const DROPS = scatter(7, 90, (r) => ({
  left: `${(r() * 116 - 8).toFixed(1)}%`,
  height: Math.round(40 + r() * 50),
  opacity: Number((0.25 + r() * 0.5).toFixed(2)),
  animationDuration: `${(0.66 + r() * 0.54).toFixed(2)}s`,
  animationDelay: `${(-r() * 2).toFixed(2)}s`,
}));

const FLAKES = scatter(11, 55, (r) => {
  const s = 2 + r() * 5;
  return {
    left: `${(r() * 100).toFixed(1)}%`,
    width: Number(s.toFixed(1)),
    height: Number(s.toFixed(1)),
    opacity: Number((0.5 + r() * 0.5).toFixed(2)),
    filter: s < 3.5 ? 'blur(1px)' : undefined,
    animationDuration: `${(8.4 + r() * 9.6).toFixed(2)}s`,
    animationDelay: `${(-r() * 15).toFixed(2)}s`,
  };
});

const STARS = scatter(23, 70, (r) => {
  const s = 0.8 + r() * 1.8;
  return {
    left: `${(r() * 100).toFixed(1)}%`,
    top: `${(r() * 55).toFixed(1)}%`,
    width: Number(s.toFixed(1)),
    height: Number(s.toFixed(1)),
    animationDuration: `${(2 + r() * 4).toFixed(2)}s`,
    animationDelay: `${(-r() * 6).toFixed(2)}s`,
  };
});

const CLOUDS = [
  { top: 64, scale: 1.1, dur: 95, delay: -20 },
  { top: 156, scale: 0.8, dur: 120, delay: -70 },
  { top: 20, scale: 1.4, dur: 140, delay: -100 },
  { top: 236, scale: 0.7, dur: 80, delay: -45 },
  { top: 110, scale: 1.2, dur: 110, delay: -5 },
  { top: 296, scale: 0.9, dur: 130, delay: -90 },
];

interface SkyProps {
  kind: SkyKind;
  /** Rain strength, 0–1; thins out the drops in light rain. */
  intensity?: number;
}

/** Animated sky behind the forecast: gradient, sun or moon, stars, clouds, rain, snow and lightning. */
export function Sky({ kind, intensity = 1 }: SkyProps) {
  const t = SKY_THEMES[kind];
  const drops = Math.round(t.drops * Math.max(0.45, Math.min(1, intensity)));

  return (
    <div className="nb-sky" aria-hidden="true" style={{ '--cloud': t.cloud } as CSSProperties}>
      {/* Every gradient stays mounted so the sky cross-fades when the weather changes. */}
      {SKY_KINDS.map((k) => {
        const [a, b, c] = SKY_THEMES[k].sky;
        return <div key={k} className="nb-sky-fill" style={{ background: `linear-gradient(180deg, ${a} 0%, ${b} 48%, ${c} 100%)`, opacity: k === kind ? 1 : 0 }} />;
      })}

      {t.stars && (
        <div className="nb-layer">
          {STARS.map((s, i) => (
            <span key={i} className="nb-star" style={s} />
          ))}
          <span className="nb-shoot" />
        </div>
      )}

      {t.sun && (
        <div className="nb-layer">
          <div className="nb-sun nb-celestial">
            <span className="nb-sun-rays" />
            <span className="nb-sun-glow" />
            <span className="nb-sun-core" />
          </div>
        </div>
      )}

      {t.moon && (
        <div className="nb-layer">
          <div className="nb-moon nb-celestial">
            <span className="nb-moon-glow" />
            <div className="nb-moon-disc">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      )}

      <div className="nb-layer">
        {CLOUDS.map((c, i) => (
          <div key={i} className="nb-cloud" style={{ top: c.top, opacity: i < t.clouds ? t.cloudOpacity : 0, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}>
            <div className="nb-cloud-shape" style={{ transform: `scale(${c.scale})` }}>
              <span />
              <span />
              <span />
            </div>
          </div>
        ))}
      </div>

      {drops > 0 && (
        <div className="nb-layer nb-rain">
          {DROPS.slice(0, drops).map((d, i) => (
            <span key={i} className="nb-drop" style={d} />
          ))}
        </div>
      )}

      {t.snow && (
        <div className="nb-layer">
          {FLAKES.map((f, i) => (
            <span key={i} className="nb-flake" style={f} />
          ))}
        </div>
      )}

      {t.flash && (
        <div className="nb-layer">
          <span className="nb-flash" />
          <span className="nb-flash nb-flash--late" />
        </div>
      )}
    </div>
  );
}
