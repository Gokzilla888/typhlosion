import { useRef, useState, type PointerEvent, type ReactNode, type UIEvent } from 'react';
import { clamp01, formatTemp, hourLabel, ICON_LABELS, sceneForIcon, toUnit, type Condition, type Unit } from './data';
import { UiIcon } from './Icon';
import { Sky } from './Sky';
import { DailyCard, DetailTiles, HourlyCard, SunCard } from './Cards';
import { AirCard } from './AirCard';
import { aqiBand } from './airScale';
import { useCountUp } from './useCountUp';
import './weather.css';

interface WeatherScreenProps {
  weather: Condition;
  /** Opens the city picker. Without it the city button does nothing. */
  onCityClick?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Rendered on top of the screen, e.g. the city picker sheet. */
  overlay?: ReactNode;
  /** Fill the whole viewport instead of a 390×844 phone frame. */
  fullScreen?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const UNIT_KEY = 'wx-unit';

function loadUnit(): Unit {
  try {
    return localStorage.getItem(UNIT_KEY) === 'F' ? 'F' : 'C';
  } catch {
    return 'C';
  }
}

/** A phone screen showing the current weather, with an hour-by-hour preview. */
export function WeatherScreen({ weather: c, onCityClick, onRefresh, refreshing, overlay, fullScreen }: WeatherScreenProps) {
  const [unit, setUnitState] = useState<Unit>(loadUnit);
  const [scrollY, setScrollY] = useState(0);
  const [hour, setHour] = useState(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [strike, setStrike] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rippleId = useRef(0);

  const setUnit = (u: Unit) => {
    setUnitState(u);
    try {
      localStorage.setItem(UNIT_KEY, u);
    } catch {
      // Storage can be unavailable (private mode); the choice still applies now.
    }
  };

  // Previewing a later hour swaps the hero and the sky to that hour.
  const previewing = hour > 0;
  const hourIcon = c.hours[hour];
  const scene = previewing ? sceneForIcon(hourIcon, c.hourIsDay?.[hour]) : c.scene;
  const heroTemp = previewing ? c.temp + c.hourDelta[hour] : c.temp;
  const heroDesc = previewing ? ICON_LABELS[hourIcon] : c.desc;
  const shownTemp = useCountUp(heroTemp);
  const tempNow = Math.round(toUnit(shownTemp, unit));

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const y = e.currentTarget.scrollTop;
    setScrollY((prev) => (Math.abs(y - prev) > 0.5 ? y : prev));
  };

  // Pointer parallax: write CSS variables directly so particles don't re-render.
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = rootRef.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--wx-tx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty('--wx-ty', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const onPointerLeave = () => {
    rootRef.current?.style.setProperty('--wx-tx', '0');
    rootRef.current?.style.setProperty('--wx-ty', '0');
  };

  // Tapping open sky makes a ripple, and lightning during a storm.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    if (target.closest('button, a, input, .wx-card, .wx-sheet, .wx-topbar')) return;
    const r = rootRef.current!.getBoundingClientRect();
    const id = ++rippleId.current;
    setRipples((list) => [...list.slice(-4), { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    window.setTimeout(() => setRipples((list) => list.filter((rp) => rp.id !== id)), 1000);
    if (scene === 'storm') setStrike((n) => n + 1);
  };

  const scrollToAir = () => {
    const scroller = scrollerRef.current;
    const card = scroller?.querySelector<HTMLElement>('.wx-air');
    if (scroller && card) scroller.scrollTo({ top: card.offsetTop - 118, behavior: 'smooth' });
  };

  // Scroll-driven motion: the hero shrinks and fades, the top bar frosts,
  // and a compact temperature slides into the bar.
  const heroP = clamp01(scrollY / 220);
  const bar = clamp01((scrollY - 110) / 80);
  const compact = clamp01((scrollY - 170) / 60);

  return (
    <div
      ref={rootRef}
      className={`wx-screen${fullScreen ? ' wx-screen--full' : ''}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
    >
      <Sky condition={scene} scrollY={scrollY} wind={c.wind} intensity={c.intensity} strike={strike} />

      <div className="wx-ripples" aria-hidden="true">
        {ripples.map((rp) => (
          <span key={rp.id} className="wx-ripple" style={{ left: rp.x, top: rp.y }} />
        ))}
      </div>

      <div ref={scrollerRef} className="wx-scroller" onScroll={onScroll}>
        <div
          className="wx-hero"
          style={{
            transform: `translateY(${scrollY * 0.3}px) scale(${1 - 0.22 * heroP})`,
            opacity: clamp01(1 - 1.15 * heroP),
          }}
        >
          <div className="wx-hero-temp" aria-live="polite">
            <span className="wx-hero-num">{tempNow}</span>
            <span className="wx-hero-deg">°</span>
          </div>
          <div key={heroDesc} className="wx-hero-desc wx-swap">
            {heroDesc}
          </div>
          {previewing ? (
            <div className="wx-hero-meta wx-swap">
              <span>
                Forecast for {hourLabel(c.startHour + hour)}
                {c.hourPop[hour] ? ` · ${c.hourPop[hour]}% chance of rain` : ''}
              </span>
            </div>
          ) : (
            <div className="wx-hero-meta">
              <span>H {formatTemp(c.hi, unit)}</span>
              <span>L {formatTemp(c.lo, unit)}</span>
              <span>Feels like {formatTemp(c.feels, unit)}</span>
            </div>
          )}
          <div className="wx-hero-actions">
            {previewing ? (
              <button type="button" className="wx-chip wx-swap" onClick={() => setHour(0)}>
                Back to now
              </button>
            ) : (
              c.air && (
                <button type="button" className="wx-chip wx-swap" onClick={scrollToAir}>
                  <span className="wx-chip-dot" style={{ background: aqiBand(c.air.aqi).color }} />
                  AQI {c.air.aqi} · {aqiBand(c.air.aqi).label}
                </button>
              )
            )}
          </div>
        </div>

        <div className="wx-stack">
          <HourlyCard c={c} unit={unit} selected={hour} onSelect={setHour} />
          <DailyCard c={c} unit={unit} />
          <AirCard c={c} />
          <DetailTiles c={c} unit={unit} />
          <SunCard c={c} />
          <div className="wx-footer">
            <span>
              Weather data by <a href="https://open-meteo.com">Open-Meteo.com</a> · {c.updatedNote ?? 'Updated just now'}
            </span>
            {onRefresh && (
              <button type="button" className="wx-chip" onClick={onRefresh} disabled={refreshing}>
                <span className={refreshing ? 'wx-spin' : ''}>
                  <UiIcon name="refresh" size={14} />
                </span>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            )}
          </div>
        </div>
      </div>

      <header
        className="wx-topbar"
        style={{
          background: `rgba(8,16,36,${bar * 0.35})`,
          backdropFilter: `blur(${bar * 18}px)`,
          WebkitBackdropFilter: `blur(${bar * 18}px)`,
          borderBottomColor: `rgba(255,255,255,${bar * 0.12})`,
        }}
      >
        <div className="wx-topbar-left">
          <button type="button" className="wx-city" aria-label={`${c.city}. Change city`} aria-haspopup="dialog" onClick={onCityClick}>
            <UiIcon name="pin" size={18} />
            <span className="wx-city-name">{c.city}</span>
            <UiIcon name="chevronDown" size={16} />
          </button>
          <div className="wx-compact" style={{ opacity: compact, transform: `translateY(${(1 - compact) * 6}px)` }}>
            {tempNow}° · {heroDesc}
          </div>
        </div>
        <div className="wx-units" role="group" aria-label="Temperature unit">
          {(['C', 'F'] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-label={u === 'C' ? 'Show Celsius' : 'Show Fahrenheit'}
              aria-pressed={unit === u}
              className={`wx-unit${unit === u ? ' wx-unit--on' : ''}`}
              onClick={() => setUnit(u)}
            >
              °{u}
            </button>
          ))}
        </div>
      </header>

      {overlay}
    </div>
  );
}
