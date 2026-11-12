export type PollenKind = 'alder' | 'birch' | 'grass' | 'mugwort' | 'olive' | 'ragweed';
export type Pollen = Partial<Record<PollenKind, number>>;

/** One hour of weather. Times are local to the place ("2026-11-10T14:00"). */
export interface Hour {
  time: string;
  code: number;
  isDay: boolean;
  temp: number;
  feels: number;
  humidity: number;
  dew: number;
  /** km/h */
  wind: number;
  gust: number;
  /** Degrees the wind comes from. */
  windDir: number;
  /** km */
  visibility: number;
  /** hPa */
  pressure: number;
  /** Chance of precipitation, % */
  pop: number;
  /** mm */
  precip: number;
  /** % */
  cloud: number;
  uv: number;
  /** US AQI and pollutants (µg/m³); null where unavailable. */
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  /** Grains/m³ by plant; null where pollen isn't modelled (outside Europe). */
  pollen: Pollen | null;
}

export interface Day {
  date: string;
  code: number;
  hi: number;
  lo: number;
  feelsHi: number;
  feelsLo: number;
  pop: number;
  precip: number;
  windMax: number;
  gustMax: number;
  windDir: number;
  uvMax: number;
  sunrise: string;
  sunset: string;
  humidity: number;
  dew: number;
  visibility: number;
  pressure: number;
  cloud: number;
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  pollen: Pollen | null;
}

export interface Place {
  name: string;
  /** Region and country, shown under the name in lists. */
  region?: string;
  latitude: number;
  longitude: number;
  /** True when the place came from the device's GPS. */
  isCurrent?: boolean;
}

export interface Forecast {
  place: Place;
  /** Current conditions; also hours[0]. */
  now: Hour;
  /** The next 24 hours, starting with now. */
  hours: Hour[];
  /** Today and the next 6 days. */
  days: Day[];
  fetchedAt: Date;
}

export type TempUnit = 'C' | 'F';
export interface Units {
  temp: TempUnit;
}
