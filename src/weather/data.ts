export type IconName = 'sun' | 'moon' | 'cloud' | 'partly' | 'rain' | 'storm' | 'snow';

export type ConditionKey = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'night';

export type Unit = 'C' | 'F';

/** [icon, low, high, chance of precipitation %] */
export type DayForecast = [IconName, number, number, number];

export interface DayDetail {
  desc: string;
  sunrise?: string;
  sunset?: string;
  windMax?: number;
  uvMax?: number;
  precipMm?: number;
}

export interface Condition {
  /** Which animated sky to show. */
  scene: ConditionKey;
  label: string;
  city: string;
  temp: number;
  desc: string;
  hi: number;
  lo: number;
  feels: number;
  feelsNote: string;
  summary: string;
  humidity: number;
  dew: number;
  wind: number;
  gust: number;
  windDir: string;
  /** Direction the wind comes from, in degrees. */
  windDeg: number;
  uv: number;
  uvLabel: string;
  visibility: number;
  visNote: string;
  pressure: number;
  pressureNote: string;
  sunrise: string;
  sunset: string;
  /** How far the sun is along today's arc, 0–1. */
  sunProgress: number;
  /** Hour of day (0–23) of the first hourly slot. */
  startHour: number;
  hours: IconName[];
  /** Hourly temperature offset from `temp`. */
  hourDelta: number[];
  hourPop: number[];
  days: DayForecast[];
  /** Labels for `days`; defaults to DAY_NAMES. */
  dayNames?: string[];
  /** Whether each hourly slot is in daylight. */
  hourIsDay?: boolean[];
  /** Extra details shown when a day in the 7-day list is expanded. */
  dayDetails?: DayDetail[];
  /** Rain or snow strength from 0 to 1; scales the number of particles. */
  intensity?: number;
  /** Short note for the footer, e.g. when the data was updated. */
  updatedNote?: string;
  sky: [string, string, string];
  cardBg: string;
  cloudColor: string;
  cloudCount: number;
  cloudOpacity: number;
  dropCount: number;
  sun: boolean;
  moon: boolean;
  stars: boolean;
  rain: boolean;
  snow: boolean;
  lightning: boolean;
}

export const ICON_PATHS: Record<IconName, string> = {
  sun: 'M16 12a4 4 0 1 1-8 0a4 4 0 1 1 8 0M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79z',
  cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
  partly:
    'M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.95 12.65a4 4 0 0 0-5.93-4.13M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6z',
  rain: 'M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25',
  storm: 'M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9M13 11l-4 6h6l-4 6',
  snow: 'M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01',
};

export const ICON_COLORS: Record<IconName, string> = {
  sun: '#FFD166',
  moon: '#F1E9C9',
  cloud: '#FFFFFF',
  partly: '#FFE08A',
  rain: '#A8DAFF',
  storm: '#FFD166',
  snow: '#FFFFFF',
};

export const ICON_LABELS: Record<IconName, string> = {
  sun: 'Sunny',
  moon: 'Clear',
  cloud: 'Cloudy',
  partly: 'Partly cloudy',
  rain: 'Rain',
  storm: 'Thunderstorm',
  snow: 'Snow',
};

/** Picks the animated sky that fits an hourly icon. */
export function sceneForIcon(icon: IconName, isDay = icon !== 'moon'): ConditionKey {
  if (icon === 'rain' || icon === 'storm' || icon === 'snow') return icon;
  if (!isDay || icon === 'moon') return 'night';
  if (icon === 'sun' || icon === 'partly') return 'clear';
  return 'cloudy';
}

export const CONDITION_KEYS: ConditionKey[] = ['clear', 'cloudy', 'rain', 'storm', 'snow', 'night'];

