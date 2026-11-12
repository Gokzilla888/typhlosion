import type { Day, Forecast, Hour, Place, Pollen, PollenKind } from './types';

export const DEFAULT_PLACE: Place = { name: 'New Delhi', region: 'Delhi, India', latitude: 28.6139, longitude: 77.209 };

const HOURLY = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'dew_point_2m',
  'weather_code',
  'is_day',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
  'visibility',
  'pressure_msl',
  'precipitation_probability',
  'precipitation',
  'cloud_cover',
  'uv_index',
];
const CURRENT = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'weather_code',
  'is_day',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
  'pressure_msl',
  'precipitation',
  'cloud_cover',
];
const DAILY = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'precipitation_probability_max',
  'precipitation_sum',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'wind_direction_10m_dominant',
  'uv_index_max',
  'sunrise',
  'sunset',
];
const POLLEN_KINDS: PollenKind[] = ['alder', 'birch', 'grass', 'mugwort', 'olive', 'ragweed'];
const AIR_HOURLY = ['us_aqi', 'pm2_5', 'pm10', 'ozone', 'nitrogen_dioxide', ...POLLEN_KINDS.map((k) => `${k}_pollen`)];

type Series = Record<string, (number | null)[]> & { time: string[] };

interface ForecastResponse {
  current: Record<string, number> & { time: string };
  hourly: Series;
  daily: Series & { sunrise: string[]; sunset: string[] };
}

const coord = (n: number) => n.toFixed(4);

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

function forecastUrl(p: Place) {
  const q = new URLSearchParams({
    latitude: coord(p.latitude),
    longitude: coord(p.longitude),
    timezone: 'auto',
    forecast_days: '7',
    wind_speed_unit: 'kmh',
    current: CURRENT.join(','),
    hourly: HOURLY.join(','),
    daily: DAILY.join(','),
  });
  return `https://api.open-meteo.com/v1/forecast?${q}`;
}

function airUrl(p: Place) {
  const q = new URLSearchParams({
    latitude: coord(p.latitude),
    longitude: coord(p.longitude),
    timezone: 'auto',
    forecast_days: '5',
    hourly: AIR_HOURLY.join(','),
  });
  return `https://air-quality-api.open-meteo.com/v1/air-quality?${q}`;
}

