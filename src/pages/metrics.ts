import {
  aqiBand,
  clock,
  compass,
  fmtTemp,
  fmtWind,
  POLLEN_LABELS,
  POLLEN_LEVELS,
  pollenTop,
  toTemp,
  toWind,
} from '../lib/format';
import type { Day, Forecast, Hour, Mode, Units } from '../lib/types';

/** What the person has picked: an hour (Day mode) or a day (Week mode). */
export type Selection = { mode: 'day'; index: number; hour: Hour; day: Day } | { mode: 'week'; index: number; day: Day };

export function select(f: Forecast, mode: Mode, index: number): Selection {
  if (mode === 'week') return { mode, index, day: f.days[index] };
  const hour = f.hours[index];
  const day = f.days.find((d) => hour.time.startsWith(d.date)) ?? f.days[0];
  return { mode, index, hour, day };
}

type Num = number | null;

export interface Metric {
  key: string;
  label: string;
  value: (s: Selection, u: Units) => string;
  /** Chart series. Without them the page's first metric is charted. */
  hour?: (h: Hour) => Num;
  hour2?: (h: Hour) => Num;
  day?: (d: Day) => Num;
  day2?: (d: Day) => Num;
  /** Converts chart values into the chosen units. */
  convert?: (v: number, u: Units) => number;
}

export interface PageDef {
  key: 'now' | 'temp' | 'air' | 'precip' | 'aqi';
  title: string;
  metrics: Metric[];
}

const DASH = '--';
const pct = (v: number) => `${Math.round(v)}%`;
const temp = (v: number, u: Units) => toTemp(v, u.temp);
const wind = (v: number, u: Units) => toWind(v, u.wind);
const orDash = (v: Num, f: (n: number) => string) => (v == null ? DASH : f(v));
/** Picks the hour's value in Day mode and the day's value in Week mode. */
const pick = <T,>(s: Selection, h: (h: Hour) => T, d: (d: Day) => T) => (s.mode === 'day' ? h(s.hour) : d(s.day));

export const TEMP_PAGE: PageDef = {
  key: 'temp',
  title: 'Temp',
  metrics: [
    {
      key: 'temp', label: 'Temperature',
      value: (s, u) => (s.mode === 'day' ? fmtTemp(s.hour.temp, u) : `${fmtTemp(s.day.hi, u)} / ${fmtTemp(s.day.lo, u)}`),
      hour: (h) => h.temp, hour2: (h) => h.feels, day: (d) => d.hi, day2: (d) => d.lo, convert: temp,
    },
    { key: 'hi', label: 'High', value: (s, u) => fmtTemp(s.day.hi, u), hour: (h) => h.temp, day: (d) => d.hi, convert: temp },
    { key: 'lo', label: 'Low', value: (s, u) => fmtTemp(s.day.lo, u), hour: (h) => h.temp, day: (d) => d.lo, convert: temp },
    {
      key: 'feels', label: 'Feels like',
      value: (s, u) => pick(s, (h) => fmtTemp(h.feels, u), (d) => `${fmtTemp(d.feelsHi, u)} / ${fmtTemp(d.feelsLo, u)}`),
      hour: (h) => h.feels, hour2: (h) => h.temp, day: (d) => d.feelsHi, day2: (d) => d.feelsLo, convert: temp,
    },
    { key: 'humidity', label: 'Humidity', value: (s) => pct(pick(s, (h) => h.humidity, (d) => d.humidity)), hour: (h) => h.humidity, day: (d) => d.humidity },
    { key: 'dew', label: 'Dew point', value: (s, u) => fmtTemp(pick(s, (h) => h.dew, (d) => d.dew), u), hour: (h) => h.dew, day: (d) => d.dew, convert: temp },
  ],
};

