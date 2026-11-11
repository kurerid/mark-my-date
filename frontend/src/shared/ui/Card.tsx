import type { HTMLAttributes } from 'react';
export function Card({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-surface rounded-card ${className}`} {...props} />;
}
