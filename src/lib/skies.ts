import type { SkyKind } from './format';

/** How each sky looks: the colours and which animated layers it shows. */
interface Theme {
  /** Top, middle and bottom of the sky gradient. */
  sky: [string, string, string];
  /** Glass card tint that sits well on this sky. */
  card: string;
  cloud: string;
  clouds: number;
  cloudOpacity: number;
  drops: number;
  sun?: boolean;
  moon?: boolean;
  stars?: boolean;
  snow?: boolean;
  flash?: boolean;
}

export const SKY_THEMES: Record<SkyKind, Theme> = {
  clear: { sky: ['#0B4FB3', '#1F74DB', '#4C9BEB'], card: 'rgba(6,20,48,0.26)', cloud: 'rgba(255,255,255,0.55)', clouds: 2, cloudOpacity: 0.7, drops: 0, sun: true },
  partly: { sky: ['#0B4FB3', '#1F74DB', '#4C9BEB'], card: 'rgba(6,20,48,0.26)', cloud: 'rgba(255,255,255,0.55)', clouds: 4, cloudOpacity: 0.8, drops: 0, sun: true },
  cloudy: { sky: ['#3D5878', '#5B7896', '#86A0BA'], card: 'rgba(10,20,40,0.3)', cloud: 'rgba(235,240,248,0.5)', clouds: 6, cloudOpacity: 0.85, drops: 0 },
  cloudyNight: { sky: ['#050817', '#10183A', '#262C5A'], card: 'rgba(4,8,24,0.32)', cloud: 'rgba(140,150,190,0.3)', clouds: 6, cloudOpacity: 0.8, drops: 0 },
  rain: { sky: ['#1F2A38', '#33465B', '#506479'], card: 'rgba(8,14,24,0.3)', cloud: 'rgba(170,185,205,0.45)', clouds: 6, cloudOpacity: 0.9, drops: 70 },
  storm: { sky: ['#0E111B', '#20283A', '#383F57'], card: 'rgba(6,8,16,0.32)', cloud: 'rgba(120,130,155,0.5)', clouds: 6, cloudOpacity: 0.95, drops: 90, flash: true },
  snow: { sky: ['#2F4A68', '#4E6C8E', '#7591B0'], card: 'rgba(10,22,44,0.32)', cloud: 'rgba(225,232,242,0.5)', clouds: 4, cloudOpacity: 0.8, drops: 0, snow: true },
  night: { sky: ['#050817', '#10183A', '#262C5A'], card: 'rgba(4,8,24,0.32)', cloud: 'rgba(140,150,190,0.3)', clouds: 1, cloudOpacity: 0.6, drops: 0, moon: true, stars: true },
};
export const SKY_KINDS = Object.keys(SKY_THEMES) as SkyKind[];
