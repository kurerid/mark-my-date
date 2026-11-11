import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { on } from '@tma.js/sdk';
import { focusManager } from '@tanstack/react-query';
import { TabBar } from '@/widgets/tab-bar/TabBar';
import { Toast } from '@/shared/ui/Toast';
import { queryClient } from './queryClient';
export function Layout() {
  useEffect(
    () =>
      on('visibility_changed', ({ is_visible }) => {
        // SDK bridge exposes Telegram activated/deactivated as visibility_changed.
        focusManager.setFocused(is_visible);
        if (is_visible) void queryClient.refetchQueries({ type: 'active' });
      }),
    [],
  );
  return (
    <>
      <main className="screen">
        <Outlet />
      </main>
      <TabBar />
      <Toast />
    </>
  );
}
