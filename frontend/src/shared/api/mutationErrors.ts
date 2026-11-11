import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';
import { notify } from '@/shared/ui/Toast';
export const invalidateSlots = (client: QueryClient) =>
  Promise.all(
    ['slots', 'merchantSlots', 'counters'].map((key) =>
      client.invalidateQueries({ queryKey: [key] }),
    ),
  );
export function mutationError(
  error: unknown,
  {
    close,
    refresh,
    form = false,
  }: { close?: () => void; refresh: () => unknown; form?: boolean },
) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      close?.();
      notify('Уже удалено, список обновлён');
      void refresh();
      return;
    }
    if (error.status === 409) {
      if (!form) {
        notify('Запись уже изменилась, список обновлён');
        void refresh();
      }
      return;
    }
    if (error.status === 400) {
      notify('Проверьте введённые данные');
      return;
    }
    if (error.status === 401) {
      notify('Откройте приложение из Telegram');
      return;
    }
  }
  notify('Что-то пошло не так. Попробуйте ещё раз');
}
export function changedFields<T extends object>(
  original: T,
  next: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(next).filter(
      ([key, value]) =>
        JSON.stringify(value) !== JSON.stringify(original[key as keyof T]),
    ),
  ) as Partial<T>;
}
