import { changedSettings } from '@/shared/api/mergeSettings';
import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { openTelegramLink } from '@tma.js/sdk';
import { ChevronRight } from 'lucide-react';
import { settingsQuery } from '@/shared/api/queries';
import type { Settings, SettingsPatch } from '@/shared/api/schemas';
import { ListRow } from '@/shared/ui/ListRow';
import { Switch } from '@/shared/ui/Switch';
import { Loading, QueryError } from '@/shared/ui/QueryState';
import { notify } from '@/shared/ui/Toast';
import { SettingEditor } from './SettingEditor';
import { useSettingsMutation } from './useSettingsMutation';
import {
  workDaysLabel,
  horizonLabel,
  hoursBeforeLabel,
  type EditorKind,
} from './values';
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="px-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-text-muted">
        {title}
      </h2>
      <div className="overflow-hidden rounded-card bg-surface">{children}</div>
    </section>
  );
}
function ValueRow({
  label,
  value,
  hint,
  onClick,
  disabled,
}: {
  label: string;
  value: string;
  hint?: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      className="flex min-h-[52px] w-full items-center gap-3 border-divider py-2 pr-3 pl-4 text-left not-first:border-t"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {hint && (
          <span className="block text-[12px] text-text-muted">{hint}</span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-[14px] text-text-muted">
        {value}
        <ChevronRight size={16} className="text-chevron" aria-hidden="true" />
      </span>
    </button>
  );
}
export function Page() {
  const query = useQuery(settingsQuery);
  if (query.error)
    return (
      <QueryError error={query.error} retry={() => void query.refetch()} />
    );
  if (!query.data) return <Loading heights={[40, 232, 140, 232, 80, 132]} />;
  return <SettingsPage settings={query.data} />;
}
function SettingsPage({ settings: s }: { settings: Settings }) {
  const [editor, setEditor] = useState<EditorKind | null>(null);
  const mutation = useSettingsMutation();
  const busy = mutation.isPending;
  const value = (
    kind: EditorKind,
    label: string,
    text: string,
    hint?: string,
  ) => (
    <ValueRow
      label={label}
      value={text}
      hint={hint}
      onClick={() => setEditor(kind)}
      disabled={busy}
    />
  );
  const toggle = (
    label: string,
    checked: boolean,
    patch: (checked: boolean) => SettingsPatch,
    hint?: string,
  ) => (
    <ListRow label={label} hint={hint}>
      <Switch
        label={label}
        checked={checked}
        disabled={busy}
        onChange={(checked) => mutation.mutate(patch(checked))}
      />
    </ListRow>
  );
  return (
    <>
      <header>
        <h1>Настройки</h1>
      </header>
      <Group title="Расписание">
        {value('workDays', 'Рабочие дни', workDaysLabel(s.schedule.workDays))}
        {value(
          'workHours',
          'Часы работы',
          `${s.schedule.workHours.from}–${s.schedule.workHours.to}`,
        )}
        {value(
          'breakMinutes',
          'Перерыв между окнами',
          `${s.schedule.breakMinutes} мин`,
        )}
        {value(
          'bookingHorizonDays',
          'Открывать запись',
          horizonLabel(s.schedule.bookingHorizonDays),
        )}
      </Group>
      <Group title="Подтверждение записи">
        {toggle(
          'Автоподтверждение',
          s.slotConfirmation.autoConfirm,
          (autoConfirm) => ({ slotConfirmation: { autoConfirm } }),
          'Окно сразу станет «Занято»',
        )}
        {value(
          'deadlineHours',
          'Срок на подтверждение',
          `${s.slotConfirmation.deadlineHours} ч`,
          'Потом заявка отменится',
        )}
      </Group>
      <Group title="Напоминания клиенту">
        {toggle(
          'Запись подтверждена',
          s.customerNotification.onConfirm,
          (onConfirm) => ({ customerNotification: { onConfirm } }),
          'Сообщение от бота сразу',
        )}
        {toggle(
          'За день до записи',
          s.customerNotification.dayBefore.enabled,
          (enabled) => ({ customerNotification: { dayBefore: { enabled } } }),
          `В ${s.customerNotification.dayBefore.time}`,
        )}
        {s.customerNotification.dayBefore.enabled &&
          value(
            'dayBefore',
            'Время отправки',
            s.customerNotification.dayBefore.time,
          )}
        {toggle(
          'В день записи',
          s.customerNotification.sameDay.enabled,
          (enabled) => ({ customerNotification: { sameDay: { enabled } } }),
          hoursBeforeLabel(s.customerNotification.sameDay.hoursBefore),
        )}
        {s.customerNotification.sameDay.enabled &&
          value(
            'sameDay',
            'За сколько',
            hoursBeforeLabel(s.customerNotification.sameDay.hoursBefore),
          )}
      </Group>
      <Group title="Уведомления мне">
        {toggle(
          'Новая заявка',
          s.personalNotification.newBooking,
          (newBooking) => ({ personalNotification: { newBooking } }),
        )}
      </Group>
      <Group title="Аккаунт">
        <ListRow label="Язык">
          <span className="text-[14px] text-text-muted">Русский</span>
        </ListRow>
        {import.meta.env.VITE_SUPPORT_URL && (
          <ValueRow
            label="Поддержка"
            value=""
            disabled={false}
            onClick={() => {
              try {
                openTelegramLink(import.meta.env.VITE_SUPPORT_URL);
              } catch {
                notify('Что-то пошло не так. Попробуйте ещё раз');
              }
            }}
          />
        )}
      </Group>
      {editor && (
        <SettingEditor
          key={editor}
          kind={editor}
          settings={s}
          busy={busy}
          onClose={() => setEditor(null)}
          onSave={(patch) =>
            Object.keys(changedSettings(s, patch)).length
              ? mutation.mutate(changedSettings(s, patch), {
                  onSuccess: () => setEditor(null),
                })
              : setEditor(null)
          }
        />
      )}
    </>
  );
}
