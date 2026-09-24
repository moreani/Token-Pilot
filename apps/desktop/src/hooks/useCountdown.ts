import { useState, useEffect } from 'react';

/**
 * useCountdown — live ticking countdown to a target ISO date string.
 * Updates every second. Returns a formatted string like "4h 17m 42s"
 * or null if resetsAt is null/past.
 * When countdown reaches 0, triggers optional onExpired callback.
 */
export function useCountdown(
  resetsAt: string | null | undefined,
  onExpired?: () => void
): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!resetsAt) {
      setLabel(null);
      return;
    }

    let firedExpired = false;

    const compute = () => {
      const diff = new Date(resetsAt).getTime() - Date.now();
      if (diff <= 0) {
        setLabel(null);
        if (!firedExpired && onExpired) {
          firedExpired = true;
          onExpired();
        }
        return;
      }
      const totalSecs = Math.floor(diff / 1000);
      const d = Math.floor(totalSecs / 86400);
      const h = Math.floor((totalSecs % 86400) / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;

      if (d > 0) {
        setLabel(`${d}d ${h}h ${String(m).padStart(2, '0')}m`);
      } else if (h > 0) {
        setLabel(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
      } else {
        setLabel(`${m}m ${String(s).padStart(2, '0')}s`);
      }
    };

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [resetsAt, onExpired]);

  return label;
}

