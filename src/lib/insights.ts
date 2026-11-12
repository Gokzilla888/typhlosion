import { compassLong, describe, hourLabel, sceneFor } from './format';
import type { Forecast, Hour } from './types';

const isWet = (code: number) => ['rain', 'storm', 'snow'].includes(sceneFor(code));
const wetWord = (code: number) => ({ storm: 'Thunderstorms', snow: 'Snow' })[sceneFor(code) as string] ?? 'Rain';

/** One or two sentences about the next 12 hours, shown above the hourly forecast. */
export function summarize(f: Forecast): string {
  const next = f.hours.slice(0, 12);
  const now = next[0];
  const text = describe(now.code, now.isDay);

  let first: string;
  if (isWet(now.code)) {
    const end = next.findIndex((h, i) => i > 0 && !isWet(h.code));
    first = end > 0 ? `${wetWord(now.code)} until around ${hourLabel(next[end].time)}.` : `${wetWord(now.code)} continues through the next 12 hours.`;
  } else {
    const wet = next.find((h, i) => i > 0 && isWet(h.code) && h.pop >= 50);
    // Day and night versions of the same sky don't count as a change.
    const change = next.slice(1, 7).find((h) => sceneFor(h.code) !== sceneFor(now.code));
    if (wet) first = `${wetWord(wet.code)} likely around ${hourLabel(wet.time)}.`;
    else if (change) first = `${text} now, then ${describe(change.code, change.isDay).toLowerCase()} from ${hourLabel(change.time)}.`;
    else first = `${text} for the next few hours.`;
  }

  const gust = Math.round(Math.max(...next.map((h) => h.gust)));
  const second =
    gust >= 40 ? `Gusts up to ${gust} km/h.` : now.wind < 6 ? 'Winds are calm.' : `${now.wind < 20 ? 'Light' : 'Moderate'} breeze from the ${compassLong(now.windDir)}.`;
  return `${first} ${second}`;
}

export function feelsNote(h: Hour) {
  const diff = h.feels - h.temp;
  if (diff >= 2) return h.humidity >= 70 ? 'High humidity makes it feel warmer.' : h.isDay && h.uv >= 6 ? 'Strong sun makes it feel a little warmer.' : 'It feels warmer than it is.';
  if (diff <= -2) return h.wind >= 10 ? 'Wind makes it feel colder.' : 'It feels colder than it is.';
  return 'Similar to the actual temperature.';
}

export function uvLabel(uv: number) {
  const v = Math.round(uv);
  return v <= 0 ? 'None' : v < 3 ? 'Low' : v < 6 ? 'Moderate' : v < 8 ? 'High' : v < 11 ? 'Very high' : 'Extreme';
}

export function visibilityNote(h: Hour) {
  if (h.visibility >= 10) return 'Perfectly clear view.';
  if (h.visibility >= 6) return 'Good visibility.';
  const cause = { rain: 'Rain', storm: 'Heavy rain', snow: 'Snow', fog: 'Fog' }[sceneFor(h.code) as string] ?? 'Haze';
  return `${cause} is reducing visibility.`;
}

/** Trend over the next three hours. */
export function pressureNote(hours: Hour[]) {
  const diff = (hours[Math.min(3, hours.length - 1)].pressure - hours[0].pressure);
  if (Math.abs(diff) < 1) return 'Steady.';
  return `${diff > 0 ? 'Rising' : 'Falling'} ${Math.abs(diff) > 3 ? 'quickly' : 'slowly'}.`;
}
