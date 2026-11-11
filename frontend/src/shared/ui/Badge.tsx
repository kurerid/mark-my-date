import type { ReactNode } from 'react';
export function Badge({
  variant,
  children,
}: {
  variant: 'booked' | 'pending' | 'neutral';
  children: ReactNode;
}) {
  const color = {
    booked: 'text-booked bg-booked-bg',
    pending: 'text-pending bg-pending-bg',
    neutral: 'text-text-subtle bg-surface-muted',
  };
  return (
    <span
      className={`self-start rounded-full px-2 py-[3px] text-[11px] font-semibold ${color[variant]}`}
    >
      {children}
    </span>
  );
}
