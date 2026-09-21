import { useEffect, useRef, useState } from "react";

/**
 * Heartbeat for the "live" dashboards. Re-renders every `intervalMs` so
 * real-time counters re-sample; pages pass `tick` into the mock engine to
 * get a fresh-but-plausible value each beat. When real data lands this hook
 * becomes the polling/websocket refresh trigger — page code doesn't change.
 */
export function useLiveTick(intervalMs = 5000): { tick: number; lastUpdated: Date } {
  const [tick, setTick] = useState(0);
  const lastUpdated = useRef(new Date());
  useEffect(() => {
    const id = setInterval(() => {
      lastUpdated.current = new Date();
      setTick((t) => t + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return { tick, lastUpdated: lastUpdated.current };
}
