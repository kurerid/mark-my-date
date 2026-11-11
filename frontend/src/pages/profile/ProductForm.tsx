import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { popup } from '@tma.js/sdk';
import { z } from 'zod';
import { request } from '@/shared/api/client';
import {
  productInput,
  productSchema,
  type Product,
} from '@/shared/api/schemas';
import { changedFields, mutationError } from '@/shared/api/mutationErrors';
import { fieldErrors } from '@/shared/lib/validation';
import { formatDuration } from '@/shared/lib/formatters';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { notify } from '@/shared/ui/Toast';
export function ProductForm({
  product,
  onClose,
}: {
  product?: Product;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const initial = product
    ? {
        name: product.name,
        durationMinutes: product.durationMinutes,
        price: product.price,
      }
    : { name: '', durationMinutes: 15, price: null };
  const [value, setValue] = useState({
    ...initial,
    price: initial.price === null ? '' : String(initial.price),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const refresh = () => client.invalidateQueries({ queryKey: ['products'] });
  const handleError = (error: unknown) =>
    mutationError(error, { close: onClose, refresh });
  const save = useMutation({
    mutationFn: (input: z.infer<typeof productInput>) =>
      request(
        product ? `/api/products/${product.id}` : '/api/products',
        productSchema,
        {
          method: product ? 'PATCH' : 'POST',
          body: product ? changedFields(initial, input) : input,
        },
      ),
    onSuccess: () => {
      notify('Сохранено');
      onClose();
    },
    onError: handleError,
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: () =>
      request(`/api/products/${product?.id}`, z.undefined(), {
        method: 'DELETE',
      }),
    onSuccess: () => {
      notify('Сохранено');
      onClose();
    },
    onError: handleError,
    onSettled: refresh,
  });
  const busy = save.isPending || remove.isPending;
  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = productInput.safeParse({
      ...value,
      price: value.price.trim() === '' ? null : Number(value.price),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    if (product && !Object.keys(changedFields(initial, parsed.data)).length) {
      onClose();
      return;
    }
    save.mutate(parsed.data);
  }
  async function deletion() {
    try {
      const answer = await popup.show({
        title: 'Удалить услугу?',
        message: 'Существующие записи сохранятся.',
        buttons: [
          { id: 'delete', type: 'destructive', text: 'Удалить' },
          { id: 'cancel', text: 'Отмена' },
        ],
      });
      if (answer === 'delete') remove.mutate();
    } catch (error) {
      handleError(error);
    }
  }
  return (
    <BottomSheet
      title={product ? 'Изменить услугу' : 'Новая услуга'}
      onClose={onClose}
    >
      <form className="form" noValidate onSubmit={submit}>
        <Field label="Название" error={errors.name}>
          {(props) => (
            <input
              {...props}
              value={value.name}
              disabled={busy}
              onChange={(e) => {
                setValue({ ...value, name: e.target.value });
                setErrors({});
              }}
            />
          )}
        </Field>
        <Field label="Длительность" error={errors.durationMinutes}>
          {(props) => (
            <select
              {...props}
              value={value.durationMinutes}
              disabled={busy}
              onChange={(e) =>
                setValue({ ...value, durationMinutes: Number(e.target.value) })
              }
            >
              {Array.from({ length: 32 }, (_, i) => (i + 1) * 15).map(
                (minutes) => (
                  <option value={minutes} key={minutes}>
                    {formatDuration(minutes)}
                  </option>
                ),
              )}
            </select>
          )}
        </Field>
        <Field label="Цена, ₽" error={errors.price}>
          {(props) => (
            <input
              {...props}
              type="number"
              step="1"
              min="0"
              max="1000000"
              placeholder="Не указана"
              value={value.price}
              disabled={busy}
              onChange={(e) => {
                setValue({ ...value, price: e.target.value });
                setErrors({});
              }}
            />
          )}
        </Field>
        <Button type="submit" disabled={busy}>
          Сохранить
        </Button>
        {product && (
          <button
            type="button"
            className="min-h-11 text-error font-semibold"
            disabled={busy}
            onClick={() => void deletion()}
          >
            Удалить услугу
          </button>
        )}
      </form>
    </BottomSheet>
  );
}
