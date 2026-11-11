import type { CSSProperties } from 'react';
import { Numerals } from '../components/Numerals';
import { Scene } from '../components/Scene';
import { describe, fmtDeg, hourLong, hourShort, intensityFor, localDate, sceneFor, toTemp } from '../lib/format';
import type { Forecast, Units } from '../lib/types';
import { useCountUp } from '../lib/useCountUp';
import { alertsFor } from '../lib/alerts';
import type { PageDef, Selection } from './metrics';

interface NowPageProps {
  forecast: Forecast;
  selection: Selection;
  units: Units;
  onHour: (index: number) => void;
  onAlert: (page: PageDef['key']) => void;
  onMenu: () => void;
}

export function NowPage({ forecast: f, selection: s, units, onHour, onAlert, onMenu }: NowPageProps) {
  const hour = s.mode === 'day' ? s.hour : null;
  const code = hour ? hour.code : s.day.code;
  const isDay = hour ? hour.isDay : true;
  const temp = hour ? hour.temp : s.day.hi;
  const shown = Math.round(toTemp(useCountUp(temp, 6), units.temp));
  const alerts = alertsFor(f);

  // Timeline: where the highest and lowest temperatures fall in the next 24 hours.
  const temps = f.hours.map((h) => h.temp);
  const hiI = temps.indexOf(Math.max(...temps));
  const loI = temps.indexOf(Math.min(...temps));
  const n = f.hours.length - 1;
  const at = (i: number) => `${(i / n) * 100}%`;
  // Ticks on clock hours divisible by 3, like 12P 3 6 9 12A.
  const ticks = f.hours
    .map((h, i) => ({ i, hour: localDate(h.time).getUTCHours(), time: h.time }))
    .filter(({ i, hour }) => i === 0 || (hour % 3 === 0 && i > 2 && i < n))
    .map(({ i, hour, time }) => ({ i, label: i === 0 ? 'NOW' : hour % 12 === 0 ? hourShort(time) : String(hour % 12) }));
  const index = s.mode === 'day' ? s.index : 0;

  return (
    <div className="nb-now">
      <div className="nb-alert-slot">
        {alerts.length > 0 && (
          <button type="button" className="nb-alert" onClick={() => onAlert(alerts[0].page)}>
            ! {alerts[0].text}
            {alerts.length > 1 ? ` + ${alerts.length - 1}` : ''} !
          </button>
        )}
      </div>

      <div className="nb-hero">
        <Scene kind={sceneFor(code, isDay)} wind={hour ? hour.wind : s.day.windMax} intensity={intensityFor(code)} aqi={hour ? hour.aqi : s.day.aqi} />
        <Numerals value={String(shown)} label={`${shown} degrees`} size={300} maxVh={37} />
      </div>
      <h2 key={describe(code, isDay)} className="nb-condition nb-swap">
        {describe(code, isDay)}
      </h2>

      <div className="nb-timeline">
        <div className="nb-timeline-track" style={{ '--p': at(index) } as CSSProperties}>
          <span className="nb-timeline-fill" />
          <span className="nb-badge" style={{ left: at(hiI) }}>
            {fmtDeg(temps[hiI], units).replace('°', '')}
          </span>
          <span className="nb-badge nb-badge--lo" style={{ left: at(loI) }}>
            {fmtDeg(temps[loI], units).replace('°', '')}
          </span>
          <span className="nb-timeline-knob" />
          <input
            type="range"
            min={0}
            max={n}
            value={index}
            aria-label="Pick an hour"
            aria-valuetext={index === 0 ? 'Now' : hourLong(f.hours[index].time)}
            onChange={(e) => onHour(Number(e.target.value))}
          />
        </div>
        <button type="button" className="nb-kebab" aria-label="Settings" onClick={onMenu}>
          <span />
          <span />
          <span />
        </button>
        <div className="nb-timeline-ticks" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t.i} style={{ left: at(t.i) }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
