import { useSyncExternalStore } from 'react';
let unauthorized = false;
const listeners = new Set<() => void>();
export function markUnauthorized() {
  unauthorized = true;
  for (const listener of listeners) listener();
}
export function useUnauthorized() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => unauthorized,
  );
}
