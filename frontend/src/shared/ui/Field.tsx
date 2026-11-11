import { useId, type ReactNode } from 'react';
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  }) => ReactNode;
}) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      {label}
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? `${id}-error` : undefined,
      })}
      {error && (
        <span id={`${id}-error`} className="field-error">
          {error}
        </span>
      )}
    </label>
  );
}
