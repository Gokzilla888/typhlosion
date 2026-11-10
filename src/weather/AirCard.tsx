import { useState, type CSSProperties } from 'react';
import type { AirQuality, Condition, PollenKind } from './data';
import { aqiBand, healthFor, POLLEN_COLORS, POLLEN_LABELS, POLLEN_LEVELS, pollenLevel } from './airScale';
import { Card, CardLabel } from './Cards';
import { useCountUp } from './useCountUp';

// ---------- Color helpers ----------

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
}
/** Three-stop blend: healthy → tired → wilted. */
const wilt = (healthy: string, tired: string, dead: string, h: number) => {
  const t = 1 - h;
  return t < 0.5 ? mix(healthy, tired, t * 2) : mix(tired, dead, (t - 0.5) * 2);
};

// ---------- Flower ----------

const BASE = { x: 60, y: 150 };
const STEM = 80;
/** Petals that fall off first as the air worsens. */
const DROP_ORDER = [4, 2, 6, 0];

function Flower({ health: h }: { health: number }) {
  const [wiggle, setWiggle] = useState(0);
  const droop = (1 - h) * 78; // degrees
  const rad = (droop * Math.PI) / 180;
  const head = { x: BASE.x + STEM * 0.55 * Math.sin(rad), y: BASE.y - STEM * Math.cos(rad * 0.9) };
  const ctrl = { x: BASE.x, y: BASE.y - STEM * 0.62 };
  // Point 40% up the stem for the leaves.
  const t = 0.4;
  const leaf = {
    x: (1 - t) ** 2 * BASE.x + 2 * (1 - t) * t * ctrl.x + t ** 2 * head.x,
    y: (1 - t) ** 2 * BASE.y + 2 * (1 - t) * t * ctrl.y + t ** 2 * head.y,
  };
  const leafDroop = -28 + (1 - h) * 70;

  const petal = wilt('#FF6FA3', '#E3A15C', '#7A6248', h);
  const petalEdge = wilt('#FFB3CE', '#F1C68E', '#9B826A', h);
  const centre = wilt('#FFD166', '#C9A04A', '#5C4630', h);
  const stem = wilt('#4CC777', '#9FB453', '#8A7448', h);
  const lost = Math.round((1 - h) * DROP_ORDER.length);
  const sparkle = Math.max(0, (h - 0.65) / 0.35);
  const smog = Math.min(0.75, (1 - h) * 0.9);
  const swayStyle = { '--sway': `${(1.5 + 4 * h).toFixed(2)}deg`, animationDuration: `${(3 + (1 - h) * 3).toFixed(2)}s` } as CSSProperties;

  return (
    <button
      type="button"
      className="wx-flower-btn"
      aria-label={`Air quality flower, ${h > 0.75 ? 'thriving' : h > 0.45 ? 'struggling' : 'wilting'}. Tap to shake it.`}
      onClick={() => setWiggle((n) => n + 1)}
    >
      <svg viewBox="0 0 140 165" width="132" height="156" aria-hidden="true">
        {/* Smog drifting behind the flower */}
        <g opacity={smog} className="wx-smog">
          <ellipse cx="30" cy="70" rx="34" ry="12" fill="#9A8F7C" />
          <ellipse cx="100" cy="48" rx="30" ry="10" fill="#8C8270" />
          <ellipse cx="78" cy="104" rx="38" ry="11" fill="#A39782" />
        </g>

        <ellipse cx={BASE.x} cy={BASE.y + 4} rx="36" ry="7" fill="rgba(0,0,0,0.28)" />

        <g key={wiggle} className={wiggle ? 'wx-flower-wiggle' : ''}>
          <g className="wx-flower-sway" style={swayStyle}>
            <path
              d={`M${BASE.x} ${BASE.y} Q${ctrl.x} ${ctrl.y} ${head.x.toFixed(1)} ${head.y.toFixed(1)}`}
              fill="none"
              stroke={stem}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <g transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)})`}>
              <path d="M0 0C8-9 22-8 30 0C22 7 8 8 0 0Z" fill={stem} transform={`rotate(${leafDroop.toFixed(1)})`} />
              <path d="M0 0C8-9 22-8 30 0C22 7 8 8 0 0Z" fill={stem} opacity="0.85" transform={`scale(-1 1) rotate(${(leafDroop + 8).toFixed(1)})`} />
            </g>

            <g transform={`translate(${head.x.toFixed(1)} ${head.y.toFixed(1)}) rotate(${(droop * 1.25).toFixed(1)})`}>
              <g transform={`scale(${(0.72 + 0.28 * h).toFixed(3)})`}>
                {Array.from({ length: 8 }, (_, i) => (
                  <ellipse
                    key={i}
                    cx="0"
                    cy="-15"
                    rx="7.5"
                    ry="13"
                    fill={petal}
                    stroke={petalEdge}
                    strokeWidth="1"
                    transform={`rotate(${i * 45})`}
                    className="wx-petal"
                    style={{ opacity: DROP_ORDER.indexOf(i) > -1 && DROP_ORDER.indexOf(i) < lost ? 0 : 1 }}
                  />
                ))}
                <circle r="8" fill={centre} />
                <circle r="8" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
              </g>

              {/* Petals falling off when the air is bad */}
              {h < 0.85 && <ellipse className="wx-petal-fall" cx="6" cy="8" rx="5" ry="8" fill={petal} />}
              {h < 0.5 && <ellipse className="wx-petal-fall wx-petal-fall--late" cx="-6" cy="6" rx="5" ry="8" fill={petal} />}
            </g>
          </g>
        </g>

        {/* Sparkles only when the air is clean */}
        {sparkle > 0 && (
          <g opacity={sparkle} fill="#FFF6C8">
            <path className="wx-sparkle" d="M108 30l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
            <path className="wx-sparkle wx-sparkle--b" d="M22 44l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" />
            <path className="wx-sparkle wx-sparkle--c" d="M100 86l1.2 3.6 3.6 1.2-3.6 1.2-1.2 3.6-1.2-3.6-3.6-1.2 3.6-1.2z" />
          </g>
        )}
      </svg>
    </button>
  );
}

// ---------- Card ----------

function Pollen({ pollen }: { pollen: AirQuality['pollen'] }) {
  if (!pollen) {
    return <p className="wx-air-note">Pollen counts aren't available here. Open-Meteo's pollen forecast covers Europe only.</p>;
  }
  const all = (Object.keys(pollen) as PollenKind[]).sort((a, b) => pollen[b]! - pollen[a]!);
  const kinds = all.filter((k) => pollenLevel(k, pollen[k]!) > 0);
  const absent = all.filter((k) => !kinds.includes(k));
  const top = kinds[0];
  const topLevel = top ? pollenLevel(top, pollen[top]!) : 0;

  return (
    <>
      <div className="wx-pollen-head">
        <span>Pollen</span>
        <span className="wx-pollen-overall" style={{ color: POLLEN_COLORS[topLevel] }}>
          {topLevel === 0 ? 'None right now' : `${POLLEN_LEVELS[topLevel]} · mostly ${POLLEN_LABELS[top].toLowerCase()}`}
        </span>
      </div>
      <ul className="wx-pollen">
        {kinds.map((k, i) => {
          const level = pollenLevel(k, pollen[k]!);
          return (
            <li key={k}>
              <span className="wx-pollen-name">{POLLEN_LABELS[k]}</span>
              <span className="wx-pollen-meter" aria-hidden="true">
                {[1, 2, 3, 4].map((n) => (
                  <span key={n} className="wx-grow" style={{ background: n <= level ? POLLEN_COLORS[level] : undefined, animationDelay: `${0.4 + i * 0.05 + n * 0.04}s` }} />
                ))}
              </span>
              <span className="wx-pollen-level">
                {POLLEN_LEVELS[level]}
                <span className="wx-visually-hidden">, {Math.round(pollen[k]!)} grains per cubic metre</span>
              </span>
            </li>
          );
        })}
      </ul>
      {absent.length > 0 && kinds.length > 0 && (
        <p className="wx-air-note">None detected: {absent.map((k) => POLLEN_LABELS[k].toLowerCase()).join(', ')}.</p>
      )}
    </>
  );
}

export function AirCard({ c }: { c: Condition }) {
  const air = c.air;
  const target = air ? healthFor(air.aqi) * 100 : 100;
  // Starts healthy, then wilts to the current level.
  const health = useCountUp(target, target - 100, 1800) / 100;

  if (!air) {
    return (
      <Card bg={c.cardBg} className="wx-rise wx-air" style={{ animationDelay: '0.34s' }}>
        <CardLabel icon="leaf">AIR QUALITY</CardLabel>
        <p className="wx-air-note">Air quality isn't available for this place right now.</p>
      </Card>
    );
  }

  const band = aqiBand(air.aqi);
  const pct = Math.min(1, air.aqi / 300) * 100;

  return (
    <Card bg={c.cardBg} className="wx-rise wx-air" style={{ animationDelay: '0.34s' }}>
      <CardLabel icon="leaf">AIR QUALITY</CardLabel>
      <div className="wx-air-main">
        <Flower health={health} />
        <div className="wx-air-read">
          <div className="wx-air-aqi">
            {air.aqi}
            <span>US AQI</span>
          </div>
          <div className="wx-air-band" style={{ color: band.color }}>
            {band.label}
          </div>
          <p className="wx-air-advice">{band.advice}</p>
        </div>
      </div>

      <div className="wx-aqi-bar" role="img" aria-label={`AQI ${air.aqi} on a scale of 0 to 300 or more`}>
        <div className="wx-dot" style={{ left: `${pct}%` }} />
      </div>
      <div className="wx-aqi-ticks" aria-hidden="true">
        {[0, 50, 100, 150, 200, 300].map((v) => (
          <span key={v} style={{ left: `${(v / 300) * 100}%` }}>
            {v === 300 ? '300+' : v}
          </span>
        ))}
      </div>

      <dl className="wx-pollutants">
        <div><dt>PM2.5</dt><dd>{air.pm25}</dd></div>
        <div><dt>PM10</dt><dd>{air.pm10}</dd></div>
        <div><dt>O₃</dt><dd>{air.o3}</dd></div>
        <div><dt>NO₂</dt><dd>{air.no2}</dd></div>
      </dl>
      <p className="wx-air-unit">µg/m³</p>

      <div className="wx-air-divider" />
      <Pollen pollen={air.pollen} />
    </Card>
  );
}
