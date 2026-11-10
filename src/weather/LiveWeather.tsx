import { useCallback, useEffect, useRef, useState } from 'react';
import type { Condition } from './data';
import { CityPicker } from './CityPicker';
import { DEFAULT_PLACE, fetchForecast, getDevicePosition, placeFromCoords, toCondition, type Place } from './openMeteo';
import { WeatherScreen } from './WeatherScreen';

const PLACE_KEY = 'wx-place';
const RECENT_KEY = 'wx-recent';
const REFRESH_MS = 15 * 60 * 1000;

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode); the app still works this visit.
  }
}

type Status = { kind: 'loading' } | { kind: 'ready'; weather: Condition } | { kind: 'error'; message: string };

/** Live weather for a GPS location or a chosen city, from Open-Meteo. */
export function LiveWeather({ fullScreen }: { fullScreen?: boolean }) {
  const [place, setPlace] = useState<Place | null>(() => load<Place>(PLACE_KEY));
  const [recent, setRecent] = useState<Place[]>(() => load<Place[]>(RECENT_KEY) ?? []);
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const requestId = useRef(0);
  const hasWeather = useRef(false);

  const choose = useCallback((p: Place) => {
    setPlace(p);
    save(PLACE_KEY, p);
    setRecent((list) => {
      const next = [p, ...list.filter((r) => r.name !== p.name || r.region !== p.region)].slice(0, 5);
      save(RECENT_KEY, next);
      return next;
    });
  }, []);

  const locate = useCallback(async () => {
    setLocating(true);
    setLocateError(null);
    try {
      const coords = await getDevicePosition();
      choose(await placeFromCoords(coords));
      setPickerOpen(false);
      return true;
    } catch (err) {
      setLocateError((err as Error).message);
      return false;
    } finally {
      setLocating(false);
    }
  }, [choose]);

  // First visit: try GPS, otherwise fall back to a default city.
  useEffect(() => {
    if (place) return;
    locate().then((ok) => {
      if (!ok) {
        choose(DEFAULT_PLACE);
        setToast(`Couldn't get your location, so this is ${DEFAULT_PLACE.name}. Tap the city name to change it.`);
      }
    });
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWeather = useCallback(
    async (p: Place, quiet = false) => {
      const id = ++requestId.current;
      if (quiet) setRefreshing(true);
      else setStatus({ kind: 'loading' });
      try {
        const data = await fetchForecast(p);
        if (id !== requestId.current) return;
        hasWeather.current = true;
        setStatus({ kind: 'ready', weather: toCondition(data, p) });
      } catch {
        if (id !== requestId.current) return;
        if (quiet) setToast('Could not refresh. Showing the last forecast.');
        else setStatus({ kind: 'error', message: 'Could not load the weather. Check your connection and try again.' });
      } finally {
        if (id === requestId.current) setRefreshing(false);
      }
    },
    [],
  );

  // Load whenever the place changes, then refresh every 15 minutes
  // and when the person comes back to the tab.
  useEffect(() => {
    if (!place) return;
    // Keep showing the current screen while another city loads.
    loadWeather(place, hasWeather.current);
    const timer = window.setInterval(() => loadWeather(place, true), REFRESH_MS);
    const onVisible = () => document.visibilityState === 'visible' && loadWeather(place, true);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [place, loadWeather]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const picker = (
    <>
      <CityPicker
        open={pickerOpen}
        current={place ?? DEFAULT_PLACE}
        recent={recent}
        locating={locating}
        locateError={locateError}
        onUseLocation={locate}
        onSelect={(p) => {
          choose(p);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
      {toast && (
        <div className="wx-toast" role="status">
          {toast}
        </div>
      )}
    </>
  );

  if (status.kind !== 'ready') {
    return (
      <div className={`wx-screen wx-screen--state${fullScreen ? ' wx-screen--full' : ''}`}>
        <div className="wx-state">
          {status.kind === 'loading' ? (
            <>
              <div className="wx-loader" aria-hidden="true" />
              <p role="status">{locating ? 'Finding your location…' : place ? `Getting the weather for ${place.name}…` : 'Getting the weather…'}</p>
            </>
          ) : (
            <>
              <p role="alert">{status.message}</p>
              <div className="wx-state-actions">
                <button type="button" className="wx-chip" onClick={() => place && loadWeather(place)}>
                  Try again
                </button>
                <button type="button" className="wx-chip" onClick={() => setPickerOpen(true)}>
                  Choose another city
                </button>
              </div>
            </>
          )}
        </div>
        {picker}
      </div>
    );
  }

  return (
    <WeatherScreen
      key={status.weather.city}
      weather={status.weather}
      fullScreen={fullScreen}
      onCityClick={() => {
        setLocateError(null);
        setPickerOpen(true);
      }}
      onRefresh={() => place && loadWeather(place, true)}
      refreshing={refreshing}
      overlay={picker}
    />
  );
}
