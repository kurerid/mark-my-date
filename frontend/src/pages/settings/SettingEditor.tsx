import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import type { Settings, SettingsPatch } from '@/shared/api/schemas';
import { mergeSettings } from '@/shared/api/mergeSettings';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import {
  editorTitles,
  weekdays,
  horizonLabel,
  hoursBeforeLabel,
  type EditorKind,
} from './values';
export function SettingEditor({
  kind,
  settings,
  onClose,
  onSave,
  busy,
}: {
  kind: EditorKind;
  settings: Settings;
  onClose: () => void;
  onSave: (patch: SettingsPatch) => void;
  busy: boolean;
}) {
  const [days, setDays] = useState(settings.schedule.workDays);
  const [hours, setHours] = useState(settings.schedule.workHours);
  const [error, setError] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    const patch: SettingsPatch =
      kind === 'workDays'
        ? { schedule: { workDays: days } }
        : { schedule: { workHours: hours } };
    try {
      mergeSettings(settings, patch);
      setError('');
      onSave(patch);
    } catch {
      setError('Недопустимое значение');
    }
  }
  let options: {
    value: number | string;
    label: string;
    patch: SettingsPatch;
  }[] = [];
  let selected: number | string = '';
  switch (kind) {
    case 'breakMinutes':
      selected = settings.schedule.breakMinutes;
      options = ([0, 5, 10, 15, 20, 30, 45, 60] as const).map((value) => ({
        value,
        label: `${value} мин`,
        patch: { schedule: { breakMinutes: value } },
      }));
      break;
    case 'bookingHorizonDays':
      selected = settings.schedule.bookingHorizonDays;
      options = ([7, 14, 30, 60] as const).map((value) => ({
        value,
        label: horizonLabel(value),
        patch: { schedule: { bookingHorizonDays: value } },
      }));
      break;
    case 'deadlineHours':
      selected = settings.slotConfirmation.deadlineHours;
      options = ([1, 2, 4, 12, 24, 48] as const).map((value) => ({
        value,
        label: `${value} ч`,
        patch: { slotConfirmation: { deadlineHours: value } },
      }));
      break;
    case 'dayBefore':
      selected = settings.customerNotification.dayBefore.time;
      options = Array.from({ length: 15 }, (_, i) => {
        const value = `${String(i + 8).padStart(2, '0')}:00`;
        return {
          value,
          label: value,
          patch: { customerNotification: { dayBefore: { time: value } } },
        };
      });
      break;
    case 'sameDay':
      selected = settings.customerNotification.sameDay.hoursBefore;
      options = ([1, 2, 3, 4] as const).map((value) => ({
        value,
        label: hoursBeforeLabel(value),
        patch: { customerNotification: { sameDay: { hoursBefore: value } } },
      }));
      break;
  }
  return (
    <BottomSheet title={editorTitles[kind]} onClose={onClose}>
      {kind === 'workDays' || kind === 'workHours' ? (
        <form onSubmit={submit} noValidate className="form">
          {kind === 'workDays' ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(44px,1fr))] gap-1">
              {weekdays.map((label, i) => (
                <button
                  type="button"
                  key={label}
                  aria-pressed={days.includes(i + 1)}
                  disabled={busy}
                  className={`min-h-11 rounded-button text-[13px] ${days.includes(i + 1) ? 'bg-accent text-white' : 'bg-surface-muted text-text'}`}
                  onClick={() => {
                    setDays(
                      days.includes(i + 1)
                        ? days.filter((d) => d !== i + 1)
                        : [...days, i + 1],
                    );
                    setError('');
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <>
              {(
                [
                  ['from', 'С'],
                  ['to', 'До'],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label} error={error || undefined}>
                  {(props) => (
                    <input
                      {...props}
                      type="time"
                      step="1800"
                      value={hours[key]}
                      disabled={busy}
                      onChange={(e) => {
                        setHours({ ...hours, [key]: e.target.value });
                        setError('');
                      }}
                    />
                  )}
                </Field>
              ))}
            </>
          )}
          {kind === 'workDays' && error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            Сохранить
          </Button>
        </form>
      ) : (
        <div role="group" aria-label={editorTitles[kind]}>
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              disabled={busy}
              className="flex min-h-[52px] w-full items-center justify-between border-divider px-4 text-left not-first:border-t"
              onClick={() => onSave(option.patch)}
              aria-pressed={selected === option.value}
            >
              {option.label}
              {selected === option.value && (
                <Check className="text-accent" size={20} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}
