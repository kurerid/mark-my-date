import type { ButtonHTMLAttributes } from 'react';
const variants = {
  primary: 'bg-accent text-white border-transparent hover:bg-accent-hover',
  secondary: 'bg-surface text-text border-border',
  dashed: 'bg-transparent text-accent border-accent border-dashed',
  'ghost-icon': 'bg-transparent text-text-muted border-transparent p-0 w-11',
};
export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-button border px-3.5 text-[14px] font-semibold disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
