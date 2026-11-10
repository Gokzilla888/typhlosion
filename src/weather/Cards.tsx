import { useState, type CSSProperties, type ReactNode } from 'react';
import { clamp01, DAY_NAMES, formatTemp, hourLabel, ICON_LABELS, type Condition, type Unit } from './data';
import { UiIcon, WeatherIcon, type UI_ICONS } from './Icon';

interface CardProps {
  bg: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** Frosted-glass card used by every section. */
export function Card({ bg, className = '', style, children }: CardProps) {
  return (
    <section className={`wx-card ${className}`} style={{ background: bg, ...style }}>
      {children}
    </section>
  );
}

export function CardLabel({ icon, children }: { icon: keyof typeof UI_ICONS; children: ReactNode }) {
  return (
    <div className="wx-card-label">
      <UiIcon name={icon} />
      {children}
    </div>
  );
}

interface SectionProps {
  c: Condition;
  unit: Unit;
}

interface HourlyCardProps extends SectionProps {
  selected: number;
  onSelect: (index: number) => void;
}

export function HourlyCard({ c, unit, selected, onSelect }: HourlyCardProps) {
  return (
    <Card bg={c.cardBg} className="wx-rise wx-hourly" style={{ animationDelay: '0.15s' }}>
      <div className="wx-hourly-summary">{c.summary}</div>
      <div className="wx-hscroll" role="group" aria-label="Hourly forecast. Pick an hour to preview it.">
        {c.hours.map((icon, i) => {
          const time = i === 0 ? 'Now' : hourLabel(c.startHour + i);
          return (
            <button
              key={i}
              type="button"
              className={`wx-hour${i === selected ? ' wx-hour--on' : ''}`}
              aria-pressed={i === selected}
              aria-label={`${time}, ${formatTemp(c.temp + c.hourDelta[i], unit)}${c.hourPop[i] ? `, ${c.hourPop[i]}% chance of precipitation` : ''}`}
              onClick={() => onSelect(i)}
              style={{ animationDelay: `${0.25 + Math.min(i, 10) * 0.04}s` }}
            >
              <div className="wx-hour-time">{time}</div>
              <span className="wx-hour-icon">
                <WeatherIcon name={icon} size={26} />
              </span>
              <div className="wx-pop">{c.hourPop[i] ? `${c.hourPop[i]}%` : ''}</div>
              <div className="wx-hour-temp">{formatTemp(c.temp + c.hourDelta[i], unit)}</div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function DailyCard({ c, unit }: SectionProps) {
  const [open, setOpen] = useState<number | null>(null);
  const weekMin = Math.min(...c.days.map((d) => d[1]));
  const weekMax = Math.max(...c.days.map((d) => d[2]));
  const span = Math.max(1, weekMax - weekMin);
  const names = c.dayNames ?? DAY_NAMES;

  return (
    <Card bg={c.cardBg} className="wx-rise wx-daily" style={{ animationDelay: '0.28s' }}>
      <CardLabel icon="calendar">7-DAY FORECAST</CardLabel>
      {c.days.map(([icon, lo, hi, pop], i) => {
        const left = ((lo - weekMin) / span) * 100;
        const width = ((hi - lo) / span) * 100;
        const dot = left + width * clamp01((c.temp - lo) / Math.max(1, hi - lo));
        const isOpen = open === i;
        const detail = c.dayDetails?.[i];
        const panelId = `wx-day-${c.scene}-${i}`;
        return (
          <div key={i} className={`wx-day${isOpen ? ' wx-day--open' : ''}`}>
            <button type="button" className="wx-day-row" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpen(isOpen ? null : i)}>
              <div className="wx-day-name">{names[i]}</div>
              <WeatherIcon name={icon} />
              <div className="wx-pop">{pop ? `${pop}%` : ''}</div>
              <div className="wx-day-lo">{formatTemp(lo, unit)}</div>
              <div className="wx-range">
                <div className="wx-range-fill wx-grow" style={{ left: `${left}%`, width: `${width}%`, animationDelay: `${0.5 + i * 0.07}s` }} />
                {i === 0 && <div className="wx-dot wx-fade-in" style={{ left: `${dot}%`, animationDelay: '1.2s' }} />}
              </div>
              <div className="wx-day-hi">{formatTemp(hi, unit)}</div>
            </button>
            <div id={panelId} className="wx-day-panel" role="region" aria-label={`${names[i]} details`} hidden={!isOpen}>
              <div className="wx-day-panel-inner">
                <div className="wx-day-desc">
                  {detail?.desc ?? ICON_LABELS[icon]}. High {formatTemp(hi, unit)}, low {formatTemp(lo, unit)}.
                </div>
                <dl className="wx-day-facts">
                  <div><dt>Chance of rain</dt><dd>{pop}%</dd></div>
                  {detail?.precipMm != null && <div><dt>Precipitation</dt><dd>{detail.precipMm} mm</dd></div>}
                  {detail?.windMax != null && <div><dt>Max wind</dt><dd>{detail.windMax} km/h</dd></div>}
                  {detail?.uvMax != null && <div><dt>Max UV</dt><dd>{detail.uvMax}</dd></div>}
                  {detail?.sunrise && <div><dt>Sunrise</dt><dd>{detail.sunrise}</dd></div>}
                  {detail?.sunset && <div><dt>Sunset</dt><dd>{detail.sunset}</dd></div>}
                </dl>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function Tile({ c, icon, label, children }: { c: Condition; icon: keyof typeof UI_ICONS; label: string; children: ReactNode }) {
  return (
    <Card bg={c.cardBg} className="wx-tile">
      <CardLabel icon={icon}>{label}</CardLabel>
      {children}
    </Card>
  );
}

export function DetailTiles({ c, unit }: SectionProps) {
  // The arrow points where the wind is blowing to.
  const windArrowDeg = (c.windDeg + 180) % 360;
  const uvPct = Math.min(1, c.uv / 11) * 100;

  return (
    <div className="wx-rise wx-tiles" style={{ animationDelay: '0.4s' }}>
      <Tile c={c} icon="thermometer" label="FEELS LIKE">
        <div className="wx-tile-value">{formatTemp(c.feels, unit)}</div>
        <div className="wx-tile-note">{c.feelsNote}</div>
      </Tile>

      <Tile c={c} icon="droplet" label="HUMIDITY">
        <div className="wx-tile-value">{c.humidity}%</div>
        <div className="wx-tile-note">Dew point is {formatTemp(c.dew, unit)} right now.</div>
      </Tile>

      <Tile c={c} icon="wind" label="WIND">
        <div className="wx-wind">
          <div className="wx-compass">
            <div className="wx-compass-n">N</div>
            <div className="wx-compass-needle" style={{ transform: `rotate(${windArrowDeg}deg)` }}>
              <svg className="wx-needle-sway" style={{ animationDuration: `${Math.max(0.8, 4 - c.gust / 15).toFixed(2)}s` }} width="59" height="59" viewBox="0 0 64 64" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M32 48V18M26 25l6-8 6 8" />
              </svg>
            </div>
          </div>
          <div>
            <div className="wx-wind-speed">{c.wind}</div>
            <div className="wx-wind-unit">km/h</div>
          </div>
        </div>
        <div className="wx-tile-note">
          Gusts {c.gust} km/h · {c.windDir}
        </div>
      </Tile>

      <Tile c={c} icon="sun" label="UV INDEX">
        <div className="wx-tile-value" style={{ lineHeight: 1 }}>{c.uv}</div>
        <div className="wx-uv-label">{c.uvLabel}</div>
        <div className="wx-uv-bar">
          <div className="wx-dot" style={{ left: `${uvPct}%` }} />
        </div>
      </Tile>

      <Tile c={c} icon="eye" label="VISIBILITY">
        <div className="wx-tile-value">{c.visibility} km</div>
        <div className="wx-tile-note">{c.visNote}</div>
      </Tile>

      <Tile c={c} icon="gauge" label="PRESSURE">
        <div className="wx-tile-value">{c.pressure}</div>
        <div className="wx-tile-note">hPa · {c.pressureNote}</div>
      </Tile>
    </div>
  );
}

export function SunCard({ c }: { c: Condition }) {
  const p = c.sunProgress;
  const sunX = 160 - 144 * Math.cos(Math.PI * p);
  const sunY = 100 - 84 * Math.sin(Math.PI * p);
  const arc = 'M16 100A144 84 0 0 1 304 100';

  return (
    <Card bg={c.cardBg} className="wx-rise wx-sun-card" style={{ animationDelay: '0.52s' }}>
      <CardLabel icon="sunrise">SUNRISE &amp; SUNSET</CardLabel>
      <svg className="wx-sun-arc" width="312" height="118" viewBox="0 0 320 120" aria-hidden="true">
        <line x1="0" y1="100" x2="320" y2="100" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
        <path d={arc} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth={2} strokeDasharray="3 6" />
        <path className="wx-fade-in" d={arc} fill="none" stroke="#FFD166" strokeWidth={2.5} strokeLinecap="round" pathLength={100} strokeDasharray={`${p * 100} 100`} />
        <circle cx={sunX} cy={sunY} r={16} fill="rgba(255,209,102,0.25)" />
        <circle cx={sunX} cy={sunY} r={8} fill="#FFD166" />
      </svg>
      <div className="wx-sun-times">
        <div>
          <div className="wx-sun-time-label">Sunrise</div>
          <div className="wx-sun-time">{c.sunrise}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="wx-sun-time-label">Sunset</div>
          <div className="wx-sun-time">{c.sunset}</div>
        </div>
      </div>
    </Card>
  );
}
