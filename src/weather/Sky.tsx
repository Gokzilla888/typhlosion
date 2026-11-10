import type { CSSProperties } from 'react';
import { CLOUDS, CONDITION_KEYS, CONDITIONS, DROPS, FLAKES, STARS, type ConditionKey } from './data';

interface SkyProps {
  condition: ConditionKey;
  /** Scroll offset of the content, used for parallax on the sun and moon. */
  scrollY: number;
}

/** Animated background: gradient sky plus sun, moon, stars, clouds, rain, snow and lightning. */
export function Sky({ condition, scrollY }: SkyProps) {
  const c = CONDITIONS[condition];
  const celestial: CSSProperties = { transform: `translateY(${(-scrollY * 0.25).toFixed(1)}px)` };

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
          {STARS.map((s, i) => (
            <div
              key={i}
              className="wx-star"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }}
            />
          ))}
          <div className="wx-shooting-star" />
        </div>
      )}

      {c.sun && (
        <div className="wx-layer" aria-hidden="true">
          <div className="wx-sun" style={celestial}>
            <div className="wx-sun-rays" />
            <div className="wx-sun-glow" />
            <div className="wx-sun-core" />
          </div>
        </div>
      )}

      {c.moon && (
        <div className="wx-layer" aria-hidden="true">
          <div className="wx-moon" style={celestial}>
            <div className="wx-moon-glow" />
            <div className="wx-moon-disc">
              <div className="wx-crater" style={{ left: 22, top: 18, width: 16, height: 16, opacity: 0.32 }} />
              <div className="wx-crater" style={{ left: 48, top: 40, width: 11, height: 11, opacity: 0.28 }} />
              <div className="wx-crater" style={{ left: 28, top: 52, width: 8, height: 8, opacity: 0.25 }} />
            </div>
          </div>
        </div>
      )}

      <div className="wx-layer" aria-hidden="true">
        {CLOUDS.slice(0, c.cloudCount).map((cl, i) => (
          <div
            key={i}
            className="wx-cloud"
            style={{ top: cl.top, opacity: c.cloudOpacity, animationDuration: `${cl.dur}s`, animationDelay: `${cl.delay}s` }}
          >
            <div className="wx-cloud-shape" style={{ transform: `scale(${cl.scale})`, color: c.cloudColor }}>
              <div style={{ left: 0, top: 48, width: 240, height: 52, borderRadius: 52 }} />
              <div style={{ left: 42, top: 16, width: 90, height: 90, borderRadius: '50%' }} />
              <div style={{ left: 110, top: 0, width: 100, height: 100, borderRadius: '50%' }} />
            </div>
          </div>
        ))}
      </div>

      {c.rain && (
        <div className="wx-layer wx-rain" aria-hidden="true">
          {DROPS.slice(0, c.dropCount).map((d, i) => (
            <div
              key={i}
              className="wx-drop"
              style={{ left: `${d.x}%`, height: d.h, opacity: d.o, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
            />
          ))}
        </div>
      )}

      {c.snow && (
        <div className="wx-layer" aria-hidden="true">
          {FLAKES.map((f, i) => (
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
      )}

      {c.lightning && (
        <div className="wx-layer" aria-hidden="true">
          <div className="wx-flash" />
          <div className="wx-flash wx-flash--late" />
        </div>
      )}
    </>
  );
}