export const AIR_PAGE: PageDef = {
  key: 'air',
  title: 'Air',
  metrics: [
    {
      key: 'wind', label: 'Wind speed', value: (s, u) => fmtWind(pick(s, (h) => h.wind, (d) => d.windMax), u),
      hour: (h) => h.wind, hour2: (h) => h.gust, day: (d) => d.windMax, day2: (d) => d.gustMax, convert: wind,
    },
    {
      key: 'gust', label: 'Wind gust', value: (s, u) => fmtWind(pick(s, (h) => h.gust, (d) => d.gustMax), u),
      hour: (h) => h.gust, hour2: (h) => h.wind, day: (d) => d.gustMax, day2: (d) => d.windMax, convert: wind,
    },
    { key: 'dir', label: 'Wind direction', value: (s) => compass(pick(s, (h) => h.windDir, (d) => d.windDir)) },
    {
      key: 'vis', label: 'Visibility', value: (s) => `${pick(s, (h) => h.visibility, (d) => d.visibility).toFixed(1)} KM`,
      hour: (h) => h.visibility, day: (d) => d.visibility,
    },
    {
      key: 'pressure', label: 'Pressure', value: (s) => `${Math.round(pick(s, (h) => h.pressure, (d) => d.pressure))} HPA`,
      hour: (h) => h.pressure, day: (d) => d.pressure,
    },
    { key: 'aqi', label: 'AQI', value: (s) => orDash(pick(s, (h) => h.aqi, (d) => d.aqi), (v) => String(Math.round(v))), hour: (h) => h.aqi, day: (d) => d.aqi },
    {
      key: 'pollen', label: 'Pollen',
      value: (s) => {
        const top = pollenTop(pick(s, (h) => h.pollen, (d) => d.pollen));
        return top.level < 0 ? DASH : top.level === 0 ? 'NONE' : POLLEN_LEVELS[top.level].toUpperCase();
      },
    },
  ],
};

export const PRECIP_PAGE: PageDef = {
  key: 'precip',
  title: 'Precip',
  metrics: [
    { key: 'pop', label: 'Chance', value: (s) => pct(pick(s, (h) => h.pop, (d) => d.pop)), hour: (h) => h.pop, day: (d) => d.pop },
    {
      key: 'amount', label: 'Amount', value: (s) => `${pick(s, (h) => h.precip, (d) => d.precip).toFixed(1)} MM`,
      hour: (h) => h.precip, day: (d) => d.precip,
    },
    { key: 'cloud', label: 'Cloud cover', value: (s) => pct(pick(s, (h) => h.cloud, (d) => d.cloud)), hour: (h) => h.cloud, day: (d) => d.cloud },
    { key: 'humidity', label: 'Humidity', value: (s) => pct(pick(s, (h) => h.humidity, (d) => d.humidity)), hour: (h) => h.humidity, day: (d) => d.humidity },
    { key: 'uv', label: 'UV index', value: (s) => String(Math.round(pick(s, (h) => h.uv, (d) => d.uvMax))), hour: (h) => h.uv, day: (d) => d.uvMax },
    { key: 'sunrise', label: 'Sunrise', value: (s) => clock(s.day.sunrise) },
    { key: 'sunset', label: 'Sunset', value: (s) => clock(s.day.sunset) },
  ],
};

const ugm3 = (v: Num) => orDash(v, (n) => `${Math.round(n)} µg/m³`);

export const AQI_PAGE: PageDef = {
  key: 'aqi',
  title: 'AQI',
  metrics: [
    { key: 'aqi', label: 'US AQI', value: (s) => orDash(pick(s, (h) => h.aqi, (d) => d.aqi), (v) => String(Math.round(v))), hour: (h) => h.aqi, day: (d) => d.aqi },
    { key: 'band', label: 'Level', value: (s) => orDash(pick(s, (h) => h.aqi, (d) => d.aqi), (v) => aqiBand(v).label.toUpperCase()) },
    { key: 'pm25', label: 'PM2.5', value: (s) => ugm3(pick(s, (h) => h.pm25, (d) => d.pm25)), hour: (h) => h.pm25, day: (d) => d.pm25 },
    { key: 'pm10', label: 'PM10', value: (s) => ugm3(pick(s, (h) => h.pm10, (d) => d.pm10)), hour: (h) => h.pm10, day: (d) => d.pm10 },
    { key: 'o3', label: 'Ozone', value: (s) => ugm3(pick(s, (h) => h.o3, (d) => d.o3)), hour: (h) => h.o3, day: (d) => d.o3 },
    { key: 'no2', label: 'NO₂', value: (s) => ugm3(pick(s, (h) => h.no2, (d) => d.no2)), hour: (h) => h.no2, day: (d) => d.no2 },
    {
      key: 'pollen', label: 'Pollen',
      value: (s) => {
        const top = pollenTop(pick(s, (h) => h.pollen, (d) => d.pollen));
        if (top.level < 0) return 'N/A';
        return top.level === 0 ? 'NONE' : `${POLLEN_LEVELS[top.level]} · ${POLLEN_LABELS[top.kind!]}`.toUpperCase();
      },
    },
  ],
};

export const DETAIL_PAGES = [TEMP_PAGE, AIR_PAGE, PRECIP_PAGE, AQI_PAGE];
