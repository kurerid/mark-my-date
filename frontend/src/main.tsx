import '@/app/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { isDevelopmentMock, initializeTelegram } from '@/shared/lib/telegram';
import { App } from '@/app/App';

await initializeTelegram().catch((error: unknown) => {
  if (import.meta.env.DEV) console.error(error);
  return false;
});
if (import.meta.env.DEV && isDevelopmentMock) {
  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledFrame: 'bypass' });
}

const Root =
  import.meta.env.DEV && new URLSearchParams(location.search).has('tokens')
    ? (await import('@/app/TokenPreview')).TokenPreview
    : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
