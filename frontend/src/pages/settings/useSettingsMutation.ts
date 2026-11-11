import { useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/shared/api/client';
import {
  settingsSchema,
  type Settings,
  type SettingsPatch,
} from '@/shared/api/schemas';
import { mergeSettings } from '@/shared/api/mergeSettings';
import { mutationError } from '@/shared/api/mutationErrors';
import { notify } from '@/shared/ui/Toast';
export function useSettingsMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationKey: ['settingsUpdate'],
    scope: { id: 'settings' },
    mutationFn: (patch: SettingsPatch) =>
      request('/api/merchant/settings', settingsSchema, {
        method: 'PATCH',
        body: patch,
      }),
    onMutate: async (patch) => {
      await client.cancelQueries({ queryKey: ['settings'] });
      const before = client.getQueryData<Settings>(['settings']);
      if (before)
        client.setQueryData(['settings'], mergeSettings(before, patch));
      return before;
    },
    onError: (error, _patch, before) => {
      if (before) client.setQueryData(['settings'], before);
      mutationError(error, {
        refresh: () => client.invalidateQueries({ queryKey: ['settings'] }),
      });
    },
    onSuccess: (data) => {
      client.setQueryData(['settings'], data);
      notify('Сохранено');
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['settings'] }),
  });
}
