import { useEffect, useRef, useState } from 'react';

/**
 * Eases a number toward `target` whenever it changes (ease-out cubic).
 * On first mount it counts up from `target - initialOffset`.
 */
export function useCountUp(target: number, initialOffset = 8, duration = 1100) {
  const [value, setValue] = useState(target - initialOffset);
  const current = useRef(value);

  useEffect(() => {
    const from = current.current;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      const v = from + (target - from) * e;
      current.current = v;
      setValue(v);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
