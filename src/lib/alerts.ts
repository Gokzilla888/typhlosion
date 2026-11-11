import { hourShort } from './format';
import type { Forecast } from './types';

export interface Alert {
  text: string;
  page: 'now' | 'temp' | 'air' | 'precip' | 'aqi';
}

/** Things worth flagging in the next 12 hours, most important first. */
export function alertsFor(f: Forecast): Alert[] {
  const next = f.hours.slice(0, 12);
  const out: Alert[] = [];
  const aqi = f.now.aqi;
  if (aqi != null && aqi > 150) out.push({ text: 'AIR QUALITY ALERT', page: 'aqi' });
  else if (aqi != null && aqi > 100) out.push({ text: 'POOR AIR FOR SENSITIVE GROUPS', page: 'aqi' });
  const storm = next.find((h) => h.code >= 95);
  if (storm) out.push({ text: storm === next[0] ? 'THUNDERSTORM NOW' : `THUNDERSTORMS AT ${hourShort(storm.time)}`, page: 'precip' });
  const raining = next[0].precip > 0 || (next[0].code >= 51 && next[0].code <= 82);
  const rain = next.slice(1).find((h) => h.pop >= 60);
  if (!storm && !raining && rain) out.push({ text: `RAIN LIKELY AT ${hourShort(rain.time)}`, page: 'precip' });
  if (Math.max(...next.map((h) => h.gust)) >= 60) out.push({ text: 'STRONG WIND GUSTS', page: 'air' });
  if (Math.max(...next.map((h) => h.uv)) >= 8) out.push({ text: 'VERY HIGH UV', page: 'precip' });
  return out;
}
