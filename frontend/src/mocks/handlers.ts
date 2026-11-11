import { http, HttpResponse, type HttpResponseResolver } from 'msw';
import { z } from 'zod';
import {
  merchantInput,
  productInput,
  slotInput,
  settingsPatch,
} from '@/shared/api/schemas';
import type { Slot } from '@/shared/api/schemas';
import { mergeSettings } from '@/shared/api/mergeSettings';
import { isPastWindow, parseTiming } from '@/shared/lib/dates';
import { db } from './fixtures';

const error = (status: number, code: string) =>
  HttpResponse.json({ error: { code, message: '' } }, { status });
const protect =
  (resolve: HttpResponseResolver): HttpResponseResolver =>
  async (info) => {
    if (!/^tma .+/.test(info.request.headers.get('Authorization') ?? ''))
      return error(401, 'unauthorized');
    try {
      return await resolve(info);
    } catch (e) {
      return error(
        e instanceof z.ZodError ? 400 : 500,
        e instanceof z.ZodError ? 'validation_error' : '',
      );
    }
  };
const filterSlots = (request: Request, merchant = false) => {
  const params = new URL(request.url).searchParams;
  const from = params.get('periodFrom'),
    to = params.get('periodTo'),
    status = params.get('status');
  return db.slots
    .filter(
      (s) =>
        (!from || s.date >= from) &&
        (!to || s.date <= to) &&
        (!merchant || !status || s.status === status),
    )
    .sort(
      (a, b) =>
        (a.date.localeCompare(b.date) || a.timing.localeCompare(b.timing)) *
        (params.get('order') === 'desc' ? -1 : 1),
    );
};
const conflict = (date: string, timing: string, id?: string) => {
  const next = parseTiming(timing);
  return db.slots.some((s) => {
    const existing = parseTiming(s.timing);
    return (
      s.id !== id &&
      s.date === date &&
      next.start < existing.end &&
      existing.start < next.end
    );
  });
};
export const handlers = [
  http.get(
    '*/api/merchant/self',
    protect(() => HttpResponse.json(db.merchant)),
  ),
  http.patch(
    '*/api/merchant/self',
    protect(async ({ request }) => {
      const patch = merchantInput
        .partial()
        .strict()
        .parse(await request.json());
      db.merchant = { ...db.merchant, ...patch };
      return HttpResponse.json(db.merchant);
    }),
  ),
  http.get(
    '*/api/merchant/settings',
    protect(() => HttpResponse.json(db.settings)),
  ),
  http.patch(
    '*/api/merchant/settings',
    protect(async ({ request }) => {
      db.settings = mergeSettings(
        db.settings,
        settingsPatch.strict().parse(await request.json()),
      );
      return HttpResponse.json(db.settings);
    }),
  ),
  http.get(
    '*/api/products',
    protect(() => HttpResponse.json({ products: db.products })),
  ),
  http.post(
    '*/api/products',
    protect(async ({ request }) => {
      const product = {
        ...productInput.strict().parse(await request.json()),
        id: crypto.randomUUID(),
      };
      db.products.push(product);
      return HttpResponse.json(product, { status: 201 });
    }),
  ),
  http.patch(
    '*/api/products/:id',
    protect(async ({ params, request }) => {
      const product = db.products.find((p) => p.id === params.id);
      if (!product) return error(404, 'not_found');
      Object.assign(
        product,
        productInput
          .partial()
          .strict()
          .parse(await request.json()),
      );
      return HttpResponse.json(product);
    }),
  ),
  http.delete(
    '*/api/products/:id',
    protect(({ params }) => {
      const index = db.products.findIndex((p) => p.id === params.id);
      if (index < 0) return error(404, 'not_found');
      db.products.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }),
  ),
  http.get(
    '*/api/slots',
    protect(({ request }) =>
      HttpResponse.json({ slots: filterSlots(request) }),
    ),
  ),
  http.get(
    '*/api/slots/merchant',
    protect(({ request }) =>
      HttpResponse.json({ slots: filterSlots(request, true) }),
    ),
  ),
  http.get(
    '*/api/slots/merchant/counters',
    protect(() =>
      HttpResponse.json({
        needConfirmation: db.slots.filter(
          (s) => s.status === 'need_confirmation',
        ).length,
      }),
    ),
  ),
  http.post(
    '*/api/slots',
    protect(async ({ request }) => {
      const input = slotInput.strict().parse(await request.json());
      if (isPastWindow(input.date, input.timing, db.settings.timezone))
        return error(400, 'validation_error');
      if (conflict(input.date, input.timing))
        return error(409, 'slot_conflict');
      const slot: Slot = {
        ...input,
        id: crypto.randomUUID(),
        status: 'free',
        customer: null,
        product: null,
      };
      db.slots.push(slot);
      return HttpResponse.json(slot, { status: 201 });
    }),
  ),
  http.patch(
    '*/api/slots/:id',
    protect(async ({ params, request }) => {
      const slot = db.slots.find((s) => s.id === params.id);
      if (!slot) return error(404, 'not_found');
      if (slot.status !== 'free') return error(409, 'slot_conflict');
      const input = {
        date: slot.date,
        timing: slot.timing,
        ...slotInput
          .partial()
          .strict()
          .parse(await request.json()),
      };
      if (isPastWindow(input.date, input.timing, db.settings.timezone))
        return error(400, 'validation_error');
      if (conflict(input.date, input.timing, slot.id))
        return error(409, 'slot_conflict');
      Object.assign(slot, input);
      return HttpResponse.json(slot);
    }),
  ),
  http.delete(
    '*/api/slots/:id',
    protect(({ params }) => {
      const index = db.slots.findIndex((s) => s.id === params.id);
      if (index < 0) return error(404, 'not_found');
      if (db.slots[index].status !== 'free') return error(409, 'slot_conflict');
      db.slots.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }),
  ),
  http.post(
    '*/api/slots/:id/confirm',
    protect(({ params }) => {
      const slot = db.slots.find((s) => s.id === params.id);
      if (!slot) return error(404, 'not_found');
      if (slot.status !== 'need_confirmation')
        return error(409, 'slot_conflict');
      const confirmed: Slot = { ...slot, status: 'confirmed' };
      db.slots[db.slots.indexOf(slot)] = confirmed;
      return HttpResponse.json(confirmed);
    }),
  ),
  http.post(
    '*/api/slots/:id/reject',
    protect(({ params }) => {
      const index = db.slots.findIndex((s) => s.id === params.id);
      if (index < 0) return error(404, 'not_found');
      const slot = db.slots[index];
      if (slot.status !== 'need_confirmation')
        return error(409, 'slot_conflict');
      db.slots[index] = {
        ...slot,
        status: 'free',
        customer: null,
        product: null,
      };
      return HttpResponse.json(db.slots[index]);
    }),
  ),
];
