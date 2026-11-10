import type { PollenKind } from './data';

// ---------- AQI scale (US EPA) ----------

interface AqiBand {
  max: number;
  label: string;
  color: string;
  advice: string;
}

export const AQI_BANDS: AqiBand[] = [
  { max: 50, label: 'Good', color: '#4ADE80', advice: 'Air is clean. A great time to be outside.' },
  { max: 100, label: 'Moderate', color: '#FACC15', advice: 'Acceptable. Very sensitive people should take it easy outdoors.' },
  { max: 150, label: 'Unhealthy for sensitive groups', color: '#FB923C', advice: 'Children, older adults and people with asthma should limit long outdoor activity.' },
  { max: 200, label: 'Unhealthy', color: '#F87171', advice: 'Everyone may feel effects. Limit time outdoors and consider a mask.' },
  { max: 300, label: 'Very unhealthy', color: '#C084FC', advice: 'Health alert. Avoid outdoor activity and keep windows closed.' },
  { max: Infinity, label: 'Hazardous', color: '#FB7185', advice: 'Emergency conditions. Stay indoors.' },
];

export const aqiBand = (aqi: number) => AQI_BANDS.find((b) => aqi <= b.max)!;

/** 1 = thriving flower, 0 = wilted. Clean air up to 40 keeps it perfect. */
export const healthFor = (aqi: number) => Math.max(0, Math.min(1, 1 - (aqi - 40) / 260));

// ---------- Pollen ----------

export const POLLEN_LABELS: Record<PollenKind, string> = {
  alder: 'Alder', birch: 'Birch', olive: 'Olive', grass: 'Grass', mugwort: 'Mugwort', ragweed: 'Ragweed',
};

/** Grains/m³ where Low, Moderate, High and Very high begin, by plant type. */
const POLLEN_THRESHOLDS: Record<PollenKind, [number, number, number, number]> = {
  alder: [1, 15, 90, 1500],
  birch: [1, 15, 90, 1500],
  olive: [1, 15, 90, 1500],
  grass: [1, 20, 50, 200],
  mugwort: [1, 10, 50, 500],
  ragweed: [1, 10, 50, 500],
};
export const POLLEN_LEVELS = ['None', 'Low', 'Moderate', 'High', 'Very high'];
export const POLLEN_COLORS = ['rgba(255,255,255,0.25)', '#4ADE80', '#FACC15', '#FB923C', '#F87171'];

export const pollenLevel = (kind: PollenKind, grains: number) => POLLEN_THRESHOLDS[kind].filter((t) => grains >= t).length;
