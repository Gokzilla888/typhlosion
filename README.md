# Weather app

An animated weather screen built with React, TypeScript and Vite. It covers six conditions (clear, cloudy, rain, storm, snow, night), each with its own animated sky, plus hourly and 7-day forecasts, detail tiles, a sunrise/sunset arc and a °C/°F switch.

## Run it

```bash
npm install
npm run dev
```

## Code

- `src/weather/data.ts`: the sample weather data for each condition, icons and formatting helpers
- `src/weather/Sky.tsx`: the animated background (sun, moon, stars, clouds, rain, snow, lightning)
- `src/weather/Cards.tsx`: the hourly, 7-day, detail tile and sunrise/sunset cards
- `src/weather/WeatherScreen.tsx`: the phone screen with its scroll effects and top bar
- `src/App.tsx`: the demo page with a condition picker and all screens side by side
