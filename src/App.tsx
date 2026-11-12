import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon } from './components/Icons';
import { PlaceSheet } from './components/Sheets';
import { Sky } from './components/Sky';
import { describe, intensityFor, skyFor, toTemp } from './lib/format';
import { DEFAULT_PLACE, fetchForecast, getDevicePosition, placeFromCoords } from './lib/openMeteo';
import type { Forecast, Place, TempUnit, Units } from './lib/types';
import { SKY_THEMES } from './lib/skies';
import { useCountUp } from './lib/useCountUp';
import { WeatherPage } from './pages/WeatherPage';
import './styles.css';

const REFRESH_MS = 15 * 60 * 1000;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable; settings still apply this session.
  }
}

type Status = { kind: 'loading' } | { kind: 'ready'; forecast: Forecast } | { kind: 'error' };

interface ForecastViewProps {
  forecast: Forecast;
  units: Units;
  onUnit: (u: TempUnit) => void;
  onPlace: () => void;
  onScroll: (y: number) => void;
}

/** The top bar and the scrolling forecast. */
function ForecastView({ forecast: f, units, onUnit, onPlace, onScroll }: ForecastViewProps) {
  const shown = Math.round(toTemp(useCountUp(f.now.temp, 8), units.temp));
  const condition = describe(f.now.code, f.now.isDay);

  return (
    <>
      <div className="nb-scroller" onScroll={(e) => onScroll(e.currentTarget.scrollTop)}>
        <WeatherPage forecast={f} units={units} shownTemp={shown} />
      </div>

      <header className="nb-bar">
        <div className="nb-bar-place">
          <button type="button" className="nb-city" onClick={onPlace} aria-label={`${f.place.name}. Change city`}>
            <Icon name="pin" size={18} />
            <span>{f.place.name}</span>
            <Icon name="chevronDown" size={16} />
          </button>
          {/* Takes over from the big temperature once it has scrolled away. */}
          <span className="nb-compact" aria-hidden="true">
            {shown}° · {condition}
          </span>
        </div>
        <div className="nb-units" role="group" aria-label="Temperature unit">
          {(['C', 'F'] as const).map((u) => (
            <button key={u} type="button" aria-pressed={units.temp === u} aria-label={u === 'C' ? 'Show Celsius' : 'Show Fahrenheit'} onClick={() => onUnit(u)}>
              °{u}
            </button>
          ))}
        </div>
      </header>
    </>
  );
}

export default function App() {
  const [place, setPlace] = useState<Place | null>(() => load<Place | null>('nb-place', null));
  const [recent, setRecent] = useState<Place[]>(() => load<Place[]>('nb-recent', []));
  const [units, setUnits] = useState<Units>(() => ({ temp: load<Units>('nb-units', { temp: 'C' }).temp }));
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const phone = useRef<HTMLDivElement>(null);
  const request = useRef(0);

  const choose = useCallback((p: Place) => {
    setPlace(p);
    save('nb-place', p);
    setRecent((list) => {
      const next = [p, ...list.filter((r) => r.name !== p.name || r.region !== p.region)].slice(0, 5);
      save('nb-recent', next);
      return next;
    });
  }, []);

  const locate = useCallback(async () => {
    setLocating(true);
    setLocateError(null);
    try {
      choose(await placeFromCoords(await getDevicePosition()));
      setSheetOpen(false);
      return true;
    } catch (err) {
      setLocateError((err as Error).message);
      return false;
    } finally {
      setLocating(false);
    }
  }, [choose]);

  // First launch: try GPS, otherwise fall back to a default city.
  useEffect(() => {
    if (place) return;
    locate().then((ok) => {
      if (!ok) {
        choose(DEFAULT_PLACE);
        setToast(`Couldn't get your location, so this is ${DEFAULT_PLACE.name}. Tap the city to change it.`);
      }
    });
    // Runs once on first launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async (p: Place, quiet: boolean) => {
    const id = ++request.current;
    if (!quiet) setStatus({ kind: 'loading' });
    try {
      const forecast = await fetchForecast(p);
      if (id !== request.current) return;
      setStatus({ kind: 'ready', forecast });
    } catch {
      if (id !== request.current) return;
      if (quiet) setToast('Could not refresh. Showing the last forecast.');
      else setStatus({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    if (!place) return;
    refresh(place, false);
    const timer = window.setInterval(() => refresh(place, true), REFRESH_MS);
    const onVisible = () => document.visibilityState === 'visible' && refresh(place, true);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [place, refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Scroll position drives the hero, sun and top bar through CSS, without re-rendering.
  const setScroll = useCallback((y: number) => phone.current?.style.setProperty('--y', y.toFixed(1)), []);
  // A new forecast view starts at the top.
  useEffect(() => setScroll(0), [status.kind, setScroll]);

  const changeUnit = (temp: TempUnit) => {
    setUnits({ temp });
    save('nb-units', { temp });
  };

  const now = status.kind === 'ready' ? status.forecast.now : null;
  const sky = now ? skyFor(now.code, now.isDay) : 'cloudy';

  return (
    <main className="nb-app">
      <div className="nb-phone" ref={phone} style={{ '--card': SKY_THEMES[sky].card } as CSSProperties}>
        <h1 className="nb-sr">{status.kind === 'ready' ? `Weather for ${status.forecast.place.name}` : 'Weather'}</h1>
        <Sky kind={sky} intensity={now ? intensityFor(now.code) : 1} />

        {status.kind === 'ready' ? (
          <ForecastView
            // Replays the entrance and count-up for each city.
            key={`${status.forecast.place.latitude},${status.forecast.place.longitude}`}
            forecast={status.forecast}
            units={units}
            onUnit={changeUnit}
            onPlace={() => setSheetOpen(true)}
            onScroll={setScroll}
          />
        ) : (
          <div className="nb-state">
            {status.kind === 'loading' ? (
              <p className="nb-state-text" role="status">
                {locating ? 'Finding your location…' : place ? `Loading ${place.name}…` : 'Loading…'}
              </p>
            ) : (
              <>
                <p className="nb-state-text" role="alert">
                  Could not load the weather. Check your connection and try again.
                </p>
                <button type="button" className="nb-pill-btn" onClick={() => place && refresh(place, false)}>
                  Try again
                </button>
                <button type="button" className="nb-pill-btn nb-pill-btn--ghost" onClick={() => setSheetOpen(true)}>
                  Choose a city
                </button>
              </>
            )}
          </div>
        )}

        <PlaceSheet
          open={sheetOpen}
          current={place ?? DEFAULT_PLACE}
          recent={recent}
          locating={locating}
          locateError={locateError}
          onUseLocation={locate}
          onSelect={(p) => {
            choose(p);
            setSheetOpen(false);
          }}
          onClose={() => setSheetOpen(false)}
        />
        {toast && (
          <div className="nb-toast" role="status">
            {toast}
          </div>
        )}
      </div>
    </main>
  );
}
