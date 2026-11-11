import type { Slot } from '@/shared/api/schemas';
import { capitalize, formatDay } from '@/shared/lib/dates';
const priority = { need_confirmation: 0, confirmed: 1, free: 2 };
export function WeekStrip({
  dates,
  selected,
  slots,
  onSelect,
}: {
  dates: string[];
  selected: string;
  slots: Slot[];
  onSelect: (date: string) => void;
}) {
  return (
    <section
      aria-label="Неделя"
      className="grid grid-cols-7 gap-1 rounded-section bg-surface px-2 py-2.5"
    >
      {dates.map((date, index) => {
        const active = date === selected;
        const dots = slots
          .filter((s) => s.date === date)
          .sort(
            (a, b) =>
              priority[a.status] - priority[b.status] ||
              a.timing.localeCompare(b.timing),
          )
          .slice(0, 3);
        return (
          <button
            key={date}
            aria-label={capitalize(formatDay(date, 'EEEE, d MMMM'))}
            aria-pressed={active}
            onClick={() => onSelect(date)}
            className={`flex h-16 flex-col items-center justify-center gap-[3px] rounded-[14px] ${active ? 'bg-accent text-white' : `bg-transparent ${index > 4 ? 'text-text-muted' : 'text-text'}`}`}
          >
            <span className="text-[11px] font-medium opacity-80">
              {capitalize(formatDay(date, 'EEEEEE'))}
            </span>
            <span className="text-[17px] font-bold">
              {formatDay(date, 'd')}
            </span>
            <span className="flex h-[5px] gap-[3px]" aria-hidden="true">
              {dots.map((slot) => (
                <span
                  key={slot.id}
                  className="size-[5px] rounded-full"
                  style={{
                    background:
                      slot.status === 'need_confirmation'
                        ? active
                          ? '#FFD59A'
                          : '#E07A10'
                        : slot.status === 'confirmed'
                          ? active
                            ? '#FFFFFF'
                            : 'var(--accent)'
                          : active
                            ? 'rgba(255,255,255,0.55)'
                            : '#C9CDD6',
                  }}
                />
              ))}
            </span>
          </button>
        );
      })}
    </section>
  );
}
