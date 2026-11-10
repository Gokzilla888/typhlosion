import {
  clamp01,
  CONDITIONS,
  type Condition,
  type ConditionKey,
  type DayDetail,
  type DayForecast,
  type IconName,
} from './data';

export interface Place {
  name: string;
  /** Region and country, shown under the name in lists. */
  region?: string;
  latitude: number;
  longitude: number;
  /** True when the place came from the device's GPS. */
  isCurrent?: boolean;
}

export const DEFAULT_PLACE: Place = { name: 'New Delhi', region: 'Delhi, India', latitude: 28.6139, longitude: 77.209 };

const HOURS_SHOWN = 24;

const CURRENT_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'weather_code',
  'is_day',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'pressure_msl',
];
const HOURLY_VARS = ['temperature_2m', 'weather_code', 'precipitation_probability', 'is_day', 'dew_point_2m', 'visibility', 'uv_index', 'pressure_msl'];
const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_probability_max',
  'precipitation_sum',
  'sunrise',
  'sunset',
  'wind_speed_10m_max',
  'uv_index_max',
];

/** The parts of the Open-Meteo forecast response this app reads. */
export interface ForecastResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    is_day: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    pressure_msl: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: (number | null)[];
    is_day: number[];
    dew_point_2m: number[];
    visibility: (number | null)[];
    uv_index: (number | null)[];
    pressure_msl: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
    precipitation_sum: (number | null)[];
    sunrise: string[];
    sunset: string[];
    wind_speed_10m_max: (number | null)[];
    uv_index_max: (number | null)[];
  };
}

