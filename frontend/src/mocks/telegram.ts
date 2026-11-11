import { emitEvent, mockTelegramEnv } from '@tma.js/sdk';

export function installTelegramMock() {
  const theme = {
    bg_color: '#F2F3F7' as const,
    button_color: '#2A6BE0' as const,
    text_color: '#15171C' as const,
  };
  const zero = { top: 0, bottom: 0, left: 0, right: 0 };
  mockTelegramEnv({
    launchParams: {
      tgWebAppPlatform: 'tdesktop',
      tgWebAppVersion: '8.0',
      tgWebAppThemeParams: theme,
      tgWebAppData: new URLSearchParams({
        user: JSON.stringify({ id: 1, first_name: 'Светлана' }),
        auth_date: String(Math.floor(Date.now() / 1000)),
        hash: 'development-only',
        signature: '',
      }).toString(),
    },
    onEvent(event, next) {
      switch (event.name) {
        case 'web_app_request_theme':
          emitEvent('theme_changed', { theme_params: theme });
          break;
        case 'web_app_request_viewport':
          emitEvent('viewport_changed', {
            height: window.innerHeight,
            width: window.innerWidth,
            is_expanded: true,
            is_state_stable: true,
          });
          break;
        case 'web_app_request_safe_area':
          emitEvent('safe_area_changed', zero);
          break;
        case 'web_app_request_content_safe_area':
          emitEvent('content_safe_area_changed', zero);
          break;
        default:
          next();
      }
    },
  });
}
