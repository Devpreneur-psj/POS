import { useEffect, useRef } from "react";

export function usePolling(callback: () => void, interval: number, deps: unknown[] = []) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!interval) return;
    const handler = () => savedCallback.current();
    handler();
    const id = window.setInterval(handler, interval);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, ...deps]);
}

