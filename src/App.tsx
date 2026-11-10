import { useState } from 'react';
import { CONDITION_KEYS, CONDITIONS, type ConditionKey } from './weather/data';
import { WeatherScreen } from './weather/WeatherScreen';
import './App.css';

const PREVIEWS: ConditionKey[] = ['clear', 'rain', 'storm', 'snow', 'night'];

export default function App() {
  const [focused, setFocused] = useState<ConditionKey>('clear');

  return (
    <main className="app">
      <h1 className="app-title">Weather app — motion preview</h1>

      <section className="app-section" aria-labelledby="try-it">
        <h2 id="try-it" className="app-subtitle">Try it</h2>
        <div className="app-picker" role="group" aria-label="Weather condition">
          {CONDITION_KEYS.map((k) => (
            <button key={k} type="button" aria-pressed={focused === k} className={focused === k ? 'is-on' : ''} onClick={() => setFocused(k)}>
              {CONDITIONS[k].label}
            </button>
          ))}
        </div>
        <div className="app-phone">
          <WeatherScreen condition={focused} />
        </div>
      </section>

      <section className="app-section" aria-labelledby="all">
        <h2 id="all" className="app-subtitle">All conditions</h2>
        <div className="app-gallery">
          {PREVIEWS.map((k) => (
            <figure key={k} className="app-frame">
              <figcaption>
                {CONDITIONS[k].label} · {CONDITIONS[k].city}
              </figcaption>
              <WeatherScreen condition={k} />
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
