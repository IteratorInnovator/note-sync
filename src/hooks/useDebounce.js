import { useEffect, useRef } from "react";

/**
 * useDebounce
 *
 * Debounces the provided effect. Callers pass a callback that should run
 * after the delay and the list of dependencies to watch. When any dependency
 * changes, the previous timeout is cleared and a new one is scheduled.
 *
 * @param {Function} callback - Function to run after the debounce delay.
 * @param {Array} deps - Dependency list for re-running the debounce.
 * @param {number} delay - Time in milliseconds to wait before firing.
 */
export const useDebounce = (callback, deps, delay = 2000) => {
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback();
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, delay, callback]);
};
