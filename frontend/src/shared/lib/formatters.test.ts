import { describe, expect, it } from 'vitest';
import { reminderLabel } from '@/entities/booking/BookingRow';
import { createFixtures } from '@/mocks/fixtures';
import { dateAt, formatDay, reminderDate, shiftDate, weekDates } from './dates';
import {
  formatDuration,
  formatPrice,
  slotSummary,
  statusLabel,
} from './formatters';
import { changedSettings, mergeSettings } from '@/shared/api/mergeSettings';
describe('форматирование', () => {
  it('склоняет окна и скрывает нулевое ожидание', () => {
    expect(slotSummary(1, 0)).toBe('1 окно');
    expect(slotSummary(2, 1)).toBe('2 окна · 1 ждёт');
    expect(slotSummary(5, 2)).toBe('5 окон · 2 ждёт');
    expect(slotSummary(21, 0)).toBe('21 окно');
  });
  it('форматирует цену, отсутствие цены и длительность', () => {
    expect(formatPrice(null)).toBe('—');
    expect(formatPrice(0)).toBe('0 ₽');
    expect(formatPrice(1500).replace(/\s/g, ' ')).toBe('1 500 ₽');
    expect(formatDuration(30)).toBe('30 мин');
    expect(formatDuration(60)).toBe('1 ч');
    expect(formatDuration(90)).toBe('1 ч 30 мин');
  });
  it('сопоставляет только три статуса API', () => {
    expect(statusLabel).toEqual({
      free: 'Свободно',
      need_confirmation: 'Ждёт подтверждения',
      confirmed: 'Занято',
    });
  });
  it('строит неделю с понедельника и корректно пересекает месяц', () => {
    expect(weekDates('2026-11-01')).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(formatDay('2026-11-11', 'EEEE, d MMMM')).toBe('среда, 11 ноября');
  });
});
describe('напоминания', () => {
  const settings = createFixtures().settings;
  it('выбирает ближайшее будущее напоминание и скрывает прошедшие', () => {
    const now = new Date('2026-11-10T10:00:00Z');
    const first = reminderDate('2026-11-11', '10:00-11:30', settings, now);
    expect(first?.getTime()).toBe(Date.parse('2026-11-10T13:00:00Z'));
    const afterFirst = reminderDate(
      '2026-11-11',
      '10:00-11:30',
      settings,
      new Date('2026-11-10T14:00:00Z'),
    );
    expect(afterFirst?.getTime()).toBe(Date.parse('2026-11-11T03:00:00Z'));
    expect(
      reminderDate(
        '2026-11-11',
        '10:00-11:30',
        settings,
        new Date('2026-11-11T05:00:00Z'),
      ),
    ).toBeUndefined();
  });
  it('не показывает отключённые напоминания', () => {
    const disabled = mergeSettings(settings, {
      customerNotification: {
        dayBefore: { enabled: false },
        sameDay: { enabled: false },
      },
    });
    expect(reminderDate('2099-01-01', '10:00-11:00', disabled)).toBeUndefined();
  });
  it('форматирует сегодня, завтра и день недели в поясе продавца', () => {
    const now = new Date('2026-11-10T22:00:00Z');
    expect(
      reminderLabel(
        dateAt('2026-11-11', '18:00', settings.timezone),
        settings.timezone,
        now,
      ),
    ).toBe('Сегодня 18:00');
    expect(
      reminderLabel(
        dateAt('2026-11-12', '18:00', settings.timezone),
        settings.timezone,
        now,
      ),
    ).toBe('Завтра 18:00');
    expect(
      reminderLabel(
        dateAt('2026-11-13', '18:00', settings.timezone),
        settings.timezone,
        now,
      ),
    ).toBe('Пт 18:00');
  });
  it('сохраняет 18:00 накануне через переход летнего времени', () => {
    const berlin = { ...settings, timezone: 'Europe/Berlin' };
    const date = reminderDate(
      '2026-03-29',
      '10:00-11:30',
      berlin,
      new Date('2026-03-27T12:00:00Z'),
    );
    expect(date?.getTime()).toBe(Date.parse('2026-03-28T17:00:00Z'));
  });
});
it('PATCH содержит только изменённые вложенные поля', () => {
  const settings = createFixtures().settings;
  expect(
    changedSettings(settings, {
      schedule: { workHours: { from: '11:00', to: '20:00' } },
      customerNotification: { dayBefore: { enabled: true } },
    }),
  ).toEqual({ schedule: { workHours: { from: '11:00' } } });
  expect(
    changedSettings(settings, { schedule: { workDays: [1, 2, 3, 4, 5, 6] } }),
  ).toEqual({});
});
