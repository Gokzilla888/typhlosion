import type { SceneKind } from '../lib/format';

const PATHS = {
  search: 'M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0a8 8 0 1 1 16 0',
  locate: 'M12 2v3M12 19v3M2 12h3M19 12h3M19 12a7 7 0 1 1-14 0a7 7 0 1 1 14 0M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
  close: 'M18 6L6 18M6 6l12 12',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM15 10a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
  chevronDown: 'M6 9l6 6 6-6',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  thermometer: 'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z',
  droplet: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
  wind: 'M9.59 4.59A2 2 0 1 1 11 8H2M12.59 19.41A2 2 0 1 0 14 16H2M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
  gauge: 'M12 14l4-4M3.34 19a10 10 0 1 1 17.32 0',
  sunrise: 'M17 18a5 5 0 0 0-10 0M12 2v7M4.22 10.22l1.42 1.42M1 18h2M21 18h2M18.36 11.64l1.42-1.42M23 22H1M8 6l4-4 4 4',
  sun: 'M16 12a4 4 0 1 1-8 0a4 4 0 1 1 8 0M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79z',
  cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
  partly: 'M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.95 12.65a4 4 0 0 0-5.93-4.13M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6z',
  rain: 'M16 13v8M8 13v8M12 15v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25',
  storm: 'M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9M13 11l-4 6h6l-4 6',
  snow: 'M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function Icon({ name, size = 20, strokeWidth = 2, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

const WEATHER: Record<SceneKind, { icon: IconName; color: string }> = {
  sun: { icon: 'sun', color: '#FFD166' },
  moon: { icon: 'moon', color: '#F1E9C9' },
  partly: { icon: 'partly', color: '#FFE08A' },
  cloud: { icon: 'cloud', color: '#FFFFFF' },
  fog: { icon: 'cloud', color: '#FFFFFF' },
  rain: { icon: 'rain', color: '#A8DAFF' },
  storm: { icon: 'storm', color: '#FFD166' },
  snow: { icon: 'snow', color: '#FFFFFF' },
};

/** Tinted condition icon for the hourly and daily forecasts. */
export function WeatherIcon({ kind, size = 24 }: { kind: SceneKind; size?: number }) {
  const { icon, color } = WEATHER[kind];
  return <Icon name={icon} size={size} strokeWidth={1.8} color={color} />;
}
