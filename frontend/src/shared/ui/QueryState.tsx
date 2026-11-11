import { ApiError } from '@/shared/api/client';
import { Button } from './Button';
export function Loading({ heights = [100, 100, 100] }: { heights?: number[] }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      {heights.map((height, i) => (
        <div key={i} style={{ height }} className="skeleton rounded-card" />
      ))}
    </div>
  );
}
export function QueryError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div
      className="mt-8 flex flex-col items-center gap-4 text-[13px] text-text-muted"
      role="alert"
    >
      {error instanceof ApiError && error.status === 401 ? (
        'Откройте приложение из Telegram'
      ) : (
        <>
          <p>Не удалось загрузить данные</p>
          <Button variant="secondary" onClick={retry}>
            Повторить
          </Button>
        </>
      )}
    </div>
  );
}
export function Empty({ children }: { children: string }) {
  return (
    <p className="mt-8 text-center text-[13px] text-text-muted">{children}</p>
  );
}
