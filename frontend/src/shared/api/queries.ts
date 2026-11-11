import { queryOptions } from '@tanstack/react-query';
import { request } from './client';
import {
  countersSchema,
  merchantSchema,
  productsResponse,
  settingsSchema,
  slotsResponse,
} from './schemas';
export const keys = {
  slots: (from: string, to: string) => ['slots', from, to] as const,
  merchantSlots: (status: string, params: Record<string, string> = {}) =>
    ['merchantSlots', status, params] as const,
  counters: ['counters'] as const,
  merchant: ['merchant'] as const,
  settings: ['settings'] as const,
  products: ['products'] as const,
};
export const settingsQuery = queryOptions({
  queryKey: keys.settings,
  queryFn: ({ signal }) =>
    request('/api/merchant/settings', settingsSchema, { signal }),
});
export const merchantQuery = queryOptions({
  queryKey: keys.merchant,
  queryFn: ({ signal }) =>
    request('/api/merchant/self', merchantSchema, { signal }),
});
export const productsQuery = queryOptions({
  queryKey: keys.products,
  queryFn: ({ signal }) =>
    request('/api/products', productsResponse, { signal }),
});
export const countersQuery = queryOptions({
  queryKey: keys.counters,
  queryFn: ({ signal }) =>
    request('/api/slots/merchant/counters', countersSchema, { signal }),
  refetchInterval: 60000,
});
export const slotsQuery = (from: string, to: string) =>
  queryOptions({
    queryKey: keys.slots(from, to),
    queryFn: ({ signal }) =>
      request(
        `/api/slots?${new URLSearchParams({ periodFrom: from, periodTo: to })}`,
        slotsResponse,
        { signal },
      ),
  });
export const merchantSlotsQuery = (
  status: string,
  params: Record<string, string> = {},
) =>
  queryOptions({
    queryKey: keys.merchantSlots(status, params),
    queryFn: ({ signal }) =>
      request(
        `/api/slots/merchant?${new URLSearchParams({ status, ...params })}`,
        slotsResponse,
        { signal },
      ),
    refetchInterval: status === 'need_confirmation' ? 60000 : false,
  });
