import type { Merchant, Product, Settings, Slot } from '@/shared/api/schemas';
import { shiftDate, today } from '@/shared/lib/dates';
export function createFixtures() {
  const settings: Settings = {
    schedule: {
      workDays: [1, 2, 3, 4, 5, 6],
      workHours: { from: '10:00', to: '20:00' },
      breakMinutes: 15,
      bookingHorizonDays: 14,
    },
    slotConfirmation: { autoConfirm: false, deadlineHours: 24 },
    customerNotification: {
      onConfirm: true,
      dayBefore: { enabled: true, time: '18:00' },
      sameDay: { enabled: true, hoursBefore: 2 },
    },
    personalNotification: { newBooking: true },
    language: 'ru',
    timezone: 'Asia/Yekaterinburg',
  };
  const merchant: Merchant = {
    ownerChatId: '1',
    title: 'Студия «Нежность»',
    address: '[АДРЕС СТУДИИ]',
    description: '[Короткое описание: опыт мастера, материалы, как добраться]',
    publicLink: 'https://t.me/example_bot?startapp=nezhnost',
  };
  const products: Product[] = [
    ['Маникюр с покрытием', 90],
    ['Снятие покрытия', 30],
    ['Наращивание', 150],
    ['Педикюр', 90],
  ].map(([name, durationMinutes], i) => ({
    id: String(i + 1),
    name: String(name),
    durationMinutes: Number(durationMinutes),
    price: null,
  }));
  const day = today(settings.timezone);
  const booked = (
    id: string,
    date: string,
    timing: string,
    name: string,
    username: string,
    product: Product,
    status: 'confirmed' | 'need_confirmation',
  ): Slot => ({
    id,
    date,
    timing,
    status,
    customer: { chatId: id, name, username },
    product: { id: product.id, name: product.name },
  });
  const slots: Slot[] = [
    booked(
      '1',
      day,
      '10:00-11:30',
      'Анна Ковалёва',
      'anna',
      products[0],
      'confirmed',
    ),
    booked(
      '2',
      day,
      '12:00-13:30',
      'Мария Соколова',
      'maria_s',
      products[2],
      'need_confirmation',
    ),
    ...['14:00-15:30', '16:00-17:30', '18:00-19:30'].map((timing, i): Slot => ({
      id: String(i + 3),
      date: day,
      timing,
      status: 'free',
      customer: null,
      product: null,
    })),
    booked(
      '6',
      shiftDate(day, 2),
      '10:00-11:30',
      'Елена Воронина',
      'lena_vrn',
      products[3],
      'need_confirmation',
    ),
    booked(
      '7',
      shiftDate(day, -1),
      '12:00-13:30',
      'Анна Ковалёва',
      'anna',
      products[1],
      'confirmed',
    ),
    booked(
      '8',
      shiftDate(day, 1),
      '11:00-12:30',
      'Ольга Петрова',
      'olga',
      products[0],
      'confirmed',
    ),
  ];
  return { settings, merchant, products, slots };
}
export let db = createFixtures();
export function resetFixtures() {
  db = createFixtures();
}
