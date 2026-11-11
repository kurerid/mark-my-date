import { TZDate } from '@date-fns/tz';
import { addDays, format, startOfWeek, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { timingSchema } from '@/shared/api/schemas';

export const parseTiming = (value: string) => {
  const [start, end] = timingSchema.parse(value).split('-');
  return { start, end };
};
export const zonedNow = (timezone: string, now = new Date()) =>
  new TZDate(now, timezone);
export const today = (timezone: string, now = new Date()) =>
  format(zonedNow(timezone, now), 'yyyy-MM-dd');
export function dateAt(date: string, timing: string, timezone: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = timing.split(':').map(Number);
  return new TZDate(year, month - 1, day, hour, minute, 0, timezone);
}
export function shiftDate(date: string, amount: number) {
  return format(addDays(dateAt(date, '12:00', 'UTC'), amount), 'yyyy-MM-dd');
}
export function weekDates(date: string) {
  const monday = startOfWeek(dateAt(date, '12:00', 'UTC'), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(monday, i), 'yyyy-MM-dd'),
  );
}
export function formatDay(date: string, pattern: string) {
  return format(
    dateAt(date, '12:00', 'UTC'),
    pattern
      .split(/(E+)/)
      .map((part) => (part === 'EEE' ? 'EEEEEE' : part))
      .join(''),
    { locale: ru },
  ).replace(/\./g, '');
}
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const isPastWindow = (
  date: string,
  timing: string,
  timezone: string,
  now = new Date(),
) =>
  dateAt(date, parseTiming(timing).start, timezone).getTime() < now.getTime();
export function reminderDate(
  date: string,
  timing: string,
  settings: {
    timezone: string;
    customerNotification: {
      dayBefore: { enabled: boolean; time: string };
      sameDay: { enabled: boolean; hoursBefore: number };
    };
  },
  now = new Date(),
) {
  const { dayBefore, sameDay } = settings.customerNotification;
  const start = dateAt(date, parseTiming(timing).start, settings.timezone);
  const candidates = [];
  if (dayBefore.enabled) {
    const previous = subDays(start, 1);
    const [h, m] = dayBefore.time.split(':').map(Number);
    previous.setHours(h, m, 0, 0);
    candidates.push(previous);
  }
  if (sameDay.enabled)
    candidates.push(
      new TZDate(
        start.getTime() - sameDay.hoursBefore * 3600000,
        settings.timezone,
      ),
    );
  return candidates
    .filter((d) => d.getTime() > now.getTime())
    .sort((a, b) => a.getTime() - b.getTime())[0];
}
