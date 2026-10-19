import { useState, useEffect } from 'react';

/**
 * Counts up smoothly from 0 to target value on mount / change
 */
export function useCountUp(target: number, durationMs: number = 350): number {
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = current;
    const diff = target - startVal;

    if (diff === 0) return;

    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // easeOutQuad
      const ease = 1 - (1 - progress) * (1 - progress);
      setCurrent(Math.round(startVal + diff * ease));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return current;
}