export const CONDITIONS: Record<ConditionKey, Condition> = {
  clear: {
    scene: 'clear',
    label: 'Clear day',
    city: 'New Delhi', temp: 31, desc: 'Clear sky', hi: 34, lo: 22, feels: 33,
    feelsNote: 'Strong sun makes it feel a little warmer.',
    summary: 'Sunny through the afternoon. Light breeze from the north-west.',
    humidity: 38, dew: 15, wind: 12, gust: 19, windDir: 'NW', windDeg: 315,
    uv: 7, uvLabel: 'High', visibility: 10, visNote: 'Perfectly clear view.',
    pressure: 1009, pressureNote: 'Steady through the day.',
    sunrise: '6:42 AM', sunset: '5:29 PM', sunProgress: 0.55, startHour: 13,
    hours: ['sun', 'sun', 'sun', 'sun', 'partly', 'moon', 'moon', 'moon', 'moon', 'moon', 'moon', 'moon'],
    hourDelta: [0, 1, 2, 1, 0, -2, -4, -5, -6, -7, -7, -8],
    hourPop: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    days: [['sun', 22, 34, 0], ['sun', 21, 33, 0], ['partly', 21, 32, 0], ['partly', 20, 31, 10], ['cloud', 19, 29, 20], ['sun', 19, 30, 0], ['sun', 20, 31, 0]],
    sky: ['#0B4FB3', '#1F74DB', '#4C9BEB'], cardBg: 'rgba(6,20,48,0.26)',
    cloudColor: 'rgba(255,255,255,0.55)', cloudCount: 2, cloudOpacity: 0.7, dropCount: 0,
    sun: true, moon: false, stars: false, rain: false, snow: false, lightning: false,
  },
  cloudy: {
    scene: 'cloudy',
    label: 'Cloudy',
    city: 'Pune', temp: 24, desc: 'Mostly cloudy', hi: 27, lo: 19, feels: 24,
    feelsNote: 'Similar to the actual temperature.',
    summary: 'Clouds hang around all day, with a few sunny breaks after 4 PM.',
    humidity: 66, dew: 17, wind: 14, gust: 22, windDir: 'W', windDeg: 270,
    uv: 3, uvLabel: 'Moderate', visibility: 9, visNote: 'Good visibility.',
    pressure: 1011, pressureNote: 'Steady.',
    sunrise: '6:45 AM', sunset: '5:58 PM', sunProgress: 0.52, startHour: 13,
    hours: ['cloud', 'cloud', 'cloud', 'partly', 'partly', 'cloud', 'cloud', 'cloud', 'cloud', 'cloud', 'cloud', 'cloud'],
    hourDelta: [0, 0, 1, 1, 0, -1, -2, -3, -3, -4, -4, -5],
    hourPop: [0, 0, 10, 0, 0, 0, 10, 10, 0, 0, 0, 0],
    days: [['cloud', 19, 27, 10], ['partly', 19, 28, 0], ['cloud', 20, 27, 20], ['rain', 20, 25, 60], ['cloud', 19, 26, 20], ['partly', 18, 27, 0], ['partly', 18, 28, 0]],
    sky: ['#3D5878', '#5B7896', '#86A0BA'], cardBg: 'rgba(10,20,40,0.3)',
    cloudColor: 'rgba(235,240,248,0.5)', cloudCount: 6, cloudOpacity: 0.85, dropCount: 0,
    sun: false, moon: false, stars: false, rain: false, snow: false, lightning: false,
  },
  rain: {
    scene: 'rain',
    label: 'Heavy rain',
    city: 'Mumbai', temp: 26, desc: 'Heavy rain', hi: 28, lo: 24, feels: 29,
    feelsNote: 'High humidity makes it feel warmer.',
    summary: 'Rain continues until late evening. Gusts up to 38 km/h.',
    humidity: 92, dew: 24, wind: 24, gust: 38, windDir: 'SW', windDeg: 225,
    uv: 2, uvLabel: 'Low', visibility: 4, visNote: 'Rain is reducing visibility.',
    pressure: 1002, pressureNote: 'Falling slowly.',
    sunrise: '6:51 AM', sunset: '6:05 PM', sunProgress: 0.5, startHour: 13,
    hours: ['rain', 'rain', 'rain', 'rain', 'rain', 'rain', 'rain', 'storm', 'rain', 'rain', 'cloud', 'cloud'],
    hourDelta: [0, 0, 0, -1, -1, -1, -1, -2, -2, -2, -2, -2],
    hourPop: [90, 90, 85, 85, 80, 80, 75, 70, 60, 50, 40, 30],
    days: [['rain', 24, 28, 90], ['rain', 24, 29, 80], ['storm', 24, 29, 70], ['rain', 25, 30, 60], ['cloud', 25, 31, 30], ['partly', 25, 32, 10], ['rain', 24, 30, 60]],
    sky: ['#1F2A38', '#33465B', '#506479'], cardBg: 'rgba(8,14,24,0.3)',
    cloudColor: 'rgba(170,185,205,0.45)', cloudCount: 6, cloudOpacity: 0.9, dropCount: 70,
    sun: false, moon: false, stars: false, rain: true, snow: false, lightning: false,
  },
  storm: {
    scene: 'storm',
    label: 'Thunderstorm',
    city: 'Kolkata', temp: 27, desc: 'Thunderstorm', hi: 30, lo: 25, feels: 31,
    feelsNote: 'Muggy air makes it feel warmer.',
    summary: 'Thunderstorms likely until 7 PM. Stay indoors during lightning.',
    humidity: 86, dew: 24, wind: 31, gust: 52, windDir: 'SE', windDeg: 135,
    uv: 1, uvLabel: 'Low', visibility: 3, visNote: 'Heavy rain is reducing visibility.',
    pressure: 998, pressureNote: 'Falling quickly.',
    sunrise: '5:48 AM', sunset: '4:57 PM', sunProgress: 0.62, startHour: 13,
    hours: ['storm', 'storm', 'storm', 'storm', 'storm', 'rain', 'rain', 'cloud', 'cloud', 'cloud', 'cloud', 'cloud'],
    hourDelta: [0, 0, -1, -1, -2, -2, -2, -2, -3, -3, -3, -3],
    hourPop: [95, 95, 90, 85, 80, 70, 60, 40, 30, 20, 20, 10],
    days: [['storm', 25, 30, 90], ['rain', 24, 29, 70], ['storm', 24, 30, 80], ['cloud', 23, 30, 30], ['partly', 22, 30, 10], ['partly', 22, 29, 0], ['sun', 21, 29, 0]],
    sky: ['#0E111B', '#20283A', '#383F57'], cardBg: 'rgba(6,8,16,0.32)',
    cloudColor: 'rgba(120,130,155,0.5)', cloudCount: 6, cloudOpacity: 0.95, dropCount: 90,
    sun: false, moon: false, stars: false, rain: true, snow: false, lightning: true,
  },
  snow: {
    scene: 'snow',
    label: 'Light snow',
    city: 'Shimla', temp: -1, desc: 'Light snow', hi: 2, lo: -4, feels: -5,
    feelsNote: 'Wind makes it feel colder.',
    summary: 'Snowfall eases by evening. Roads may be icy overnight.',
    humidity: 81, dew: -4, wind: 9, gust: 17, windDir: 'N', windDeg: 0,
    uv: 1, uvLabel: 'Low', visibility: 2, visNote: 'Snow is reducing visibility.',
    pressure: 1016, pressureNote: 'Rising slowly.',
    sunrise: '6:58 AM', sunset: '5:21 PM', sunProgress: 0.58, startHour: 13,
    hours: ['snow', 'snow', 'snow', 'snow', 'snow', 'cloud', 'cloud', 'cloud', 'moon', 'moon', 'moon', 'moon'],
    hourDelta: [0, 0, 1, 0, -1, -2, -2, -3, -3, -4, -4, -4],
    hourPop: [80, 80, 70, 60, 50, 30, 20, 10, 0, 0, 0, 0],
    days: [['snow', -4, 2, 80], ['cloud', -5, 3, 20], ['partly', -4, 5, 0], ['sun', -3, 6, 0], ['snow', -5, 1, 70], ['snow', -6, 0, 60], ['partly', -5, 3, 10]],
    sky: ['#2F4A68', '#4E6C8E', '#7591B0'], cardBg: 'rgba(10,22,44,0.32)',
    cloudColor: 'rgba(225,232,242,0.5)', cloudCount: 4, cloudOpacity: 0.8, dropCount: 0,
    sun: false, moon: false, stars: false, rain: false, snow: true, lightning: false,
  },
  night: {
    scene: 'night',
    label: 'Clear night',
    city: 'Bengaluru', temp: 19, desc: 'Clear night', hi: 27, lo: 17, feels: 19,
    feelsNote: 'Similar to the actual temperature.',
    summary: 'Clear skies overnight. Coolest just before dawn.',
    humidity: 64, dew: 12, wind: 7, gust: 13, windDir: 'E', windDeg: 90,
    uv: 0, uvLabel: 'None', visibility: 10, visNote: 'Perfectly clear view.',
    pressure: 1013, pressureNote: 'Steady.',
    sunrise: '6:24 AM', sunset: '5:52 PM', sunProgress: 1, startHour: 21,
    hours: ['moon', 'moon', 'moon', 'moon', 'moon', 'moon', 'moon', 'moon', 'moon', 'partly', 'sun', 'sun'],
    hourDelta: [0, -1, -1, -2, -2, -2, -3, -3, -3, -2, 0, 2],
    hourPop: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    days: [['sun', 17, 27, 0], ['partly', 17, 28, 0], ['sun', 18, 28, 0], ['partly', 18, 27, 10], ['rain', 18, 25, 50], ['partly', 17, 26, 10], ['sun', 17, 27, 0]],
    sky: ['#050817', '#10183A', '#262C5A'], cardBg: 'rgba(4,8,24,0.32)',
    cloudColor: 'rgba(140,150,190,0.3)', cloudCount: 1, cloudOpacity: 0.6, dropCount: 0,
    sun: false, moon: true, stars: true, rain: false, snow: false, lightning: false,
  },
};

