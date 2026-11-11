/** Extrusion: many 1px shadows stacked down-right, darkening with depth. */
const EXTRUDE = Array.from({ length: 22 }, (_, i) => {
  const d = i + 1;
  const shade = Math.round(58 - d * 2);
  return `${(d * 0.55).toFixed(2)}px ${d}px 0 rgb(${shade},${shade},${shade})`;
})
  .concat(['14px 34px 26px rgba(0,0,0,0.28)'])
  .join(', ');

interface NumeralsProps {
  value: string;
  /** Accessible text, e.g. "25 degrees". */
  label: string;
  /** Font size in px for two characters; shrinks for longer values. */
  size?: number;
  /** Cap as a share of the viewport height, so short screens still fit. */
  maxVh?: number;
}

/** Giant chunky 3D numbers. */
export function Numerals({ value, label, size = 300, maxVh = 32 }: NumeralsProps) {
  const scale = value.length <= 2 ? 1 : value.length === 3 ? 0.78 : 0.62;
  const fontSize = `min(${Math.round(size * scale)}px, ${Math.round(78 * scale)}vw, ${Math.round(maxVh * scale)}vh)`;
  return (
    <div className="nb-num" style={{ fontSize }} role="img" aria-label={label}>
      <span className="nb-num-back" style={{ textShadow: EXTRUDE }} aria-hidden="true">
        {value}
      </span>
      <span className="nb-num-front" aria-hidden="true">
        {value}
      </span>
    </div>
  );
}
