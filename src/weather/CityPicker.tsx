import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { UiIcon } from './Icon';
import { searchPlaces, type Place } from './openMeteo';

interface CityPickerProps {
  open: boolean;
  current: Place;
  recent: Place[];
  locating: boolean;
  locateError: string | null;
  onUseLocation: () => void;
  onSelect: (place: Place) => void;
  onClose: () => void;
}

type SearchState = { status: 'idle' } | { status: 'loading' } | { status: 'done'; results: Place[] } | { status: 'error'; message: string };

const samePlace = (a: Place, b: Place) => Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01;

/** Bottom sheet for picking a city: GPS, search, and recent places. */
export function CityPicker({ open, current, recent, locating, locateError, onUseLocation, onSelect, onClose }: CityPickerProps) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 250);
      return () => window.clearTimeout(t);
    }
    setQuery('');
    setSearch({ status: 'idle' });
  }, [open]);

  // Search as the person types, after a short pause.
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
        .catch((err: Error) => {
          if (err.name !== 'AbortError') setSearch({ status: 'error', message: 'City search is unavailable right now.' });
        });
    }, 300);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };

  const renderPlace = (p: Place, icon: 'pin' | 'clock' | 'locate', i: number) => (
    <li key={`${p.latitude},${p.longitude}`} style={{ animationDelay: `${i * 0.04}s` }}>
      <button type="button" className={`wx-place${samePlace(p, current) ? ' wx-place--on' : ''}`} onClick={() => onSelect(p)}>
        <UiIcon name={icon} size={18} />
        <span className="wx-place-text">
          <span className="wx-place-name">{p.name}</span>
          {p.region && <span className="wx-place-region">{p.region}</span>}
        </span>
      </button>
    </li>
  );

  return (
    <div className={`wx-sheet-wrap${open ? ' is-open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="wx-sheet-backdrop" onClick={onClose} />
      <div className="wx-sheet" role="dialog" aria-modal="true" aria-labelledby="wx-sheet-title" onKeyDown={onKeyDown}>
        <div className="wx-sheet-grip" aria-hidden="true" />
        <div className="wx-sheet-head">
          <h2 id="wx-sheet-title">Choose a city</h2>
          <button type="button" className="wx-icon-btn" aria-label="Close" onClick={onClose}>
            <UiIcon name="close" size={20} />
          </button>
        </div>

        <label className="wx-search">
          <span className="wx-visually-hidden">Search for a city</span>
          <UiIcon name="search" size={18} />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search for a city"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <button type="button" className="wx-locate" onClick={onUseLocation} disabled={locating}>
          <span className={locating ? 'wx-pulse-icon' : ''}>
            <UiIcon name="locate" size={18} />
          </span>
          {locating ? 'Finding your location…' : 'Use my current location'}
        </button>
        {locateError && (
          <p className="wx-sheet-note" role="alert">
            {locateError}
          </p>
        )}

        <div className="wx-sheet-list" aria-live="polite">
          {search.status === 'loading' && <p className="wx-sheet-note">Searching…</p>}
          {search.status === 'error' && <p className="wx-sheet-note">{search.message}</p>}
          {search.status === 'done' &&
            (search.results.length ? (
              <ul>{search.results.map((p, i) => renderPlace(p, 'pin', i))}</ul>
            ) : (
              <p className="wx-sheet-note">No cities match “{query.trim()}”.</p>
            ))}
          {search.status === 'idle' && recent.length > 0 && (
            <>
              <h3 className="wx-sheet-sub">Recent</h3>
              <ul>{recent.map((p, i) => renderPlace(p, p.isCurrent ? 'locate' : 'clock', i))}</ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
