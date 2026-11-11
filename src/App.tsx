import { useCallback, useEffect, useRef, useState } from 'react';
import { Anemometer } from './components/Anemometer';
import { Flower } from './components/Flower';
import { Numerals } from './components/Numerals';
import { Raindrop } from './components/Raindrop';
import { Scene } from './components/Scene';
import { PlaceSheet, SettingsSheet } from './components/Sheets';
import { flowerHealth, selectionLabel, toTemp } from './lib/format';
import { DEFAULT_PLACE, fetchForecast, getDevicePosition, placeFromCoords } from './lib/openMeteo';
import type { Forecast, Mode, Place, Units } from './lib/types';
import { useCountUp } from './lib/useCountUp';
import { DetailPage } from './pages/DetailPage';
import { AIR_PAGE, AQI_PAGE, PRECIP_PAGE, select, TEMP_PAGE, type PageDef, type Selection } from './pages/metrics';
import { NowPage } from './pages/NowPage';
import './styles.css';

const PAGES: { key: PageDef['key']; name: string }[] = [
  { key: 'now', name: 'Now' },
  { key: 'temp', name: 'Temp' },
  { key: 'air', name: 'Air' },
  { key: 'precip', name: 'Precip' },
  { key: 'aqi', name: 'AQI' },
];
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

function TempArt({ selection: s, units }: { selection: Selection; units: Units }) {
  const t = s.mode === 'day' ? s.hour.temp : s.day.hi;
  const shown = Math.round(toTemp(useCountUp(t, 6), units.temp));
  return <Numerals value={String(shown)} label={`${shown} degrees`} size={230} maxVh={27} />;
}

export default function App() {
  const [place, setPlace] = useState<Place | null>(() => load<Place | null>('nb-place', null));
  const [recent, setRecent] = useState<Place[]>(() => load<Place[]>('nb-recent', []));
  const [units, setUnits] = useState<Units>(() => load<Units>('nb-units', { temp: 'C', wind: 'kmh' }));
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [mode, setMode] = useState<Mode>('day');
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [sheet, setSheet] = useState<'place' | 'settings' | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const pager = useRef<HTMLDivElement>(null);
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
      setSheet(null);
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
    setIndex(0);
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

  const goTo = (i: number) => {
    const el = pager.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };
  const onPagerScroll = () => {
    const el = pager.current;
    if (el) setPage(Math.round(el.scrollLeft / el.clientWidth));
  };
  const changeMode = (m: Mode) => {
    setMode(m);
    setIndex(0);
  };
  const changeUnits = (u: Units) => {
    setUnits(u);
    save('nb-units', u);
  };

  const sheets = (
    <>
      <PlaceSheet
        open={sheet === 'place'}
        current={place ?? DEFAULT_PLACE}
        recent={recent}
        locating={locating}
        locateError={locateError}
        onUseLocation={locate}
        onSelect={(p) => {
          choose(p);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      <SettingsSheet
        open={sheet === 'settings'}
        units={units}
        onUnits={changeUnits}
        onLocation={() => setSheet('place')}
        onRefresh={() => {
          if (place) refresh(place, true);
          setSheet(null);
        }}
        updated={status.kind === 'ready' ? `Updated ${status.forecast.fetchedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Not loaded yet'}
        onClose={() => setSheet(null)}
      />
      {toast && (
        <div className="nb-toast" role="status">
          {toast}
        </div>
      )}
    </>
  );

  if (status.kind !== 'ready') {
    return (
      <main className="nb-app">
        <div className="nb-phone nb-state">
          <h1 className="nb-sr">Weather</h1>
          <Scene kind="cloud" wind={20} intensity={1} aqi={null} />
          {status.kind === 'loading' ? (
            <p className="nb-label" role="status">
              {locating ? 'FINDING YOUR LOCATION…' : place ? `LOADING ${place.name.toUpperCase()}…` : 'LOADING…'}
            </p>
          ) : (
            <>
              <p className="nb-note" role="alert">
                Could not load the weather. Check your connection and try again.
              </p>
              <button type="button" className="nb-pill-btn" onClick={() => place && refresh(place, false)}>
                TRY AGAIN
              </button>
              <button type="button" className="nb-pill-btn nb-pill-btn--ghost" onClick={() => setSheet('place')}>
                CHOOSE A CITY
              </button>
            </>
          )}
          {sheets}
        </div>
      </main>
    );
  }

  const f = status.forecast;
  const safeIndex = Math.min(index, mode === 'day' ? f.hours.length - 1 : f.days.length - 1);
  const sel = select(f, mode, safeIndex);
  const health = flowerHealth(sel.mode === 'day' ? sel.hour.aqi : sel.day.aqi);
  const detail = (def: PageDef) => (
    <DetailPage
      page={def}
      forecast={f}
      selection={sel}
      units={units}
      onIndex={setIndex}
      onMode={changeMode}
      art={
        def.key === 'temp' ? (
          <TempArt selection={sel} units={units} />
        ) : def.key === 'air' ? (
          <Anemometer wind={sel.mode === 'day' ? sel.hour.wind : sel.day.windMax} direction={sel.mode === 'day' ? sel.hour.windDir : sel.day.windDir} />
        ) : def.key === 'precip' ? (
          <Raindrop chance={sel.mode === 'day' ? sel.hour.pop : sel.day.pop} amount={sel.mode === 'day' ? sel.hour.precip : sel.day.precip} />
        ) : (
          <Flower health={health} />
        )
      }
    />
  );

  return (
    <main className="nb-app">
      <div className="nb-phone">
        <h1 className="nb-sr">Weather for {f.place.name}</h1>
        <header className="nb-header">
          <div className="nb-header-mid">
            <span className="nb-label" aria-live="polite">
              {selectionLabel(f.hours, f.days, mode, safeIndex)}
            </span>
            <button type="button" className="nb-city" onClick={() => setSheet('place')} aria-label={`${f.place.name}. Change location`}>
              {f.place.name.toUpperCase()}
            </button>
          </div>
          <button type="button" className="nb-ring" aria-label="Settings" onClick={() => setSheet('settings')}>
            <span />
          </button>
        </header>

        <div className="nb-pager" ref={pager} onScroll={onPagerScroll}>
          <section className="nb-page nb-page--now" aria-label="Now">
            <NowPage
              forecast={f}
              selection={sel}
              units={units}
              onHour={(i) => {
                setMode('day');
                setIndex(i);
              }}
              onAlert={(key) => goTo(PAGES.findIndex((p) => p.key === key))}
              onMenu={() => setSheet('settings')}
            />
          </section>
          {[TEMP_PAGE, AIR_PAGE, PRECIP_PAGE, AQI_PAGE].map((def) => (
            <section key={def.key} className="nb-page" aria-label={def.title}>
              {detail(def)}
            </section>
          ))}
        </div>

        {page > 0 && (
          <button type="button" className="nb-edge nb-edge--left" aria-label={`Previous page: ${PAGES[page - 1].name}`} onClick={() => goTo(page - 1)}>
            <span>{PAGES[page - 1].name}</span>
          </button>
        )}
        {page < PAGES.length - 1 && (
          <button type="button" className="nb-edge nb-edge--right" aria-label={`Next page: ${PAGES[page + 1].name}`} onClick={() => goTo(page + 1)}>
            <span>{PAGES[page + 1].name}</span>
          </button>
        )}
        <div className="nb-dots" aria-hidden="true">
          {PAGES.map((p, i) => (
            <span key={p.key} className={i === page ? 'is-on' : ''} />
          ))}
        </div>

        {sheets}
      </div>
    </main>
  );
}
