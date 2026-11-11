import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { popup, hapticFeedback } from '@tma.js/sdk';
import { request } from '@/shared/api/client';
import { slotSchema, type Slot } from '@/shared/api/schemas';
import { invalidateSlots, mutationError } from '@/shared/api/mutationErrors';
import { capitalize, formatDay, parseTiming } from '@/shared/lib/dates';
import { notify } from '@/shared/ui/Toast';
const mutationKey = ['bookingAction'];
export function useBookingActions() {
  const client = useQueryClient();
  const busy = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation({
    mutationKey,
    mutationFn: ({
      slot,
      action,
    }: {
      slot: Slot;
      action: 'confirm' | 'reject';
    }) =>
      request(`/api/slots/${slot.id}/${action}`, slotSchema, {
        method: 'POST',
      }),
    onMutate: async ({ slot, action }) => {
      await Promise.all(
        ['slots', 'merchantSlots', 'counters'].map((key) =>
          client.cancelQueries({ queryKey: [key] }),
        ),
      );
      const snapshots = client.getQueriesData<{ slots: Slot[] }>({
        predicate: (q) =>
          q.queryKey[0] === 'slots' || q.queryKey[0] === 'merchantSlots',
      });
      const counters = client.getQueryData<{ needConfirmation: number }>([
        'counters',
      ]);
      const next: Slot =
        action === 'confirm' && slot.status === 'need_confirmation'
          ? { ...slot, status: 'confirmed' }
          : { ...slot, status: 'free', customer: null, product: null };
      for (const [key, data] of snapshots)
        if (data)
          client.setQueryData(key, {
            slots:
              key[0] === 'merchantSlots'
                ? data.slots.filter((s) => s.id !== slot.id)
                : data.slots.map((s) => (s.id === slot.id ? next : s)),
          });
      if (counters)
        client.setQueryData(['counters'], {
          needConfirmation: Math.max(0, counters.needConfirmation - 1),
        });
      return { snapshots, counters };
    },
    onError: (error, _variables, context) => {
      for (const [key, data] of context?.snapshots ?? [])
        client.setQueryData(key, data);
      if (context?.counters)
        client.setQueryData(['counters'], context.counters);
      mutationError(error, { refresh: () => invalidateSlots(client) });
    },
    onSuccess: (_data, { action }) => {
      notify(action === 'confirm' ? 'Запись подтверждена' : 'Запись отклонена');
      if (hapticFeedback.notificationOccurred.isSupported())
        hapticFeedback.notificationOccurred('success');
    },
    onSettled: () => invalidateSlots(client),
  });
  async function reject(slot: Slot) {
    if (slot.status !== 'need_confirmation' || busy) return;
    try {
      const { start, end } = parseTiming(slot.timing);
      const answer = await popup.show({
        title: 'Отклонить запись?',
        message: `${slot.customer.name}, ${capitalize(formatDay(slot.date, 'EEE, d MMM'))} · ${start}–${end}. Окно снова станет свободным.`,
        buttons: [
          { id: 'reject', type: 'destructive', text: 'Отклонить' },
          { id: 'cancel', text: 'Отмена' },
        ],
      });
      if (answer === 'reject') mutation.mutate({ slot, action: 'reject' });
    } catch (error) {
      mutationError(error, { refresh: () => invalidateSlots(client) });
    }
  }
  return {
    busy,
    confirm: (slot: Slot) => {
      if (!busy && slot.status === 'need_confirmation')
        mutation.mutate({ slot, action: 'confirm' });
    },
    reject,
  };
}
