# Typhlosion Weather

A monochrome, swipeable weather app built with React, TypeScript and Vite, packaged for Android with Capacitor. The design is inspired by the layout and type style of Not Boring Weather, with original artwork.

## Pages

Swipe left and right, or tap the tabs on the screen edges.

- **Now**: a glossy illustration of the current weather (clouds pick up red pollution specks when the air is bad), giant 3D temperature numbers, the condition, alert pills (air quality, storms, rain, wind, UV) and a 24-hour timeline you can scrub.
- **Temp**: temperature, high, low, feels like, humidity and dew point.
- **Air**: a spinning anemometer (speed follows the wind, the arrow shows its direction), wind speed and gusts, direction, visibility, pressure, AQI and pollen.
- **Precip**: a drop that fills with the chance of rain, plus amount, cloud cover, humidity, UV, sunrise and sunset.
- **AQI**: a flower that wilts as pollution rises, US AQI, PM2.5, PM10, ozone, NO₂ and pollen.

Each detail page has a data table (tap a row to chart it), a chart you can drag across, a timeline scrubber and a Day/Week switch.

Data comes from [Open-Meteo](https://open-meteo.com) (weather, air quality, pollen and city search; free, no API key). Pollen is only available for Europe. GPS positions are named with BigDataCloud's free reverse-geocoding endpoint. Location comes from GPS on first launch, or tap the city name to search. Units (°C/°F, km/h, m/s, mph) are in settings (the ring button).

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

- `src/lib/openMeteo.ts`: weather, air quality and city search requests, GPS, and shaping the data
- `src/lib/format.ts`: units, labels, weather codes, AQI and pollen scales
- `src/pages/metrics.ts`: the rows and charts on each detail page
- `src/pages/NowPage.tsx`, `src/pages/DetailPage.tsx`: page layouts
- `src/components/`: numerals, illustrations (scene, anemometer, raindrop, flower), chart, controls and sheets
- `src/App.tsx`: loading, location, settings and the page swiper
- `android/`: the Capacitor Android project
