const PATHS = {
  search: 'M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0a8 8 0 1 1 16 0',
  locate: 'M12 2v3M12 19v3M2 12h3M19 12h3M19 12a7 7 0 1 1-14 0a7 7 0 1 1 14 0M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
  close: 'M18 6L6 18M6 6l12 12',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM15 10a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
  refresh: 'M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
