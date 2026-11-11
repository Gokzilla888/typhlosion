import { useEffect, useId, useRef } from 'react';

interface AnemometerProps {
  /** km/h; sets how fast the cups spin. */
  wind: number;
  /** Degrees the wind comes from; the arrow points where it blows to. */
  direction: number;
}

const HUB = { x: 150, y: 64 };
const ARM = 54;
const RING = { x: 150, y: 168, rx: 136, ry: 22 };

/** Spinning cup anemometer with a wind-direction arrow on a ring. */
export function Anemometer({ wind, direction }: AnemometerProps) {
  const id = useId().replace(/:/g, '');
  const cups = useRef<(SVGGElement | null)[]>([]);
  const arms = useRef<(SVGLineElement | null)[]>([]);
  const speed = useRef(0);
  speed.current = 0.5 + wind * 0.11; // radians per second

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) speed.current = 0;
    let raf = 0;
    let phase = 0;
    let last = performance.now();
    const frame = (now: number) => {
      phase += ((now - last) / 1000) * speed.current;
      last = now;
      for (let k = 0; k < 3; k++) {
        const a = phase + (k * 2 * Math.PI) / 3;
        const depth = Math.sin(a); // -1 back, 1 front
        const x = HUB.x + Math.cos(a) * ARM;
        const y = HUB.y + depth * 11;
        const s = 0.78 + 0.22 * ((depth + 1) / 2);
        cups.current[k]?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);
        arms.current[k]?.setAttribute('x2', x.toFixed(1));
        arms.current[k]?.setAttribute('y2', y.toFixed(1));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Arrow on the ring plane, pointing downwind.
  const to = ((direction + 180) * Math.PI) / 180;
  const tip = { x: RING.x + Math.sin(to) * RING.rx * 0.82, y: RING.y - Math.cos(to) * RING.ry * 0.82 };
  const tail = { x: RING.x - Math.sin(to) * RING.rx * 0.5, y: RING.y + Math.cos(to) * RING.ry * 0.5 };
  const ang = Math.atan2(tip.y - tail.y, tip.x - tail.x);
  const head = (o: number) => `${(tip.x - Math.cos(ang + o) * 16).toFixed(1)},${(tip.y - Math.sin(ang + o) * 16).toFixed(1)}`;

  return (
    <svg className="nb-scene" viewBox="0 0 300 240" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-ball`} cx="34%" cy="28%" r="75%">
          <stop offset="0" stopColor="#7a7a7a" />
          <stop offset="0.35" stopColor="#2a2a2a" />
          <stop offset="1" stopColor="#050505" />
        </radialGradient>
      </defs>
      <ellipse cx="150" cy="232" rx="70" ry="6" fill="rgba(0,0,0,0.12)" />
      <ellipse cx={RING.x} cy={RING.y} rx={RING.rx} ry={RING.ry} fill="none" stroke="#111" strokeWidth="3" />
      <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke="#111" strokeWidth="6" strokeLinecap="round" style={{ transition: 'all 0.8s ease' }} />
      <polygon points={`${tip.x.toFixed(1)},${tip.y.toFixed(1)} ${head(0.5)} ${head(-0.5)}`} fill="#111" />
      <rect x="147" y={HUB.y} width="6" height="168" rx="3" fill="#111" />
      {[0, 1, 2].map((k) => (
        <line key={k} ref={(el) => void (arms.current[k] = el)} x1={HUB.x} y1={HUB.y} x2={HUB.x} y2={HUB.y} stroke="#111" strokeWidth="3" />
      ))}
      <circle cx={HUB.x} cy={HUB.y} r="7" fill="#111" />
      {[0, 1, 2].map((k) => (
        <g key={k} ref={(el) => void (cups.current[k] = el)}>
          <circle r="17" fill={`url(#${id}-ball)`} />
        </g>
      ))}
    </svg>
  );
}
