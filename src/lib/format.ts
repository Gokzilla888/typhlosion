import type { Day, Hour, PollenKind, Pollen, TempUnit, Units, WindUnit } from './types';

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

/** Rain or snow strength 0–1 from the weather code. */
export function intensityFor(code: number) {
  if ([51, 56, 61, 66, 71, 77, 80, 85].includes(code)) return 0.4;
  if ([53, 63, 73, 81].includes(code)) return 0.7;
  return 1;
}

// ---------- Units ----------

export const toTemp = (c: number, u: TempUnit) => (u === 'F' ? (c * 9) / 5 + 32 : c);
export const toWind = (kmh: number, u: WindUnit) => (u === 'ms' ? kmh / 3.6 : u === 'mph' ? kmh / 1.609 : kmh);
export const WIND_LABEL: Record<WindUnit, string> = { kmh: 'KM/H', ms: 'M/S', mph: 'MPH' };

export const fmtTemp = (c: number, units: Units) => `${Math.round(toTemp(c, units.temp))}°${units.temp}`;
export const fmtDeg = (c: number, units: Units) => `${Math.round(toTemp(c, units.temp))}°`;
export const fmtWind = (kmh: number, units: Units) => `${Math.round(toWind(kmh, units.wind))} ${WIND_LABEL[units.wind]}`;

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const compass = (deg: number) => COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

// ---------- Time ----------

/** Open-Meteo local times have no offset; reading them as UTC keeps them in local time. */
export const localDate = (iso: string) => new Date(`${iso}${iso.length === 10 ? 'T00:00' : ''}Z`);

/** "1P", "12A" */
export function hourShort(iso: string) {
  const h = localDate(iso).getUTCHours();
  return `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'A' : 'P'}`;
}

/** "1PM" */
export function hourLong(iso: string) {
  const h = localDate(iso).getUTCHours();
  return `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'AM' : 'PM'}`;
}

/** "6:42 AM" */
export function clock(iso: string) {
  const d = localDate(iso);
  const h = d.getUTCHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const weekday = (date: string) => WEEKDAYS[localDate(date).getUTCDay()];

/** Label above the city: "NOW", "TODAY AT 1PM", "TOMORROW AT 3AM", "WED NOV 12". */
export function selectionLabel(hours: Hour[], days: Day[], mode: 'day' | 'week', index: number) {
  if (mode === 'week') {
    if (index === 0) return 'TODAY';
    if (index === 1) return 'TOMORROW';
    const d = localDate(days[index].date);
    return `${WEEKDAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  }
  if (index === 0) return 'NOW';
  const t = hours[index].time;
  const today = hours[0].time.slice(0, 10);
  return `${t.startsWith(today) ? 'TODAY' : 'TOMORROW'} AT ${hourLong(t)}`;
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

/** 1 = thriving, 0 = wilted. Clean air up to 40 keeps the flower perfect. */
export const flowerHealth = (aqi: number | null) => (aqi == null ? 1 : Math.max(0, Math.min(1, 1 - (aqi - 40) / 260)));

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
