export function Avatar({
  name,
  business = false,
  tone = 'warm',
}: {
  name: string;
  business?: boolean;
  tone?: 'warm' | 'blue';
}) {
  const text = business
    ? Array.from(name.trim())[0]
    : name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => Array.from(s)[0])
        .join('');
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center font-bold ${business ? 'size-20 rounded-[26px] bg-accent text-white font-heading text-[30px]' : `size-11 rounded-full text-[15px] ${tone === 'warm' ? 'bg-avatar-warm text-pending' : 'bg-booked-bg text-booked'}`}`}
    >
      {text}
    </span>
  );
}
