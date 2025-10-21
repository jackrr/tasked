import { useEffect, useRef, useState } from "react";

export function usePageTitle(title?: string | null) {
  // For some reason, <Head> tag expose by next.js doesn't seem to work
  // i suspect because I'm using client components for now
  useEffect(() => {
    if (title) document.title = `${title} (Tasked)`;
  }, [title]);
}

export function useDebounce<T>(value: T, delay: number): T {
  const lastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedVal, setDebouncedVal] = useState(value);

  useEffect(() => {
    if (lastTimeout.current) clearTimeout(lastTimeout.current);

    lastTimeout.current = setTimeout(() => {
      setDebouncedVal(value);
    }, delay);
  }, [value, delay]);

  return debouncedVal;
}
