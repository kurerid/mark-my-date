import {
  backButton,
  init,
  initData,
  isTMA,
  retrieveRawInitData,
  miniApp,
  themeParams,
  viewport,
} from '@tma.js/sdk';

export let isDevelopmentMock = false;
export async function initializeTelegram() {
  let raw: string | undefined;
  try {
    raw = retrieveRawInitData();
  } catch {
    raw = undefined;
  }
  if (
    import.meta.env.DEV &&
    (!raw || new URLSearchParams(raw).get('hash') === 'development-only')
  ) {
    const { installTelegramMock } = await import('@/mocks/telegram');
    installTelegramMock();
    isDevelopmentMock = true;
  }
  if (!isTMA()) return false;
  init();
  initData.restore();
  miniApp.mount();
  backButton.mount();
  const accent = () =>
    document.documentElement.style.setProperty(
      '--accent',
      themeParams.buttonColor() ?? '#2A6BE0',
    );
  accent();
  themeParams.buttonColor.sub(accent);
  await viewport.mount({ timeout: 5000 });
  const safeArea = () => {
    const style = document.documentElement.style;
    for (const [key, value] of Object.entries(viewport.safeAreaInsets()))
      style.setProperty(`--tg-safe-area-inset-${key}`, `${value}px`);
    for (const [key, value] of Object.entries(viewport.contentSafeAreaInsets()))
      style.setProperty(`--tg-content-safe-area-inset-${key}`, `${value}px`);
  };
  safeArea();
  viewport.safeAreaInsets.sub(safeArea);
  viewport.contentSafeAreaInsets.sub(safeArea);
  viewport.expand();
  miniApp.ready();
  return true;
}
