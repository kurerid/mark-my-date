import { z } from 'zod';

export const dateSchema = z.iso.date();
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const time15 = time.refine((v) => Number(v.slice(3)) % 15 === 0);
const time30 = time.refine((v) => Number(v.slice(3)) % 30 === 0);
const name = z
  .string()
  .trim()
  .min(1, 'Заполните поле')
  .max(64, 'Слишком длинно');
export const merchantInput = z.object({
  title: name,
  address: z.string().max(200, 'Слишком длинно'),
  description: z.string().max(1000, 'Слишком длинно'),
});
export const merchantSchema = merchantInput.extend({
  ownerChatId: z.string(),
  publicLink: z.url(),
});
export const productInput = z.object({
  name,
  durationMinutes: z.number().int().min(15).max(480).multipleOf(15),
  price: z.number().int().min(0).max(1000000).nullable(),
});
export const productSchema = productInput.extend({ id: z.string() });
const workHours = z
  .object({ from: time30, to: time30 })
  .refine((v) => v.from < v.to, {
    path: ['to'],
    message: 'Недопустимое значение',
  });
const schedule = z.object({
  workDays: z
    .array(z.number().int().min(1).max(7))
    .min(1)
    .refine((v) => new Set(v).size === v.length),
  workHours,
  breakMinutes: z.union([
    z.literal(0),
    z.literal(5),
    z.literal(10),
    z.literal(15),
    z.literal(20),
    z.literal(30),
    z.literal(45),
    z.literal(60),
  ]),
  bookingHorizonDays: z.union([
    z.literal(7),
    z.literal(14),
    z.literal(30),
    z.literal(60),
  ]),
});
const confirmation = z.object({
  autoConfirm: z.boolean(),
  deadlineHours: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(4),
    z.literal(12),
    z.literal(24),
    z.literal(48),
  ]),
});
const dayBefore = z.object({
  enabled: z.boolean(),
  time: time.refine((v) => v.endsWith(':00') && v >= '08:00' && v <= '22:00'),
});
const sameDay = z.object({
  enabled: z.boolean(),
  hoursBefore: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
});
const customerNotification = z.object({
  onConfirm: z.boolean(),
  dayBefore,
  sameDay,
});
const personalNotification = z.object({ newBooking: z.boolean() });
export const settingsSchema = z.object({
  schedule,
  slotConfirmation: confirmation,
  customerNotification,
  personalNotification,
  language: z.literal('ru'),
  timezone: z.string().refine((value) => {
    try {
      new Intl.DateTimeFormat('ru', { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }),
});
export const settingsPatch = z.object({
  schedule: schedule
    .partial()
    .extend({
      workHours: z.object({ from: time30, to: time30 }).partial().optional(),
    })
    .optional(),
  slotConfirmation: confirmation.partial().optional(),
  customerNotification: customerNotification
    .partial()
    .extend({
      dayBefore: dayBefore.partial().optional(),
      sameDay: sameDay.partial().optional(),
    })
    .optional(),
  personalNotification: personalNotification.partial().optional(),
  language: z.literal('ru').optional(),
});
const customer = z.object({
  chatId: z.string(),
  name: z.string(),
  username: z.string().nullable(),
});
const productRef = z.object({ id: z.string(), name: z.string() });
export const timingSchema = z.string().refine((value) => {
  const parts = value.split('-');
  return (
    parts.length === 2 &&
    parts.every((v) => time15.safeParse(v).success) &&
    parts[0] < parts[1]
  );
}, 'Недопустимое значение');
const slotBase = z.object({
  id: z.string(),
  date: dateSchema,
  timing: timingSchema,
});
export const slotSchema = z.discriminatedUnion('status', [
  slotBase.extend({
    status: z.literal('free'),
    customer: z.null(),
    product: z.null(),
  }),
  slotBase.extend({
    status: z.literal('need_confirmation'),
    customer,
    product: productRef,
  }),
  slotBase.extend({
    status: z.literal('confirmed'),
    customer,
    product: productRef,
  }),
]);
export const slotInput = z.object({ date: dateSchema, timing: timingSchema });
export const slotsResponse = z.object({ slots: z.array(slotSchema) });
export const productsResponse = z.object({ products: z.array(productSchema) });
export const countersSchema = z.object({
  needConfirmation: z.number().int().nonnegative(),
});
export const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
export type Merchant = z.infer<typeof merchantSchema>;
export type Product = z.infer<typeof productSchema>;
export type Slot = z.infer<typeof slotSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type SettingsPatch = z.infer<typeof settingsPatch>;
