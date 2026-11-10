import { ICON_COLORS, ICON_PATHS, type IconName } from './data';

/** Weather condition icon, tinted with its condition color. */
export function WeatherIcon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={ICON_COLORS[name]}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export const UI_ICONS = {
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  thermometer: 'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z',
  droplet: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
  wind: 'M9.59 4.59A2 2 0 1 1 11 8H2M12.59 19.41A2 2 0 1 0 14 16H2M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2',
  sun: ICON_PATHS.sun,
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
  gauge: 'M12 14l4-4M3.34 19a10 10 0 1 1 17.32 0',
  sunrise: 'M17 18a5 5 0 0 0-10 0M12 2v7M4.22 10.22l1.42 1.42M1 18h2M21 18h2M18.36 11.64l1.42-1.42M23 22H1M8 6l4-4 4 4',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM15 10a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
  chevronDown: 'M6 9l6 6 6-6',
  refresh: 'M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6',
  search: 'M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0a8 8 0 1 1 16 0',
  locate: 'M12 2v3M12 19v3M2 12h3M19 12h3M19 12a7 7 0 1 1-14 0a7 7 0 1 1 14 0M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
  close: 'M18 6L6 18M6 6l12 12',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0',
} as const;

/** Monochrome stroke icon that inherits the text color. */
export function UiIcon({ name, size = 15, strokeWidth = 2 }: { name: keyof typeof UI_ICONS; size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={UI_ICONS[name]} />
    </svg>
  );
}
