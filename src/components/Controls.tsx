import type { CSSProperties } from 'react';
import type { Mode } from '../lib/types';

interface ScrubberProps {
  value: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
  valueText: string;
}

/** Dotted timeline track with a knob. */
export function Scrubber({ value, max, onChange, label, valueText }: ScrubberProps) {
  return (
    <input
      className="nb-scrub"
      type="range"
      min={0}
      max={max}
      step={1}
      value={value}
      aria-label={label}
      aria-valuetext={valueText}
      style={{ '--p': `${max ? (value / max) * 100 : 0}%` } as CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

/** DAY / WEEK switch. */
export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const week = mode === 'week';
  return (
    <div className="nb-toggle">
      <span className={week ? '' : 'is-on'} aria-hidden="true">
        DAY
      </span>
      <button type="button" role="switch" aria-checked={week} aria-label="Show the week" className="nb-switch" onClick={() => onChange(week ? 'day' : 'week')}>
        <span />
      </button>
      <span className={week ? 'is-on' : ''} aria-hidden="true">
        WEEK
      </span>
    </div>
  );
}

export interface Row {
  key: string;
  label: string;
  value: string;
}

/** Monospaced data table; the selected row is the charted one. */
export function DataTable({ rows, selected, onSelect }: { rows: Row[]; selected: string; onSelect: (key: string) => void }) {
  return (
    <ul className="nb-table">
      {rows.map((r) => (
        <li key={r.key}>
          <button type="button" className={r.key === selected ? 'is-on' : ''} aria-pressed={r.key === selected} onClick={() => onSelect(r.key)}>
            <span>{r.label}</span>
            <span>{r.value}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
