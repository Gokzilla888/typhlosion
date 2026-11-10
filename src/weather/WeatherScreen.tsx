import { useState, type UIEvent } from 'react';
import { clamp01, CONDITIONS, formatTemp, toUnit, type ConditionKey, type Unit } from './data';
import { UiIcon } from './Icon';
import { Sky } from './Sky';
import { DailyCard, DetailTiles, HourlyCard, SunCard } from './Cards';
import { useCountUp } from './useCountUp';
import './weather.css';

interface WeatherScreenProps {
  condition: ConditionKey;
}

/** A 390×844 phone screen showing the current weather for one condition. */
export function WeatherScreen({ condition }: WeatherScreenProps) {
  const c = CONDITIONS[condition];
  const [unit, setUnit] = useState<Unit>('C');
  const [scrollY, setScrollY] = useState(0);
  const shownTemp = useCountUp(c.temp);

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const y = e.currentTarget.scrollTop;
    setScrollY((prev) => (Math.abs(y - prev) > 0.5 ? y : prev));
  };

  // Scroll-driven motion: the hero shrinks and fades, the top bar frosts,
  // and a compact temperature slides into the bar.
  const heroP = clamp01(scrollY / 220);
  const bar = clamp01((scrollY - 110) / 80);
  const compact = clamp01((scrollY - 170) / 60);
  const tempNow = Math.round(toUnit(shownTemp, unit));

  return (
    <div className="wx-screen">
      <Sky condition={condition} scrollY={scrollY} />

      <div className="wx-scroller" onScroll={onScroll}>
        <div
          className="wx-hero"
          style={{
            transform: `translateY(${scrollY * 0.3}px) scale(${1 - 0.22 * heroP})`,
            opacity: clamp01(1 - 1.15 * heroP),
          }}
        >
          <div className="wx-hero-temp">
            <span className="wx-hero-num">{tempNow}</span>
            <span className="wx-hero-deg">°</span>
          </div>
          <div className="wx-hero-desc">{c.desc}</div>
          <div className="wx-hero-meta">
            <span>H {formatTemp(c.hi, unit)}</span>
            <span>L {formatTemp(c.lo, unit)}</span>
            <span>Feels like {formatTemp(c.feels, unit)}</span>
          </div>
        </div>

        <div className="wx-stack">
          <HourlyCard c={c} unit={unit} />
          <DailyCard c={c} unit={unit} />
          <DetailTiles c={c} unit={unit} />
          <SunCard c={c} />
          <div className="wx-footer">
            Weather data by <a href="https://open-meteo.com">Open-Meteo.com</a> · Updated just now
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
          <button type="button" className="wx-city" aria-label="Change city">
            <UiIcon name="pin" size={18} />
            {c.city}
            <UiIcon name="chevronDown" size={16} />
          </button>
          <div className="wx-compact" style={{ opacity: compact, transform: `translateY(${(1 - compact) * 6}px)` }}>
            {tempNow}° · {c.desc}
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
    </div>
  );
}
