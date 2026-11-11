// @vitest-environment jsdom
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { setupServer } from 'msw/node';
import { delay, http, HttpResponse } from 'msw';
import { handlers } from '@/mocks/handlers';
import { createFixtures, resetFixtures } from '@/mocks/fixtures';
const telegram = vi.hoisted(() => ({
  popup: vi.fn(),
  haptic: Object.assign(vi.fn(), { isSupported: () => true }),
}));
vi.mock('@tma.js/sdk', () => ({
  initData: { raw: () => 'development-only' },
  popup: { show: telegram.popup },
  hapticFeedback: { notificationOccurred: telegram.haptic },
}));
import { useBookingActions } from './useBookingActions';
const server = setupServer(...handlers);
let mswFetch: typeof fetch;
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
  mswFetch = globalThis.fetch;
});
beforeEach(() => {
  resetFixtures();
  telegram.popup.mockReset();
  telegram.haptic.mockClear();
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    mswFetch(new URL(input, 'http://localhost'), init),
  );
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.unstubAllGlobals();
});
afterAll(() => server.close());
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const fixtures = createFixtures();
  client.setQueryData(['slots', 'week'], { slots: fixtures.slots });
  client.setQueryData(['merchantSlots', 'need_confirmation', {}], {
    slots: fixtures.slots.filter((s) => s.status === 'need_confirmation'),
  });
  client.setQueryData(['counters'], { needConfirmation: 2 });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(useBookingActions, { wrapper });
  return { client, slot: fixtures.slots[1], ...hook };
}
it('сразу обновляет календарь, список и счётчик, затем откатывает их при 500', async () => {
  server.use(
    http.post('*/api/slots/:id/confirm', async () => {
      await delay(120);
      return HttpResponse.json(
        { error: { code: '', message: 'private' } },
        { status: 500 },
      );
    }),
  );
  const { result, client, slot } = setup();
  act(() => result.current.confirm(slot));
  await waitFor(() =>
    expect(client.getQueryData(['counters'])).toEqual({ needConfirmation: 1 }),
  );
  expect(
    client.getQueryData(['merchantSlots', 'need_confirmation', {}]),
  ).toMatchObject({ slots: [{ id: '6' }] });
  await waitFor(() => expect(result.current.busy).toBe(false));
  expect(client.getQueryData(['counters'])).toEqual({ needConfirmation: 2 });
  expect(client.getQueryData(['slots', 'week'])).toMatchObject({
    slots: expect.arrayContaining([
      expect.objectContaining({ id: '2', status: 'need_confirmation' }),
    ]),
  });
  expect(telegram.haptic).not.toHaveBeenCalled();
  client.clear();
});
it('подтверждает без popup и даёт haptic после успешного запроса', async () => {
  const { result, client, slot } = setup();
  act(() => result.current.confirm(slot));
  await waitFor(() => expect(telegram.haptic).toHaveBeenCalledWith('success'));
  expect(telegram.popup).not.toHaveBeenCalled();
  expect(client.getQueryData(['slots', 'week'])).toMatchObject({
    slots: expect.arrayContaining([
      expect.objectContaining({ id: '2', status: 'confirmed' }),
    ]),
  });
  client.clear();
});
it('отмена popup не меняет запись, отклонение отправляется без reason и тела', async () => {
  const spy = vi.fn();
  server.use(
    http.post('*/api/slots/:id/reject', async ({ request }) => {
      spy(await request.text(), request.headers.get('Authorization'));
      const slot = createFixtures().slots[1];
      return HttpResponse.json({
        ...slot,
        status: 'free',
        customer: null,
        product: null,
      });
    }),
  );
  const { result, client, slot } = setup();
  telegram.popup.mockResolvedValueOnce('cancel');
  await act(async () => result.current.reject(slot));
  expect(spy).not.toHaveBeenCalled();
  expect(client.getQueryData(['counters'])).toEqual({ needConfirmation: 2 });
  telegram.popup.mockResolvedValueOnce('reject');
  await act(async () => result.current.reject(slot));
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith('', 'tma development-only'),
  );
  await waitFor(() => expect(result.current.busy).toBe(false));
  expect(client.getQueryData(['slots', 'week'])).toMatchObject({
    slots: expect.arrayContaining([
      expect.objectContaining({
        id: '2',
        status: 'free',
        customer: null,
        product: null,
      }),
    ]),
  });
  client.clear();
});
