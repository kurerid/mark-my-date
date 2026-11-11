import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '@/mocks/handlers';
import { db, resetFixtures } from '@/mocks/fixtures';
import {
  parseTiming,
  shiftDate,
  today,
  dateAt,
  isPastWindow,
} from '@/shared/lib/dates';
import {
  countersSchema,
  merchantSchema,
  productsResponse,
  settingsSchema,
  slotSchema,
  slotsResponse,
  timingSchema,
} from './schemas';
const server = setupServer(...handlers);
const call = (path: string, method = 'GET', body?: unknown) =>
  fetch(`http://localhost/api${path}`, {
    method,
    headers: {
      Authorization: 'tma development-only',
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
beforeEach(resetFixtures);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
describe('контракт API', () => {
  it('читает профиль, настройки, услуги, календарь, заявки и счётчики', async () => {
    for (const [path, schema] of [
      ['/merchant/self', merchantSchema],
      ['/merchant/settings', settingsSchema],
      ['/products', productsResponse],
      ['/slots?periodFrom=2020-01-01&periodTo=2099-01-01', slotsResponse],
      ['/slots/merchant?status=need_confirmation', slotsResponse],
      ['/slots/merchant/counters', countersSchema],
    ] as const) {
      const response = await call(path);
      expect(response.status).toBe(200);
      expect(schema.safeParse(await response.json()).success).toBe(true);
    }
  });
  it('требует авторизацию', async () => {
    expect((await fetch('http://localhost/api/products')).status).toBe(401);
  });
  it('PATCH профиля сохраняет неизменённые поля', async () => {
    const before = db.merchant;
    const result = merchantSchema.parse(
      await (await call('/merchant/self', 'PATCH', { title: 'Студия' })).json(),
    );
    expect(result.address).toBe(before.address);
    expect(result.publicLink).toBe(before.publicLink);
    expect(result.title).toBe('Студия');
  });
  it('глубоко сливает настройки и проверяет связанные поля', async () => {
    const response = await call('/merchant/settings', 'PATCH', {
      customerNotification: { dayBefore: { enabled: false } },
    });
    const result = settingsSchema.parse(await response.json());
    expect(result.customerNotification.dayBefore).toEqual({
      enabled: false,
      time: '18:00',
    });
    expect(result.timezone).toBe('Asia/Yekaterinburg');
    expect(
      (
        await call('/merchant/settings', 'PATCH', {
          schedule: { workHours: { from: '21:00' } },
        })
      ).status,
    ).toBe(400);
  });
  it('создаёт, частично изменяет и удаляет услугу, сохраняя старые записи', async () => {
    const original = db.slots[0];
    const response = await call('/products', 'POST', {
      name: 'Маникюр',
      durationMinutes: 30,
      price: null,
    });
    const product = await response.json();
    expect(response.status).toBe(201);
    const updated = await (
      await call(`/products/${product.id}`, 'PATCH', { price: 1500 })
    ).json();
    expect(updated.name).toBe('Маникюр');
    expect(updated.price).toBe(1500);
    expect((await call('/products/1', 'DELETE')).status).toBe(204);
    expect(db.slots[0]).toEqual(original);
    expect((await call(`/products/${product.id}`, 'DELETE')).status).toBe(204);
    expect(
      (await call(`/products/${product.id}`, 'PATCH', { name: 'Нет' })).status,
    ).toBe(404);
  });
  it('валидирует данные услуг', async () => {
    for (const body of [
      { name: '', durationMinutes: 30, price: null },
      { name: 'Услуга', durationMinutes: 16, price: 0 },
      { name: 'Услуга', durationMinutes: 30, price: 0.5 },
    ])
      expect((await call('/products', 'POST', body)).status).toBe(400);
  });
  it('создаёт окно, отклоняет пересечение и разрешает общую границу', async () => {
    const date = shiftDate(today(db.settings.timezone), 7);
    const created = slotSchema.parse(
      await (
        await call('/slots', 'POST', { date, timing: '10:00-11:00' })
      ).json(),
    );
    expect(
      (await call('/slots', 'POST', { date, timing: '10:30-11:30' })).status,
    ).toBe(409);
    expect(
      (await call('/slots', 'POST', { date, timing: '11:00-12:00' })).status,
    ).toBe(201);
    const edited = slotSchema.parse(
      await (
        await call(`/slots/${created.id}`, 'PATCH', { timing: '09:00-10:00' })
      ).json(),
    );
    expect(edited.date).toBe(date);
    expect((await call(`/slots/${created.id}`, 'DELETE')).status).toBe(204);
  });
  it('запрещает прошлое, переход суток и неправильный шаг', async () => {
    for (const input of [
      { date: '2000-01-01', timing: '10:00-11:00' },
      { date: '2099-01-01', timing: '23:00-01:00' },
      { date: '2099-01-01', timing: '10:05-11:00' },
    ])
      expect((await call('/slots', 'POST', input)).status).toBe(400);
  });
  it('подтверждает запись один раз и обновляет счётчик', async () => {
    const result = slotSchema.parse(
      await (await call('/slots/2/confirm', 'POST')).json(),
    );
    expect(result.status).toBe('confirmed');
    expect((await call('/slots/2/confirm', 'POST')).status).toBe(409);
    expect(
      (await (await call('/slots/merchant/counters')).json()).needConfirmation,
    ).toBe(1);
  });
  it('отклоняет запись без тела и очищает клиента и услугу', async () => {
    const result = slotSchema.parse(
      await (await call('/slots/2/reject', 'POST')).json(),
    );
    expect(result).toMatchObject({
      status: 'free',
      customer: null,
      product: null,
    });
    expect((await call('/slots/2/reject', 'POST')).status).toBe(409);
  });
  it('возвращает 409 на изменение и удаление занятого окна, 404 на отсутствующее', async () => {
    expect(
      (await call('/slots/1', 'PATCH', { timing: '08:00-09:00' })).status,
    ).toBe(409);
    expect((await call('/slots/1', 'DELETE')).status).toBe(409);
    for (const suffix of ['/missing', '/missing/confirm', '/missing/reject'])
      expect(
        (
          await call(
            `/slots${suffix}`,
            suffix === '/missing' ? 'DELETE' : 'POST',
          )
        ).status,
      ).toBe(404);
  });
  it('фильтрует даты и сортирует прошедшие в обратном порядке', async () => {
    const result = slotsResponse.parse(
      await (
        await call(
          `/slots/merchant?status=confirmed&periodTo=${shiftDate(today(db.settings.timezone), -1)}&order=desc`,
        )
      ).json(),
    );
    expect(result.slots).toHaveLength(1);
    expect(result.slots[0].id).toBe('7');
  });
});
describe('timing и часовой пояс', () => {
  it('разбирает интервал и отклоняет некорректные значения', () => {
    expect(parseTiming('10:00-11:30')).toEqual({
      start: '10:00',
      end: '11:30',
    });
    for (const value of ['10:00', '25:00-26:00', '11:00-10:00', '10:01-11:00'])
      expect(timingSchema.safeParse(value).success).toBe(false);
  });
  it('считает дату и прошлое время в поясе продавца', () => {
    const now = new Date('2026-11-10T22:00:00Z');
    expect(today('Asia/Yekaterinburg', now)).toBe('2026-11-11');
    expect(
      new Date(
        dateAt('2026-11-11', '10:00', 'Asia/Yekaterinburg').getTime(),
      ).toISOString(),
    ).toBe('2026-11-11T05:00:00.000Z');
    expect(
      isPastWindow('2026-11-11', '02:00-03:00', 'Asia/Yekaterinburg', now),
    ).toBe(true);
  });
});
