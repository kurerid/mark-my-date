export function Switch({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex h-11 w-[52px] shrink-0 items-center disabled:opacity-50"
    >
      <span
        className={`flex h-8 w-[52px] rounded-full p-[3px] ${checked ? 'justify-end bg-accent' : 'justify-start bg-free'}`}
      >
        <span className="size-[26px] rounded-full bg-white shadow-[0_1px_3px_rgba(20,23,28,0.2)]" />
      </span>
    </button>
  );
}
