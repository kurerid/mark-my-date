import { useId } from 'react';
export function SegmentedControl({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  const id = useId();
  return (
    <div
      role="tablist"
      aria-label={label}
      className="grid grid-cols-3 gap-1 rounded-[14px] bg-segment p-1"
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          id={`${id}-${option.value}`}
          role="tab"
          aria-selected={value === option.value}
          tabIndex={value === option.value ? 0 : -1}
          onKeyDown={(e) => {
            let next: number;
            if (e.key === 'ArrowRight') next = (index + 1) % options.length;
            else if (e.key === 'ArrowLeft')
              next = (index + options.length - 1) % options.length;
            else if (e.key === 'Home') next = 0;
            else if (e.key === 'End') next = options.length - 1;
            else return;
            e.preventDefault();
            onChange(options[next].value);
            (
              e.currentTarget.parentElement?.children[next] as HTMLElement
            )?.focus();
          }}
          onClick={() => onChange(option.value)}
          className={`relative h-10 rounded-[10px] before:absolute before:-inset-y-0.5 before:inset-x-0 text-[13px] ${value === option.value ? 'bg-surface text-text font-semibold shadow-[0_1px_3px_rgba(20,23,28,0.12)]' : 'text-segment-text font-medium'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
