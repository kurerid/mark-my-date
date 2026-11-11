import { useBookingActions } from '@/entities/booking/useBookingActions';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import type { Settings } from '@/shared/api/schemas';
import {
  countersQuery,
  merchantSlotsQuery,
  settingsQuery,
} from '@/shared/api/queries';
import { today, shiftDate } from '@/shared/lib/dates';
import { BookingRequestCard } from '@/entities/booking/BookingRequestCard';
import { BookingRow } from '@/entities/booking/BookingRow';
import { SegmentedControl } from '@/shared/ui/SegmentedControl';
import { Empty, Loading, QueryError } from '@/shared/ui/QueryState';
export function Page() {
  const settings = useQuery(settingsQuery);
  if (settings.error)
    return (
      <QueryError
        error={settings.error}
        retry={() => void settings.refetch()}
      />
    );
  if (!settings.data) return <Loading heights={[60, 48, 234, 234]} />;
  return <Bookings settings={settings.data} />;
}
function Bookings({ settings }: { settings: Settings }) {
  const actions = useBookingActions();
  const [params, setParams] = useSearchParams();
  const candidate = params.get('tab');
  const tab =
    candidate === 'confirmed' || candidate === 'past' ? candidate : 'pending';
  const day = today(settings.timezone);
  const query = useQuery(
    merchantSlotsQuery(
      tab === 'pending' ? 'need_confirmation' : 'confirmed',
      tab === 'pending'
        ? {}
        : tab === 'confirmed'
          ? { periodFrom: day }
          : { periodTo: shiftDate(day, -1), order: 'desc' },
    ),
  );
  const counters = useQuery(countersQuery);
  return (
    <>
      <header>
        <p className="text-[13px] text-text-muted">Заявки клиентов</p>
        <h1>Записи</h1>
      </header>
      <SegmentedControl
        label="Фильтр записей"
        value={tab}
        onChange={(value) => setParams({ tab: value })}
        options={[
          {
            value: 'pending',
            label: `Ожидают · ${counters.data?.needConfirmation ?? 0}`,
          },
          { value: 'confirmed', label: 'Подтверждены' },
          { value: 'past', label: 'Прошедшие' },
        ]}
      />
      {tab === 'pending' && (
        <p className="text-[13px] text-text-muted">
          {settings.customerNotification.onConfirm
            ? 'Клиент получит уведомление в Telegram сразу после подтверждения.'
            : 'Уведомление о подтверждении выключено в настройках.'}
        </p>
      )}
      {query.error ? (
        <QueryError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Loading heights={tab === 'pending' ? [234, 234] : [80, 80, 80]} />
      ) : query.data.slots.length ? (
        <div className="flex flex-col gap-2.5">
          {query.data.slots.map((slot, index) =>
            slot.status === 'need_confirmation' ? (
              <BookingRequestCard
                key={slot.id}
                slot={slot}
                tone={index % 2 ? 'blue' : 'warm'}
                onConfirm={() => actions.confirm(slot)}
                onReject={() => void actions.reject(slot)}
                busy={actions.busy}
              />
            ) : slot.status === 'confirmed' ? (
              <BookingRow
                key={slot.id}
                slot={slot}
                settings={settings}
                past={tab === 'past'}
              />
            ) : null,
          )}
        </div>
      ) : (
        <Empty>
          {tab === 'pending'
            ? 'Новых заявок нет'
            : tab === 'confirmed'
              ? 'Предстоящих записей нет'
              : 'Прошедших записей пока нет'}
        </Empty>
      )}
    </>
  );
}
