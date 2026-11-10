# Weather app

A live, animated weather app built with React, TypeScript and Vite.

- **Live weather** from [Open-Meteo](https://open-meteo.com) (free, no API key): current conditions, 24-hour and 7-day forecasts, feels like, humidity, wind, UV, visibility, pressure, and sunrise/sunset. Refreshes every 15 minutes and when you come back to the tab.
- **Air quality and pollen** from Open-Meteo's air quality API: US AQI with health advice, PM2.5, PM10, ozone and NO₂, plus pollen levels by plant. A flower shows the air: it thrives with sparkles in clean air, then droops, loses petals, fades and gets surrounded by smog as pollution rises. Tap it to shake it. Pollen data is only available for Europe.
- **Location** by GPS on first visit, or pick a city from the search sheet (tap the city name). Recent cities are remembered. If location access is denied, it shows New Delhi.
- **Animated skies** for clear, cloudy, rain, storm, snow and night, driven by the data: wind speed sets cloud speed and rain slant, and rain or snow strength sets how many drops fall.
- **Interactions**: tap an hour to preview it (temperature, sky and description change), tap a day for details, move the pointer for parallax, tap the sky for a ripple (and lightning during storms), °C/°F switch.

Open `#previews` to see every sky side by side with sample data.

## Run it

```bash
npm install
npm run dev
```

## Code

- `src/weather/openMeteo.ts`: forecast and city search requests, GPS, and turning the API response into screen data
- `src/weather/LiveWeather.tsx`: location, loading, refreshing and the city picker
- `src/weather/CityPicker.tsx`: the slide-up city search sheet
- `src/weather/WeatherScreen.tsx`: the screen, with scroll effects, hour preview, ripples and parallax
- `src/weather/AirCard.tsx` and `airScale.ts`: the air quality card, the flower, and the AQI and pollen scales
- `src/weather/Sky.tsx`: the animated background
- `src/weather/Cards.tsx`: the hourly, 7-day, detail tile and sunrise/sunset cards
- `src/weather/data.ts`: types, icons and the sample data used by the previews

GPS positions are named with BigDataCloud's free reverse-geocoding endpoint, since Open-Meteo doesn't offer one.
