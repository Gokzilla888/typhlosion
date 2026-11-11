import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { searchPlaces } from '../lib/openMeteo';
import type { Place, TempUnit, Units, WindUnit } from '../lib/types';
import { Icon } from './Icons';

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Slide-up sheet with a backdrop; Escape or the backdrop closes it. */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };
  const titleId = `nb-sheet-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className={`nb-sheet-wrap${open ? ' is-open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="nb-sheet-backdrop" onClick={onClose} />
      <div className="nb-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKeyDown}>
        <div className="nb-sheet-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="nb-round" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type Search = { status: 'idle' } | { status: 'loading' } | { status: 'done'; results: Place[] } | { status: 'error' };

interface PlaceSheetProps {
  open: boolean;
  current: Place;
  recent: Place[];
  locating: boolean;
  locateError: string | null;
  onUseLocation: () => void;
  onSelect: (p: Place) => void;
  onClose: () => void;
}

const same = (a: Place, b: Place) => Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01;

export function PlaceSheet({ open, current, recent, locating, locateError, onUseLocation, onSelect, onClose }: PlaceSheetProps) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<Search>({ status: 'idle' });
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => input.current?.focus(), 250);
      return () => window.clearTimeout(t);
    }
    setQuery('');
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSearch({ status: 'idle' });
      return;
    }
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      setSearch({ status: 'loading' });
      searchPlaces(q, ctrl.signal)
        .then((results) => setSearch({ status: 'done', results }))
        .catch((err: Error) => err.name !== 'AbortError' && setSearch({ status: 'error' }));
    }, 300);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const item = (p: Place, icon: 'pin' | 'clock' | 'locate') => (
    <li key={`${p.latitude},${p.longitude}`}>
      <button type="button" className={`nb-place${same(p, current) ? ' is-on' : ''}`} onClick={() => onSelect(p)}>
        <Icon name={icon} size={18} />
        <span>
          <span className="nb-place-name">{p.name}</span>
          {p.region && <span className="nb-place-region">{p.region}</span>}
        </span>
      </button>
    </li>
  );

  return (
    <Sheet open={open} title="Location" onClose={onClose}>
      <label className="nb-search">
        <Icon name="search" size={18} />
        <span className="nb-sr">Search for a city</span>
        <input ref={input} type="search" placeholder="SEARCH CITY" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <button type="button" className="nb-pill-btn" onClick={onUseLocation} disabled={locating}>
        <Icon name="locate" size={18} />
        {locating ? 'FINDING YOU…' : 'USE MY LOCATION'}
      </button>
      {locateError && (
        <p className="nb-note" role="alert">
          {locateError}
        </p>
      )}
      <div className="nb-sheet-list" aria-live="polite">
        {search.status === 'loading' && <p className="nb-note">SEARCHING…</p>}
        {search.status === 'error' && <p className="nb-note">City search is unavailable right now.</p>}
        {search.status === 'done' &&
          (search.results.length ? <ul>{search.results.map((p) => item(p, 'pin'))}</ul> : <p className="nb-note">No cities match “{query.trim()}”.</p>)}
        {search.status === 'idle' && recent.length > 0 && (
          <>
            <h3 className="nb-label">RECENT</h3>
            <ul>{recent.map((p) => item(p, p.isCurrent ? 'locate' : 'clock'))}</ul>
          </>
        )}
      </div>
    </Sheet>
  );
}

interface SettingsSheetProps {
  open: boolean;
  units: Units;
  onUnits: (u: Units) => void;
  onLocation: () => void;
  onRefresh: () => void;
  updated: string;
  onClose: () => void;
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="nb-setting">
      <span className="nb-label">{label}</span>
      <div className="nb-seg" role="group" aria-label={label}>
        {options.map(([v, text]) => (
          <button key={v} type="button" aria-pressed={v === value} className={v === value ? 'is-on' : ''} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsSheet({ open, units, onUnits, onLocation, onRefresh, updated, onClose }: SettingsSheetProps) {
  return (
    <Sheet open={open} title="Settings" onClose={onClose}>
      <Segmented<TempUnit> label="TEMPERATURE" value={units.temp} options={[['C', '°C'], ['F', '°F']]} onChange={(temp) => onUnits({ ...units, temp })} />
      <Segmented<WindUnit> label="WIND" value={units.wind} options={[['kmh', 'KM/H'], ['ms', 'M/S'], ['mph', 'MPH']]} onChange={(wind) => onUnits({ ...units, wind })} />
      <button type="button" className="nb-pill-btn" onClick={onLocation}>
        <Icon name="pin" size={18} />
        CHANGE LOCATION
      </button>
      <button type="button" className="nb-pill-btn nb-pill-btn--ghost" onClick={onRefresh}>
        <Icon name="refresh" size={18} />
        REFRESH
      </button>
      <p className="nb-note">
        {updated}. Weather and air quality by <a href="https://open-meteo.com">Open-Meteo.com</a>.
      </p>
    </Sheet>
  );
}
