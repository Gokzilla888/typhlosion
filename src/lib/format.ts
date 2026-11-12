import type { PollenKind, Pollen, TempUnit, Units } from './types';

// ---------- Weather codes (WMO) ----------

const DESCRIPTIONS: Record<number, string> = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy',
  45: 'Foggy', 48: 'Freezing fog',
  51: 'Drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Showers', 81: 'Showers', 82: 'Downpour', 85: 'Snow showers', 86: 'Snow showers',
  95: 'Thunderstorm', 96: 'Hailstorm', 99: 'Hailstorm',
};

export const describe = (code: number, isDay = true) => (code <= 1 && !isDay ? 'Clear night' : (DESCRIPTIONS[code] ?? 'Unknown'));

export type SceneKind = 'sun' | 'moon' | 'partly' | 'cloud' | 'fog' | 'rain' | 'storm' | 'snow';

export function sceneFor(code: number, isDay = true): SceneKind {
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code === 3) return 'cloud';
  if (code === 2) return isDay ? 'partly' : 'cloud';
  return isDay ? 'sun' : 'moon';
}

/** Which animated sky to show behind the forecast. */
export type SkyKind = 'clear' | 'partly' | 'cloudy' | 'cloudyNight' | 'rain' | 'storm' | 'snow' | 'night';

export function skyFor(code: number, isDay = true): SkyKind {
  const scene = sceneFor(code, isDay);
  if (scene === 'sun') return 'clear';
  if (scene === 'moon') return 'night';
  if (scene === 'cloud' || scene === 'fog') return isDay ? 'cloudy' : 'cloudyNight';
  return scene;
}

/** Rain or snow strength 0–1 from the weather code. */
export function intensityFor(code: number) {
  if ([51, 56, 61, 66, 71, 77, 80, 85].includes(code)) return 0.4;
  if ([53, 63, 73, 81].includes(code)) return 0.7;
  return 1;
}

// ---------- Units ----------

export const toTemp = (c: number, u: TempUnit) => (u === 'F' ? (c * 9) / 5 + 32 : c);

export const fmtTemp = (c: number, units: Units) => `${Math.round(toTemp(c, units.temp))}°${units.temp}`;
export const fmtDeg = (c: number, units: Units) => `${Math.round(toTemp(c, units.temp))}°`;

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const COMPASS_LONG = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const octant = (deg: number) => Math.round((((deg % 360) + 360) % 360) / 45) % 8;
export const compass = (deg: number) => COMPASS[octant(deg)];
export const compassLong = (deg: number) => COMPASS_LONG[octant(deg)];

// ---------- Time ----------

/** Open-Meteo local times have no offset; reading them as UTC keeps them in local time. */
export const localDate = (iso: string) => new Date(`${iso}${iso.length === 10 ? 'T00:00' : ''}Z`);

/** "1 PM" */
export function hourLabel(iso: string) {
  const h = localDate(iso).getUTCHours();
  return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "6:42 AM" */
export function clock(iso: string) {
  const d = localDate(iso);
  const h = d.getUTCHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const weekday = (date: string) => WEEKDAYS[localDate(date).getUTCDay()];

/** Minutes since midnight of a local time. */
export function minutesOf(iso: string) {
  const d = localDate(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

// ---------- Air quality and pollen ----------

export interface AqiBand {
  max: number;
  label: string;
  advice: string;
}

export const AQI_BANDS: AqiBand[] = [
  { max: 50, label: 'Good', advice: 'Air is clean. A great time to be outside.' },
  { max: 100, label: 'Moderate', advice: 'Acceptable. Very sensitive people should take it easy outdoors.' },
  { max: 150, label: 'Unhealthy for sensitive groups', advice: 'Children, older adults and people with asthma should limit long outdoor activity.' },
  { max: 200, label: 'Unhealthy', advice: 'Everyone may feel effects. Limit time outdoors and consider a mask.' },
  { max: 300, label: 'Very unhealthy', advice: 'Health alert. Avoid outdoor activity and keep windows closed.' },
  { max: Infinity, label: 'Hazardous', advice: 'Emergency conditions. Stay indoors.' },
];

export const aqiBand = (aqi: number) => AQI_BANDS.find((b) => aqi <= b.max)!;

export const POLLEN_LABELS: Record<PollenKind, string> = {
  alder: 'Alder', birch: 'Birch', olive: 'Olive', grass: 'Grass', mugwort: 'Mugwort', ragweed: 'Ragweed',
};

/** Grains/m³ where Low, Moderate, High and Very high begin. */
const POLLEN_THRESHOLDS: Record<PollenKind, [number, number, number, number]> = {
  alder: [1, 15, 90, 1500],
  birch: [1, 15, 90, 1500],
  olive: [1, 15, 90, 1500],
  grass: [1, 20, 50, 200],
  mugwort: [1, 10, 50, 500],
  ragweed: [1, 10, 50, 500],
};
export const POLLEN_LEVELS = ['None', 'Low', 'Moderate', 'High', 'Very high'];

export const pollenLevel = (kind: PollenKind, grains: number) => POLLEN_THRESHOLDS[kind].filter((t) => grains >= t).length;

/** Highest pollen level and the plant causing it. */
export function pollenTop(p: Pollen | null): { level: number; kind: PollenKind | null } {
  if (!p) return { level: -1, kind: null };
  let best: { level: number; kind: PollenKind | null } = { level: 0, kind: null };
  for (const k of Object.keys(p) as PollenKind[]) {
    const level = pollenLevel(k, p[k]!);
    if (level > best.level) best = { level, kind: k };
  }
  return best;
}
