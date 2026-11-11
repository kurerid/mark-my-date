import { Loading } from '@/shared/ui/QueryState';
import { useUnauthorized } from '@/shared/api/authorization';
import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router';
import { on } from '@tma.js/sdk';
import { focusManager } from '@tanstack/react-query';
import { TabBar } from '@/widgets/tab-bar/TabBar';
import { Toast } from '@/shared/ui/Toast';
import { queryClient } from './queryClient';
export function Layout() {
  const unauthorized = useUnauthorized();
  useEffect(
    () =>
      on('visibility_changed', ({ is_visible }) => {
        // SDK bridge exposes Telegram activated/deactivated as visibility_changed.
        focusManager.setFocused(is_visible);
        if (is_visible) void queryClient.refetchQueries({ type: 'active' });
      }),
    [],
  );
  if (unauthorized)
    return (
      <main className="screen justify-center text-center">
        <p role="alert" className="text-[13px] text-text-muted">
          Откройте приложение из Telegram
        </p>
      </main>
    );
  return (
    <>
      <main className="screen">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      <TabBar />
      <Toast />
    </>
  );
}
