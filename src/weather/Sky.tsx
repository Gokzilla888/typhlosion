import type { CSSProperties } from 'react';
import { CLOUDS, CONDITION_KEYS, CONDITIONS, DROPS, FLAKES, STARS, type ConditionKey } from './data';

interface SkyProps {
  condition: ConditionKey;
  /** Scroll offset of the content, used for parallax on the sun and moon. */
  scrollY: number;
  /** Wind speed in km/h: drives cloud speed and the slant of the rain. */
  wind: number;
  /** Rain or snow strength, 0–1. */
  intensity?: number;
  /** Changes every time the person taps the sky during a storm. */
  strike: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Shifts a layer with the pointer; nearer layers move more. The screen sets
 * --wx-tx and --wx-ty (each -1 to 1) so pointer moves never re-render React.
 */
const depth = (px: number): CSSProperties => ({
  transform: `translate3d(calc(var(--wx-tx, 0) * ${px}px), calc(var(--wx-ty, 0) * ${px * 0.6}px), 0)`,
});

/** Animated background: gradient sky plus sun, moon, stars, clouds, rain, snow and lightning. */
export function Sky({ condition, scrollY, wind, intensity = 1, strike }: SkyProps) {
  const c = CONDITIONS[condition];
  const celestial: CSSProperties = { transform: `translateY(${(-scrollY * 0.25).toFixed(1)}px)` };

  // Calm air drifts clouds slowly; strong wind races them and slants the rain.
  const windSpeed = clamp(wind / 12, 0.5, 3.5);
  const rainSlant = clamp(4 + wind * 0.55, 6, 32);
  const dropCount = Math.round(c.dropCount * clamp(intensity, 0.3, 1));
  const flakeCount = Math.round(FLAKES.length * clamp(intensity, 0.35, 1));

  return (
    <>
      {/* Every sky is stacked so switching conditions cross-fades. */}
      {CONDITION_KEYS.map((k) => {
        const [a, b, d] = CONDITIONS[k].sky;
        return (
          <div
            key={k}
            className="wx-sky"
            style={{ background: `linear-gradient(180deg, ${a} 0%, ${b} 48%, ${d} 100%)`, opacity: k === condition ? 1 : 0 }}
          />
        );
      })}

      {c.stars && (
        <div className="wx-layer" aria-hidden="true">
          <div className="wx-depth" style={depth(6)}>
            {STARS.map((s, i) => (
              <div
                key={i}
                className="wx-star"
                style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }}
              />
            ))}
            <div className="wx-shooting-star" />
          </div>
        </div>
      )}

      {c.sun && (
        <div className="wx-layer" aria-hidden="true">
          <div className="wx-depth" style={depth(14)}>
            <div className="wx-sun" style={celestial}>
              <div className="wx-sun-rays" />
              <div className="wx-sun-glow" />
              <div className="wx-sun-core" />
            </div>
          </div>
        </div>
      )}

      {c.moon && (
        <div className="wx-layer" aria-hidden="true">
          <div className="wx-depth" style={depth(12)}>
            <div className="wx-moon" style={celestial}>
              <div className="wx-moon-glow" />
              <div className="wx-moon-disc">
                <div className="wx-crater" style={{ left: 22, top: 18, width: 16, height: 16, opacity: 0.32 }} />
                <div className="wx-crater" style={{ left: 48, top: 40, width: 11, height: 11, opacity: 0.28 }} />
                <div className="wx-crater" style={{ left: 28, top: 52, width: 8, height: 8, opacity: 0.25 }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="wx-layer" aria-hidden="true">
        <div className="wx-depth" style={depth(24)}>
          {CLOUDS.slice(0, c.cloudCount).map((cl, i) => (
            <div
              key={i}
              className="wx-cloud"
              style={{
                top: cl.top,
                opacity: c.cloudOpacity,
                animationDuration: `${(cl.dur / windSpeed).toFixed(1)}s`,
                animationDelay: `${(cl.delay / windSpeed).toFixed(1)}s`,
              }}
            >
              <div className="wx-cloud-shape" style={{ transform: `scale(${cl.scale})`, color: c.cloudColor }}>
                <div style={{ left: 0, top: 48, width: 240, height: 52, borderRadius: 52 }} />
                <div style={{ left: 42, top: 16, width: 90, height: 90, borderRadius: '50%' }} />
                <div style={{ left: 110, top: 0, width: 100, height: 100, borderRadius: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {c.rain && (
        <div className="wx-layer" aria-hidden="true">
          <div className="wx-depth" style={depth(10)}>
            <div className="wx-rain" style={{ transform: `rotate(${rainSlant.toFixed(1)}deg)` }}>
              {DROPS.slice(0, dropCount).map((d, i) => (
                <div
                  key={i}
                  className="wx-drop"
                  style={{ left: `${d.x}%`, height: d.h, opacity: d.o, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {c.snow && (
        <div className="wx-layer" aria-hidden="true">
          <div className="wx-depth" style={depth(16)}>
            {FLAKES.slice(0, flakeCount).map((f, i) => (
              <div
                key={i}
                className="wx-flake"
                style={{
                  left: `${f.x}%`,
                  width: f.s,
                  height: f.s,
                  opacity: f.o,
                  filter: `blur(${f.blur}px)`,
                  animationDuration: `${f.dur}s`,
                  animationDelay: `${f.delay}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {c.lightning && (
        <div className="wx-layer" aria-hidden="true">
          <div className="wx-flash" />
          <div className="wx-flash wx-flash--late" />
          {strike > 0 && <div key={strike} className="wx-strike" />}
        </div>
      )}
    </>
  );
}
