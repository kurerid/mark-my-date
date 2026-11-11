import '@/app/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { isDevelopmentMock, initializeTelegram } from '@/shared/lib/telegram';
import { App } from '@/app/App';

await initializeTelegram().catch(() => false);
if (import.meta.env.DEV && isDevelopmentMock) {
  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledFrame: 'bypass' });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
