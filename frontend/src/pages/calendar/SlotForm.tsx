import { useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { request, ApiError } from '@/shared/api/client';
import { slotInput, slotSchema, type Slot } from '@/shared/api/schemas';
import {
  changedFields,
  invalidateSlots,
  mutationError,
} from '@/shared/api/mutationErrors';
import { isPastWindow, parseTiming, today } from '@/shared/lib/dates';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { notify } from '@/shared/ui/Toast';
export function SlotForm({
  slot,
  date,
  timezone,
  onClose,
}: {
  slot?: Slot;
  date: string;
  timezone: string;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const submitting = useRef(false);
  const initial = { date: slot?.date ?? date, timing: slot?.timing ?? '' };
  const times = slot ? parseTiming(slot.timing) : { start: '', end: '' };
  const [value, setValue] = useState({ date: initial.date, ...times });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useMutation({
    mutationFn: (input: { date: string; timing: string }) =>
      request(slot ? `/api/slots/${slot.id}` : '/api/slots', slotSchema, {
        method: slot ? 'PATCH' : 'POST',
        body: slot ? changedFields(initial, input) : input,
      }),
    onSuccess: () => {
      notify(slot ? 'Окно изменено' : 'Окно добавлено');
      onClose();
    },
    onError: (error) =>
      mutationError(error, {
        close: onClose,
        refresh: () => invalidateSlots(client),
        form: true,
      }),
    onSettled: () => {
      submitting.current = false;
      return invalidateSlots(client);
    },
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current || mutation.isPending) return;
    const input = { date: value.date, timing: `${value.start}-${value.end}` };
    const parsed = slotInput.safeParse(input);
    const next: Record<string, string> = {};
    if (!value.date) next.date = 'Заполните поле';
    else if (
      !parsed.success &&
      parsed.error.issues.some((i) => i.path[0] === 'date')
    )
      next.date = 'Недопустимое значение';
    if (!value.start) next.start = 'Заполните поле';
    if (!value.end) next.end = 'Заполните поле';
    if (!parsed.success && !next.start && !next.end)
      next.timing = 'Недопустимое значение';
    if (parsed.success && isPastWindow(input.date, input.timing, timezone))
      next.timing = 'Нельзя создать окно в прошлом';
    setErrors(next);
    if (Object.keys(next).length) return;
    if (slot && !Object.keys(changedFields(initial, input)).length) {
      onClose();
      return;
    }
    submitting.current = true;
    mutation.mutate(input);
  }
  const errorFor = (key: string) => errors[key];
  return (
    <BottomSheet
      title={slot ? 'Изменить окно' : 'Новое окно'}
      onClose={onClose}
    >
      <form className="form" onSubmit={submit} noValidate>
        {(
          [
            ['date', 'Дата', 'date'],
            ['start', 'Начало', 'time'],
            ['end', 'Конец', 'time'],
          ] as const
        ).map(([key, label, type]) => (
          <label className="field" key={key}>
            {label}
            <input
              disabled={mutation.isPending}
              type={type}
              step={type === 'time' ? 900 : undefined}
              min={type === 'date' ? today(timezone) : undefined}
              value={value[key]}
              onChange={(e) => {
                if (submitting.current || mutation.isPending) return;
                setValue({ ...value, [key]: e.target.value });
                setErrors({});
                mutation.reset();
              }}
              aria-invalid={Boolean(errorFor(key))}
              aria-describedby={errorFor(key) ? `${key}-error` : undefined}
            />
            {errorFor(key) && (
              <span id={`${key}-error`} className="field-error">
                {errorFor(key)}
              </span>
            )}
          </label>
        ))}
        {errors.timing && (
          <p className="field-error" role="alert">
            {errors.timing}
          </p>
        )}
        {mutation.error instanceof ApiError &&
          mutation.error.status === 409 && (
            <p className="field-error" role="alert">
              Время пересекается с другим окном
            </p>
          )}
        <Button type="submit" disabled={mutation.isPending}>
          Сохранить
        </Button>
      </form>
    </BottomSheet>
  );
}