export async function fetchForecast(place: Place, signal?: AbortSignal): Promise<ForecastResponse> {
  const params = new URLSearchParams({
    latitude: place.latitude.toFixed(4),
    longitude: place.longitude.toFixed(4),
    timezone: 'auto',
    forecast_days: '7',
    wind_speed_unit: 'kmh',
    current: CURRENT_VARS.join(','),
    hourly: HOURLY_VARS.join(','),
    daily: DAILY_VARS.join(','),
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
  return res.json();
}

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

/** Finds cities by name with Open-Meteo's geocoding API. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ name: query, count: '8', language: 'en', format: 'json' });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal });
  if (!res.ok) throw new Error(`City search failed (${res.status})`);
  const body: { results?: GeocodingResult[] } = await res.json();
  return (body.results ?? []).map((r) => ({
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(', '),
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

/** Asks the browser for the device's position. */
export function getDevicePosition(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This browser cannot share your location.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) =>
        reject(
          new Error(err.code === err.PERMISSION_DENIED ? 'Location access was denied. Search for a city instead.' : 'Could not find your location.'),
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
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
    const params = new URLSearchParams({
      latitude: coords.latitude.toFixed(4),
      longitude: coords.longitude.toFixed(4),
      localityLanguage: 'en',
    });
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`);
    if (!res.ok) return base;
    const body: { city?: string; locality?: string; principalSubdivision?: string; countryName?: string } = await res.json();
    const name = body.city || body.locality;
    if (!name) return base;
    return { ...base, name, region: [body.principalSubdivision, body.countryName].filter(Boolean).join(', ') };
  } catch {
    return base;
  }
}

// ---------- WMO weather codes ----------

const DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Freezing fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail',
};

const isSnow = (code: number) => (code >= 71 && code <= 77) || code === 85 || code === 86;
const isStorm = (code: number) => code >= 95;
const isRain = (code: number) => (code >= 51 && code <= 67) || (code >= 80 && code <= 82);

export function describeCode(code: number, isDay: boolean) {
  if (!isDay && code <= 1) return 'Clear night';
  return DESCRIPTIONS[code] ?? 'Unknown';
}

export function iconForCode(code: number, isDay: boolean): IconName {
  if (isStorm(code)) return 'storm';
  if (isSnow(code)) return 'snow';
  if (isRain(code)) return 'rain';
  if (code <= 1) return isDay ? 'sun' : 'moon';
  if (code === 2) return isDay ? 'partly' : 'cloud';
  return 'cloud';
}

/** Picks the animated sky for a weather code. */
export function sceneForCode(code: number, isDay: boolean): ConditionKey {
  if (isStorm(code)) return 'storm';
  if (isSnow(code)) return 'snow';
  if (isRain(code)) return 'rain';
  if (!isDay) return 'night';
  if (code <= 1) return 'clear';
  return 'cloudy';
}

/** How heavy the rain or snow is, 0–1, used to scale particle counts. */
function intensityForCode(code: number) {
  if ([51, 56, 61, 66, 71, 77, 80, 85].includes(code)) return 0.4;
  if ([53, 63, 73, 81].includes(code)) return 0.7;
  return 1;
}

// ---------- Helpers ----------

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const compass = (deg: number) => COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

function uvLabel(uv: number) {
  if (uv < 0.5) return 'None';
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very high';
  return 'Extreme';
}

/**
 * Open-Meteo returns local times without an offset ("2026-11-10T06:42").
 * Reading them all as UTC keeps comparisons between them correct.
 */
const localMs = (iso: string) => Date.parse(`${iso}${iso.length === 10 ? 'T00:00' : ''}Z`);

function clockLabel(iso: string) {
  const d = new Date(localMs(iso));
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const round = Math.round;

/** Turns an Open-Meteo forecast into the data the weather screen shows. */
export function toCondition(data: ForecastResponse, place: Place, fetchedAt = new Date()): Condition {
  const { current: cur, hourly, daily } = data;
  const isDay = cur.is_day === 1;
  const scene = sceneForCode(cur.weather_code, isDay);
  const temp = cur.temperature_2m;

  // The hourly series starts at the current local hour.
  const hourKey = `${cur.time.slice(0, 13)}:00`;
  const start = Math.max(0, hourly.time.indexOf(hourKey));
  const idx = Array.from({ length: HOURS_SHOWN }, (_, i) => Math.min(start + i, hourly.time.length - 1));
  const pops = idx.map((i) => round(hourly.precipitation_probability[i] ?? 0));
  const next12 = pops.slice(0, 12);

  const visibilityKm = round((hourly.visibility[start] ?? 0) / 1000);
  const uvNow = hourly.uv_index[start] ?? 0;
  const pressureIn3h = hourly.pressure_msl[Math.min(start + 3, hourly.pressure_msl.length - 1)];
  const pressureChange = pressureIn3h - cur.pressure_msl;

  const dayCount = Math.min(7, daily.time.length);
  const days: DayForecast[] = Array.from({ length: dayCount }, (_, i) => [
    iconForCode(daily.weather_code[i], true),
    round(daily.temperature_2m_min[i]),
    round(daily.temperature_2m_max[i]),
    round(daily.precipitation_probability_max[i] ?? 0),
  ]);
  const dayNames = daily.time.slice(0, dayCount).map((d, i) => (i === 0 ? 'Today' : WEEKDAYS[new Date(localMs(d)).getUTCDay()]));
  const dayDetails: DayDetail[] = Array.from({ length: dayCount }, (_, i) => ({
    desc: describeCode(daily.weather_code[i], true),
    sunrise: clockLabel(daily.sunrise[i]),
    sunset: clockLabel(daily.sunset[i]),
    windMax: round(daily.wind_speed_10m_max[i] ?? 0),
    uvMax: round(daily.uv_index_max[i] ?? 0),
    precipMm: Math.round((daily.precipitation_sum[i] ?? 0) * 10) / 10,
  }));

  const now = localMs(cur.time);
  const rise = localMs(daily.sunrise[0]);
  const set = localMs(daily.sunset[0]);
  const sunProgress = clamp01((now - rise) / Math.max(1, set - rise));

  const feelsDiff = cur.apparent_temperature - temp;
  const feelsNote =
    feelsDiff >= 2
      ? cur.relative_humidity_2m >= 60
        ? 'Humidity makes it feel warmer.'
        : 'Feels warmer than the actual temperature.'
      : feelsDiff <= -2
        ? 'Wind makes it feel colder.'
        : 'Similar to the actual temperature.';

  const maxPop = Math.max(...next12);
  const firstWet = next12.findIndex((p) => p >= 50);
  const precipText =
    firstWet === 0
      ? `Precipitation likely over the next hours (up to ${maxPop}%).`
      : firstWet > 0
        ? `Precipitation likely from about ${clockLabel(hourly.time[idx[firstWet]])} (up to ${maxPop}%).`
        : maxPop > 0
          ? 'Low chance of precipitation in the next 12 hours.'
          : 'No precipitation expected in the next 12 hours.';
  const summary = `${precipText} Wind gusts up to ${round(cur.wind_gusts_10m)} km/h.`;

  const fetchedLabel = fetchedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return {
    ...CONDITIONS[scene], // animated-sky settings for this kind of weather
    scene,
    label: describeCode(cur.weather_code, isDay),
    city: place.name,
    temp,
    desc: describeCode(cur.weather_code, isDay),
    hi: round(daily.temperature_2m_max[0]),
    lo: round(daily.temperature_2m_min[0]),
    feels: cur.apparent_temperature,
    feelsNote,
    summary,
    humidity: round(cur.relative_humidity_2m),
    dew: hourly.dew_point_2m[start],
    wind: round(cur.wind_speed_10m),
    gust: round(cur.wind_gusts_10m),
    windDir: compass(cur.wind_direction_10m),
    windDeg: cur.wind_direction_10m,
    uv: round(uvNow),
    uvLabel: uvLabel(uvNow),
    visibility: visibilityKm,
    visNote: visibilityKm >= 10 ? 'Perfectly clear view.' : visibilityKm >= 5 ? 'Good visibility.' : 'Visibility is reduced.',
    pressure: round(cur.pressure_msl),
    pressureNote: pressureChange > 1 ? 'Rising.' : pressureChange < -1 ? 'Falling.' : 'Steady.',
    sunrise: clockLabel(daily.sunrise[0]),
    sunset: clockLabel(daily.sunset[0]),
    sunProgress,
    startHour: new Date(localMs(hourly.time[start])).getUTCHours(),
    hours: idx.map((i) => iconForCode(hourly.weather_code[i], hourly.is_day[i] === 1)),
    hourIsDay: idx.map((i) => hourly.is_day[i] === 1),
    // "Now" shows the current reading; later slots show the hourly forecast.
    hourDelta: idx.map((i, n) => (n === 0 ? 0 : hourly.temperature_2m[i] - temp)),
    hourPop: pops,
    days,
    dayNames,
    dayDetails,
    intensity: intensityForCode(cur.weather_code),
    updatedNote: `Updated ${fetchedLabel}`,
  };
}
