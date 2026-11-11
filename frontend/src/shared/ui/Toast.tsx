import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
let message = '';
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function notify(text: string) {
  message = text;
  clearTimeout(timer);
  for (const listener of listeners) listener();
  timer = setTimeout(() => {
    message = '';
    for (const listener of listeners) listener();
  }, 2500);
}
export function Toast() {
  const [host, setHost] = useState<Element>(() => document.body);
  useEffect(() => {
    const syncHost = () =>
      setHost(document.querySelector('dialog[open]') ?? document.body);
    const observer = new MutationObserver(syncHost);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['open'],
    });
    syncHost();
    return () => observer.disconnect();
  }, []);

  const value = useSyncExternalStore(subscribe, () => message);
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={
        value
          ? 'fixed left-1/2 z-50 max-w-[calc(100%-32px)] -translate-x-1/2 rounded-button bg-text px-4 py-3 text-[14px] text-white text-center'
          : ''
      }
      style={{ bottom: 'calc(var(--tabbar-height) + 12px)' }}
    >
      {value}
    </div>,
    host,
  );
}
