import type { ReactNode } from 'react';
export function ListRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-[52px] items-center gap-3 py-1 pl-4 pr-3 border-divider not-first:border-t">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium">{label}</div>
        {hint && <div className="text-[12px] text-text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  );
}