export const DAY_NAMES = ['Today', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];

// Seeded random so particle layouts are stable across renders.
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rDrops = seeded(7);
export const DROPS = Array.from({ length: 90 }, () => ({
  x: rDrops() * 116 - 8,
  h: Math.round(40 + rDrops() * 50),
  o: 0.25 + rDrops() * 0.5,
  dur: 0.55 + rDrops() * 0.45,
  delay: -rDrops() * 2,
}));

const rFlakes = seeded(11);
export const FLAKES = Array.from({ length: 55 }, () => {
  const s = 2 + rFlakes() * 5;
  return { x: rFlakes() * 100, s, o: 0.5 + rFlakes() * 0.5, blur: s < 3.5 ? 1 : 0, dur: 7 + rFlakes() * 8, delay: -rFlakes() * 15 };
});

const rStars = seeded(23);
export const STARS = Array.from({ length: 70 }, () => {
  const s = 0.8 + rStars() * 1.8;
  return { x: rStars() * 100, y: rStars() * 55, s, dur: 2 + rStars() * 4, delay: -rStars() * 6 };
});

export const CLOUDS = [
  { top: 64, scale: 1.1, dur: 95, delay: -20 },
  { top: 156, scale: 0.8, dur: 120, delay: -70 },
  { top: 20, scale: 1.4, dur: 140, delay: -100 },
  { top: 236, scale: 0.7, dur: 80, delay: -45 },
  { top: 110, scale: 1.2, dur: 110, delay: -5 },
  { top: 296, scale: 0.9, dur: 130, delay: -90 },
];

export const toUnit = (celsius: number, unit: Unit) => (unit === 'F' ? (celsius * 9) / 5 + 32 : celsius);
export const formatTemp = (celsius: number, unit: Unit) => `${Math.round(toUnit(celsius, unit))}°`;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function hourLabel(hour: number) {
  const hh = ((hour % 24) + 24) % 24;
  const n = hh % 12 === 0 ? 12 : hh % 12;
  return `${n} ${hh < 12 ? 'AM' : 'PM'}`;
}