const num = (v: number | null | undefined, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const maybe = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const maxOrNull = (xs: (number | null)[]) => {
  const ok = xs.filter((x): x is number => x != null);
  return ok.length ? Math.max(...ok) : null;
};

function pollenAt(air: Series | null, i: number): Pollen | null {
  if (!air || i < 0) return null;
  const out: Pollen = {};
  for (const k of POLLEN_KINDS) {
    const v = maybe(air[`${k}_pollen`]?.[i]);
    if (v != null) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

/** Fetches weather and air quality, and shapes them into a Forecast. */
export async function fetchForecast(place: Place, signal?: AbortSignal): Promise<Forecast> {
  const [wx, air] = await Promise.all([
    getJson<ForecastResponse>(forecastUrl(place), signal),
    // Air quality is optional: the weather still shows if it fails.
    getJson<{ hourly: Series }>(airUrl(place), signal)
      .then((r) => r.hourly)
      .catch(() => null),
  ]);
  return buildForecast(place, wx, air);
}

export function buildForecast(place: Place, wx: ForecastResponse, air: Series | null, fetchedAt = new Date()): Forecast {
  const h = wx.hourly;
  const airIndex = new Map<string, number>((air?.time ?? []).map((t, i) => [t, i]));

  const hourAt = (i: number): Hour => {
    const ai = airIndex.get(h.time[i]) ?? -1;
    const a = (k: string) => (air && ai >= 0 ? maybe(air[k]?.[ai]) : null);
    return {
      time: h.time[i],
      code: num(h.weather_code[i]),
      isDay: num(h.is_day[i]) === 1,
      temp: num(h.temperature_2m[i]),
      feels: num(h.apparent_temperature[i]),
      humidity: num(h.relative_humidity_2m[i]),
      dew: num(h.dew_point_2m[i]),
      wind: num(h.wind_speed_10m[i]),
      gust: num(h.wind_gusts_10m[i]),
      windDir: num(h.wind_direction_10m[i]),
      visibility: num(h.visibility[i]) / 1000,
      pressure: num(h.pressure_msl[i]),
      pop: num(h.precipitation_probability[i]),
      precip: num(h.precipitation[i]),
      cloud: num(h.cloud_cover[i]),
      uv: num(h.uv_index[i]),
      aqi: a('us_aqi'),
      pm25: a('pm2_5'),
      pm10: a('pm10'),
      o3: a('ozone'),
      no2: a('nitrogen_dioxide'),
      pollen: pollenAt(air, ai),
    };
  };

  const all = h.time.map((_, i) => hourAt(i));

  // Start at the current local hour; the first slot uses the live reading.
  const c = wx.current;
  const start = Math.max(0, h.time.indexOf(`${c.time.slice(0, 13)}:00`));
  const base = all[start];
  const now: Hour = {
    ...base,
    // The live reading's own time (to the quarter hour) places the sun on its arc.
    time: c.time,
    code: num(c.weather_code, base.code),
    isDay: num(c.is_day, base.isDay ? 1 : 0) === 1,
    temp: num(c.temperature_2m, base.temp),
    feels: num(c.apparent_temperature, base.feels),
    humidity: num(c.relative_humidity_2m, base.humidity),
    wind: num(c.wind_speed_10m, base.wind),
    gust: num(c.wind_gusts_10m, base.gust),
    windDir: num(c.wind_direction_10m, base.windDir),
    pressure: num(c.pressure_msl, base.pressure),
    precip: num(c.precipitation, base.precip),
    cloud: num(c.cloud_cover, base.cloud),
  };
  const hours = [now, ...all.slice(start + 1, start + 24)];

  const d = wx.daily;
  const days: Day[] = d.time.slice(0, 7).map((date, i) => {
    const inDay = all.filter((x) => x.time.startsWith(date));
    const pollenMax: Pollen = {};
    for (const x of inDay) for (const k of POLLEN_KINDS) if (x.pollen?.[k] != null) pollenMax[k] = Math.max(pollenMax[k] ?? 0, x.pollen[k]!);
    return {
      date,
      code: num(d.weather_code[i]),
      hi: num(d.temperature_2m_max[i]),
      lo: num(d.temperature_2m_min[i]),
      feelsHi: num(d.apparent_temperature_max[i]),
      feelsLo: num(d.apparent_temperature_min[i]),
      pop: num(d.precipitation_probability_max[i]),
      precip: num(d.precipitation_sum[i]),
      windMax: num(d.wind_speed_10m_max[i]),
      gustMax: num(d.wind_gusts_10m_max[i]),
      windDir: num(d.wind_direction_10m_dominant[i]),
      uvMax: num(d.uv_index_max[i]),
      sunrise: d.sunrise[i],
      sunset: d.sunset[i],
      humidity: avg(inDay.map((x) => x.humidity)),
      dew: avg(inDay.map((x) => x.dew)),
      visibility: avg(inDay.map((x) => x.visibility)),
      pressure: avg(inDay.map((x) => x.pressure)),
      cloud: avg(inDay.map((x) => x.cloud)),
      aqi: maxOrNull(inDay.map((x) => x.aqi)),
      pm25: maxOrNull(inDay.map((x) => x.pm25)),
      pm10: maxOrNull(inDay.map((x) => x.pm10)),
      o3: maxOrNull(inDay.map((x) => x.o3)),
      no2: maxOrNull(inDay.map((x) => x.no2)),
      pollen: Object.keys(pollenMax).length ? pollenMax : null,
    };
  });

  return { place, now, hours, days, fetchedAt };
}

// ---------- Places ----------

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

/** Finds cities by name with Open-Meteo's geocoding API. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = new URLSearchParams({ name: query, count: '8', language: 'en', format: 'json' });
  const body = await getJson<{ results?: GeocodingResult[] }>(`https://geocoding-api.open-meteo.com/v1/search?${q}`, signal);
  return (body.results ?? []).map((r) => ({
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(', '),
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

/** Asks the device for its position. */
export function getDevicePosition(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This device cannot share its location.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) =>
        reject(new Error(err.code === err.PERMISSION_DENIED ? 'Location access was denied. Search for a city instead.' : 'Could not find your location.')),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

/**
 * Names a GPS position. Open-Meteo has no reverse geocoding, so this uses
 * BigDataCloud's free client-side endpoint and falls back to "My location".
 */
export async function placeFromCoords(coords: { latitude: number; longitude: number }): Promise<Place> {
  const base: Place = { name: 'My location', latitude: coords.latitude, longitude: coords.longitude, isCurrent: true };
  try {
    const q = new URLSearchParams({ latitude: coord(coords.latitude), longitude: coord(coords.longitude), localityLanguage: 'en' });
    const body = await getJson<{ city?: string; locality?: string; principalSubdivision?: string; countryName?: string }>(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${q}`,
    );
    const name = body.city || body.locality;
    return name ? { ...base, name, region: [body.principalSubdivision, body.countryName].filter(Boolean).join(', ') } : base;
  } catch {
    return base;
  }
}
