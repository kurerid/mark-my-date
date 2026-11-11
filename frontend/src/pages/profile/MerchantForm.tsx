import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/shared/api/client';
import {
  merchantInput,
  merchantSchema,
  type Merchant,
} from '@/shared/api/schemas';
import { changedFields, mutationError } from '@/shared/api/mutationErrors';
import { fieldErrors } from '@/shared/lib/validation';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { notify } from '@/shared/ui/Toast';
export function MerchantForm({
  merchant,
  onClose,
}: {
  merchant: Merchant;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const initial = {
    title: merchant.title,
    address: merchant.address,
    description: merchant.description,
  };
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useMutation({
    mutationFn: (patch: Partial<typeof initial>) =>
      request('/api/merchant/self', merchantSchema, {
        method: 'PATCH',
        body: patch,
      }),
    onSuccess: (data) => {
      client.setQueryData(['merchant'], data);
      notify('Сохранено');
      onClose();
    },
    onError: (error) =>
      mutationError(error, {
        close: onClose,
        refresh: () => client.invalidateQueries({ queryKey: ['merchant'] }),
      }),
    onSettled: () => client.invalidateQueries({ queryKey: ['merchant'] }),
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    const result = merchantInput.safeParse(value);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    const patch = changedFields(initial, result.data);
    if (!Object.keys(patch).length) {
      onClose();
      return;
    }
    mutation.mutate(patch);
  }
  return (
    <BottomSheet title="Профиль студии" onClose={onClose}>
      <form className="form" noValidate onSubmit={submit}>
        {(
          [
            ['title', 'Название'],
            ['address', 'Адрес'],
            ['description', 'О студии'],
          ] as const
        ).map(([key, label]) => (
          <Field key={key} label={label} error={errors[key]}>
            {(props) =>
              key === 'description' ? (
                <textarea
                  {...props}
                  rows={4}
                  value={value[key]}
                  disabled={mutation.isPending}
                  onChange={(e) => {
                    setValue({ ...value, [key]: e.target.value });
                    setErrors({});
                  }}
                />
              ) : (
                <input
                  {...props}
                  value={value[key]}
                  disabled={mutation.isPending}
                  onChange={(e) => {
                    setValue({ ...value, [key]: e.target.value });
                    setErrors({});
                  }}
                />
              )
            }
          </Field>
        ))}
        <Button type="submit" disabled={mutation.isPending}>
          Сохранить
        </Button>
      </form>
    </BottomSheet>
  );
}
