import { useEffect, useState } from 'react';
import { CONDITION_KEYS, CONDITIONS } from './weather/data';
import { LiveWeather } from './weather/LiveWeather';
import { WeatherScreen } from './weather/WeatherScreen';
import './App.css';

const useHash = () => {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
};

function Previews() {
  return (
    <main className="app">
      <a className="app-link" href="#">
        ← Back to live weather
      </a>
      <h1 className="app-title">Weather app — motion preview</h1>
      <p className="app-lede">Every animated sky with sample data. Tap an hour, a day or the sky to try the interactions.</p>
      <div className="app-gallery">
        {CONDITION_KEYS.map((k) => (
          <figure key={k} className="app-frame">
            <figcaption>
              {CONDITIONS[k].label} · {CONDITIONS[k].city}
            </figcaption>
            <WeatherScreen weather={CONDITIONS[k]} />
          </figure>
        ))}
      </div>
    </main>
  );
}

export default function App() {
  const hash = useHash();
  if (hash === '#previews') return <Previews />;

  return (
    <main className="app-live">
      <h1 className="wx-visually-hidden">Weather</h1>
      <LiveWeather />
      <a className="app-link app-live-link" href="#previews">
        See every weather animation
      </a>
    </main>
  );
}
