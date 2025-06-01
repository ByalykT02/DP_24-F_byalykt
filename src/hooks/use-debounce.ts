import { useEffect, useState } from "react";

/**
 * Custom hook to debounce a value.
 * Returns the debounced value, which updates after a specified delay.
 */
export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value.
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500); 
    // Clear the timeout if the value or delay changes.  This is the cleanup function

    // in the useEffect, ensuring that only the last timer is active.
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]); // Re-run effect when value or delay changes

  return debouncedValue; // Return the debounced value.
}
