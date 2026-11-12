import type { ReactNode } from 'react';
import { clock, fmtDeg, hourLabel, minutesOf, sceneFor, weekday } from '../lib/format';
import type { Day, Hour, Units } from '../lib/types';
import { Icon, WeatherIcon, type IconName } from './Icons';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const pop = (v: number) => (Math.round(v) > 0 ? `${Math.round(v)}%` : '');

/** Small uppercase heading with an icon, at the top of a card. */
export function CardLabel({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <h3 className="nb-card-label">
      <Icon name={icon} size={15} />
      {children}
    </h3>
  );
}

/** Square glass tile for one reading. */
export function Tile({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <section className="nb-card nb-tile">
      <CardLabel icon={icon}>{label}</CardLabel>
      {children}
    </section>
  );
}

/** Summary sentence over a sideways-scrolling hour-by-hour strip. */
export function HourlyCard({ summary, hours, units }: { summary: string; hours: Hour[]; units: Units }) {
  return (
    <section className="nb-card nb-hourly nb-rise" style={{ animationDelay: '0.15s' }} aria-label="Hourly forecast">
      <p className="nb-summary">{summary}</p>
      <ul className="nb-hours">
        {hours.map((h, i) => (
          <li key={h.time} className={i === 0 ? 'is-now' : ''}>
            <span className="nb-hour-time">{i === 0 ? 'Now' : hourLabel(h.time)}</span>
            <WeatherIcon kind={sceneFor(h.code, h.isDay)} size={26} />
            <span className="nb-pop">{pop(h.pop)}</span>
            <span className="nb-hour-temp">{fmtDeg(h.temp, units)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Seven days, each with its low–high range drawn on the week's shared scale. */
export function DailyCard({ days, now, units }: { days: Day[]; now: number; units: Units }) {
  const min = Math.min(...days.map((d) => d.lo));
  const span = Math.max(1, Math.max(...days.map((d) => d.hi)) - min);
  return (
    <section className="nb-card nb-daily nb-rise" style={{ animationDelay: '0.28s' }}>
      <CardLabel icon="calendar">7-DAY FORECAST</CardLabel>
      <ul>
        {days.map((d, i) => {
          const left = ((d.lo - min) / span) * 100;
          const width = ((d.hi - d.lo) / span) * 100;
          const dot = left + width * clamp01((now - d.lo) / Math.max(1, d.hi - d.lo));
          return (
            <li key={d.date}>
              <span className="nb-day-name">{i === 0 ? 'Today' : weekday(d.date)}</span>
              <WeatherIcon kind={sceneFor(d.code)} />
              <span className="nb-pop">{pop(d.pop)}</span>
              <span className="nb-day-lo">{fmtDeg(d.lo, units)}</span>
              <span className="nb-range">
                <span className="nb-range-fill nb-grow" style={{ left: `${left}%`, width: `${width}%`, animationDelay: `${0.5 + i * 0.07}s` }} />
                {i === 0 && <span className="nb-range-dot nb-fade" style={{ left: `${dot}%`, animationDelay: '1.2s' }} />}
              </span>
              <span className="nb-day-hi">{fmtDeg(d.hi, units)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Compass dial with an arrow pointing the way the wind is blowing. */
export function WindDial({ from }: { from: number }) {
  return (
    <div className="nb-dial" aria-hidden="true">
      <span>N</span>
      <div style={{ transform: `rotate(${(from + 180) % 360}deg)` }}>
        <svg width="59" height="59" viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 48V18M26 25l6-8 6 8" />
        </svg>
      </div>
    </div>
  );
}

/** Green-to-purple UV scale (0–11+) with a marker. */
export function UvScale({ uv }: { uv: number }) {
  return (
    <div className="nb-uv" aria-hidden="true">
      <span style={{ left: `${clamp01(uv / 11) * 100}%` }} />
    </div>
  );
}

/** The sun's path from sunrise to sunset, filled up to the current time. */
export function SunCard({ day, time }: { day: Day; time: string }) {
  const rise = minutesOf(day.sunrise);
  const p = clamp01((minutesOf(time) - rise) / Math.max(1, minutesOf(day.sunset) - rise));
  const x = 160 - 144 * Math.cos(Math.PI * p);
  const y = 100 - 84 * Math.sin(Math.PI * p);
  const arc = 'M16 100A144 84 0 0 1 304 100';
  return (
    <section className="nb-card nb-sun-card nb-rise" style={{ animationDelay: '0.52s' }}>
      <CardLabel icon="sunrise">SUNRISE &amp; SUNSET</CardLabel>
      <svg className="nb-arc" viewBox="0 0 320 120" aria-hidden="true">
        <line x1="0" y1="100" x2="320" y2="100" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <path d={arc} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="2" strokeDasharray="3 6" />
        <path className="nb-fade" d={arc} fill="none" stroke="#FFD166" strokeWidth="2.5" strokeLinecap="round" pathLength={100} strokeDasharray={`${p * 100} 100`} />
        <circle cx={x} cy={y} r="16" fill="rgba(255,209,102,0.25)" />
        <circle cx={x} cy={y} r="8" fill="#FFD166" />
      </svg>
      <dl className="nb-sun-times">
        <div>
          <dt>Sunrise</dt>
          <dd>{clock(day.sunrise)}</dd>
        </div>
        <div>
          <dt>Sunset</dt>
          <dd>{clock(day.sunset)}</dd>
        </div>
      </dl>
    </section>
  );
}
