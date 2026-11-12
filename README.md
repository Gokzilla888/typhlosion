# Typhlosion Weather

A weather app with an animated sky, built with React, TypeScript and Vite, packaged for Android with Capacitor.

## The screen

One scrolling page over a sky that matches the weather: a glowing sun, a moon with twinkling stars, drifting clouds, rain, snow and lightning.

- **Top bar**: the city (tap it to search or use GPS) and a °C/°F switch. As you scroll, the big temperature shrinks away and a compact reading appears in the bar.
- **Now**: the temperature, condition, today's high and low, and what it feels like.
- **Hourly**: a short summary of the next 12 hours over a 24-hour strip you can swipe.
- **7-day forecast**: each day's low–high range on a shared scale, with a dot for the current temperature.
- **Tiles**: feels like, humidity and dew point, wind (a dial pointing the way it blows), UV index, visibility and pressure.
- **Sunrise & sunset**: the sun's position along its arc.

Data comes from [Open-Meteo](https://open-meteo.com) (weather and city search; free, no API key). GPS positions are named with BigDataCloud's free reverse-geocoding endpoint. Location comes from GPS on first launch.

## Android APK

Every push to `main` builds an APK on GitHub Actions and attaches it to the **Latest APK** release:

https://github.com/Gokzilla888/typhlosion/releases/tag/apk-latest

Download `typhlosion-weather.apk` on your phone and open it. Android will ask you to allow installs from your browser or file manager the first time. The APK is signed with a debug key kept in the repo, so later builds install over earlier ones. For a store release, create a private release key instead.

To build it yourself you need Android Studio or the Android SDK and Java 21:

```bash
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Web

```bash
npm install
npm run dev
```

The web version is published to GitHub Pages on every push: https://gokzilla888.github.io/typhlosion/

## Code

- `src/lib/openMeteo.ts`: weather and city search requests, GPS, and shaping the data
- `src/lib/format.ts`: units, labels and weather codes
- `src/lib/insights.ts`: the summary sentence and the notes on each tile
- `src/lib/skies.ts`: colours and animated layers for each kind of sky
- `src/components/Sky.tsx`: the animated sky
- `src/components/Cards.tsx`: hourly and daily forecasts, tiles and the sun arc
- `src/pages/WeatherPage.tsx`: the page layout
- `src/App.tsx`: loading, location, units and the top bar
- `android/`: the Capacitor Android project
