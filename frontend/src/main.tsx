import '@/app/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTelegram } from '@/shared/lib/telegram';
import { App } from '@/app/App';

await initializeTelegram().catch(() => false);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
