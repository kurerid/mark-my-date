import { Bell } from 'lucide-react';
import type { Settings, Slot } from '@/shared/api/schemas';
import {
  capitalize,
  formatDay,
  parseTiming,
  reminderDate,
  today,
  shiftDate,
} from '@/shared/lib/dates';
export function reminderLabel(date: Date, timezone: string, now = new Date()) {
  const day = today(timezone, date);
  const current = today(timezone, now);
  const prefix =
    day === current
      ? 'Сегодня'
      : day === shiftDate(current, 1)
        ? 'Завтра'
        : capitalize(formatDay(day, 'EEE'));
  const time = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(date);
  return `${prefix} ${time}`;
}
export function BookingRow({
  slot,
  settings,
  past = false,
}: {
  slot: Extract<Slot, { status: 'confirmed' }>;
  settings: Settings;
  past?: boolean;
}) {
  const remind = past
    ? undefined
    : reminderDate(slot.date, slot.timing, settings);
  return (
    <article className="flex items-center gap-3 rounded-card bg-surface px-4 py-3.5">
      <div className="flex w-[52px] shrink-0 flex-col gap-0.5">
        <span className="text-[12px] text-text-muted">
          {capitalize(formatDay(slot.date, 'EEE d'))}
        </span>
        <span
          className={`text-[16px] font-bold ${past ? 'text-text-muted' : ''}`}
        >
          {parseTiming(slot.timing).start}
        </span>
      </div>
      <div
        className={`flex min-w-0 flex-1 flex-col gap-0.5 border-l-[3px] pl-3 ${past ? 'border-free' : 'border-accent'}`}
      >
        <span className="font-semibold">{slot.customer.name}</span>
        <span className="text-[13px] text-text-muted">{slot.product.name}</span>
      </div>
      {remind && (
        <span className="flex max-w-[90px] items-center gap-1 text-[11px] text-text-muted">
          <Bell size={14} className="shrink-0" aria-hidden="true" />
          {reminderLabel(remind, settings.timezone)}
        </span>
      )}
    </article>
  );
}
