import { useCallback, useEffect, useRef, useState } from "react";

/** Tracks an element's rendered height with a ResizeObserver. Returns a callback ref and the height. */
export function useElementHeight<T extends HTMLElement>(): [(node: T | null) => void, number] {
  const [height, setHeight] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: T | null) => {
    observer.current?.disconnect();
    if (!node) return;
    const measure = () => setHeight(Math.round(node.getBoundingClientRect().height));
    measure();
    observer.current = new ResizeObserver(measure);
    observer.current.observe(node);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  return [ref, height];
}
