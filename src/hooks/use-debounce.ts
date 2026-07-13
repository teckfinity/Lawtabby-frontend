import { useState, useEffect } from "react";

/**
 * Debounces a value by the given delay (ms).
 * Use for search inputs to avoid firing a query on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
