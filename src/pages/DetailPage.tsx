import { useState, type ReactNode } from 'react';
import { DataTable, ModeToggle, Scrubber } from '../components/Controls';
import { LineChart } from '../components/LineChart';
import { hourShort, hourLong, weekday } from '../lib/format';
import type { Forecast, Mode, Units } from '../lib/types';
import type { PageDef, Selection } from './metrics';

interface DetailPageProps {
  page: PageDef;
  forecast: Forecast;
  selection: Selection;
  units: Units;
  /** Illustration or big numbers under the title. */
  art: ReactNode;
  onIndex: (i: number) => void;
  onMode: (m: Mode) => void;
}

/** Title, artwork, data table, chart, scrubber and DAY/WEEK switch. */
export function DetailPage({ page, forecast: f, selection: s, units, art, onIndex, onMode }: DetailPageProps) {
  const [metricKey, setMetricKey] = useState(page.metrics[0].key);
  const picked = page.metrics.find((m) => m.key === metricKey) ?? page.metrics[0];
  // Rows without a chart (direction, sunrise…) chart the page's first metric.
  const charted = (s.mode === 'day' ? picked.hour : picked.day) ? picked : page.metrics[0];
  const conv = (v: number | null) => (v == null ? null : charted.convert ? charted.convert(v, units) : v);

  const day = s.mode === 'day';
  const primary = day ? f.hours.map((h) => conv(charted.hour?.(h) ?? null)) : f.days.map((d) => conv(charted.day?.(d) ?? null));
  const secondaryFn = day ? charted.hour2 : charted.day2;
  const secondary = secondaryFn ? (day ? f.hours.map((h) => conv(charted.hour2!(h))) : f.days.map((d) => conv(charted.day2!(d)))) : undefined;

  const ticks = day
    ? f.hours.map((h, i) => ({ index: i, label: i === 0 ? 'NOW' : hourShort(h.time) })).filter((t) => t.index === 0 || (t.index % 6 === 0 && t.index < 23))
    : f.days.map((d, i) => ({ index: i, label: i === 0 ? 'TOD' : weekday(d.date) }));
  const selLabel = day ? (s.index === 0 ? 'NOW' : hourShort(f.hours[s.index].time)) : s.index === 0 ? 'TOD' : weekday(f.days[s.index].date);
  const max = day ? f.hours.length - 1 : f.days.length - 1;
  const valueText = day ? (s.index === 0 ? 'Now' : hourLong(f.hours[s.index].time)) : s.index === 0 ? 'Today' : weekday(f.days[s.index].date);

  return (
    <div className="nb-detail">
      <h2 className="nb-title">{page.title}</h2>
      <div className="nb-art">{art}</div>
      <DataTable rows={page.metrics.map((m) => ({ key: m.key, label: m.label, value: m.value(s, units) }))} selected={metricKey} onSelect={setMetricKey} />
      <LineChart
        primary={primary}
        secondary={secondary}
        ticks={ticks}
        selected={s.index}
        selectedLabel={selLabel}
        onSelect={onIndex}
        label={`${charted.label} ${day ? 'over the next 24 hours' : 'over the next 7 days'}`}
      />
      <Scrubber value={s.index} max={max} onChange={onIndex} label={day ? 'Pick an hour' : 'Pick a day'} valueText={valueText} />
      <ModeToggle mode={s.mode} onChange={onMode} />
    </div>
  );
}
