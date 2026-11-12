import { DailyCard, HourlyCard, SunCard, Tile, UvScale, WindDial } from '../components/Cards';
import { compass, describe, fmtDeg } from '../lib/format';
import { feelsNote, pressureNote, summarize, uvLabel, visibilityNote } from '../lib/insights';
import type { Forecast, Units } from '../lib/types';

interface WeatherPageProps {
  forecast: Forecast;
  units: Units;
  /** Current temperature in the chosen units, mid count-up. */
  shownTemp: number;
}

/** Everything that scrolls over the sky: the big temperature, forecasts and reading tiles. */
export function WeatherPage({ forecast: f, units, shownTemp }: WeatherPageProps) {
  const now = f.now;
  const today = f.days[0];
  const visibility = now.visibility >= 10 ? Math.round(now.visibility) : Number(now.visibility.toFixed(1));

  return (
    <>
      <div className="nb-hero">
        <div className="nb-hero-temp" role="img" aria-label={`${shownTemp} degrees`}>
          <span aria-hidden="true">{shownTemp}</span>
          <span aria-hidden="true">°</span>
        </div>
        <h2 className="nb-condition">{describe(now.code, now.isDay)}</h2>
        <p className="nb-hero-meta">
          <span>H {fmtDeg(today.hi, units)}</span>
          <span>L {fmtDeg(today.lo, units)}</span>
          <span>Feels like {fmtDeg(now.feels, units)}</span>
        </p>
      </div>

      <div className="nb-stack">
        <HourlyCard summary={summarize(f)} hours={f.hours} units={units} />
        <DailyCard days={f.days} now={now.temp} units={units} />

        <div className="nb-tiles nb-rise" style={{ animationDelay: '0.4s' }}>
          <Tile icon="thermometer" label="FEELS LIKE">
            <p className="nb-tile-value">{fmtDeg(now.feels, units)}</p>
            <p className="nb-tile-note">{feelsNote(now)}</p>
          </Tile>

          <Tile icon="droplet" label="HUMIDITY">
            <p className="nb-tile-value">{Math.round(now.humidity)}%</p>
            <p className="nb-tile-note">Dew point is {fmtDeg(now.dew, units)} right now.</p>
          </Tile>

          <Tile icon="wind" label="WIND">
            <div className="nb-wind">
              <WindDial from={now.windDir} />
              <p>
                <strong>{Math.round(now.wind)}</strong>
                <span>km/h</span>
              </p>
            </div>
            <p className="nb-tile-note">
              Gusts {Math.round(now.gust)} km/h · {compass(now.windDir)}
            </p>
          </Tile>

          <Tile icon="sun" label="UV INDEX">
            <p className="nb-tile-value nb-tile-value--tight">{Math.round(now.uv)}</p>
            <p className="nb-tile-sub">{uvLabel(now.uv)}</p>
            <UvScale uv={now.uv} />
          </Tile>

          <Tile icon="eye" label="VISIBILITY">
            <p className="nb-tile-value">{visibility} km</p>
            <p className="nb-tile-note">{visibilityNote(now)}</p>
          </Tile>

          <Tile icon="gauge" label="PRESSURE">
            <p className="nb-tile-value">{Math.round(now.pressure)}</p>
            <p className="nb-tile-note">hPa · {pressureNote(f.hours)}</p>
          </Tile>
        </div>

        <SunCard day={today} time={now.time} />

        <p className="nb-credit">
          Weather data by <a href="https://open-meteo.com">Open-Meteo.com</a> · Updated {f.fetchedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
    </>
  );
}
