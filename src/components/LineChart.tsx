import { useRef, type PointerEvent } from 'react';

interface LineChartProps {
  primary: (number | null)[];
  secondary?: (number | null)[];
  /** Tick labels above the chart, by index. */
  ticks: { index: number; label: string }[];
  selected: number;
  selectedLabel: string;
  onSelect: (index: number) => void;
  /** Spoken summary of what is charted. */
  label: string;
}

const W = 300;
const H = 104;
const PAD_Y = 8;

function niceRange(values: number[]): [number, number] {
  if (!values.length) return [0, 1];
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi - lo < 2) {
    lo -= 1;
    hi += 1;
  }
  const step = Math.pow(10, Math.floor(Math.log10(hi - lo))) / 2;
  return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
}

const fmt = (v: number) => (Math.abs(v) >= 100 || Number.isInteger(v) ? String(Math.round(v)) : v.toFixed(1));

/** Two-line chart with a cursor; drag across it to pick an hour or day. */
export function LineChart({ primary, secondary, ticks, selected, selectedLabel, onSelect, label }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const n = primary.length;
  const values = [...primary, ...(secondary ?? [])].filter((v): v is number => v != null);
  const [lo, hi] = niceRange(values);
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => PAD_Y + (1 - (v - lo) / (hi - lo)) * (H - PAD_Y * 2);

  const path = (series: (number | null)[]) => {
    let d = '';
    let pen = false;
    series.forEach((v, i) => {
      if (v == null) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  const pickAt = (e: PointerEvent<SVGSVGElement>) => {
    const r = svgRef.current!.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    onSelect(Math.max(0, Math.min(n - 1, i)));
  };

  const sel = primary[selected];
  const selPct = n <= 1 ? 0 : (selected / (n - 1)) * 100;

  return (
    <div className="nb-chart">
      <div className="nb-chart-ticks" aria-hidden="true">
        {ticks
          .filter((t) => Math.abs(t.index - selected) > (n > 10 ? 1 : 0))
          .map((t) => (
            <span key={t.index} style={{ left: `${(t.index / Math.max(1, n - 1)) * 100}%` }}>
              {t.label}
            </span>
          ))}
        <span className="nb-chart-chip" style={{ left: `${selPct}%` }}>
          {selectedLabel}
        </span>
      </div>
      <div className="nb-chart-body">
        <div className="nb-chart-plot">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={label}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pickAt(e);
          }}
          onPointerMove={(e) => e.buttons && pickAt(e)}
        >
          <line x1={x(selected)} x2={x(selected)} y1="0" y2={H} stroke="#9a9a9a" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          {secondary && <path d={path(secondary)} fill="none" stroke="#a8a8a8" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
          <path d={path(primary)} fill="none" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {sel != null && <span className="nb-chart-dot" style={{ left: `${selPct}%`, top: `${(y(sel) / H) * 100}%` }} />}
        </div>
        <div className="nb-chart-axis" aria-hidden="true">
          <span>{fmt(hi)}</span>
          <span>{fmt((hi + lo) / 2)}</span>
          <span>{fmt(lo)}</span>
        </div>
      </div>
    </div>
  );
}
