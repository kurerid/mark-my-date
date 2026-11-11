import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { settingsQuery, slotsQuery } from '@/shared/api/queries';
import {
  capitalize,
  formatDay,
  shiftDate,
  today,
  weekDates,
} from '@/shared/lib/dates';
import { slotSummary } from '@/shared/lib/formatters';
import { WeekStrip } from '@/widgets/week-strip/WeekStrip';
import { SlotCard } from '@/entities/slot/SlotCard';
import { Button } from '@/shared/ui/Button';
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
  if (!settings.data) return <Loading />;
  return <Calendar timezone={settings.data.timezone} />;
}
function Calendar({ timezone }: { timezone: string }) {
  const [selected, setSelected] = useState(() => today(timezone));
  const dates = weekDates(selected);
  const query = useQuery(slotsQuery(dates[0], dates[6]));
  const slots = query.data?.slots ?? [];
  const daySlots = slots.filter((s) => s.date === selected);
  function move(amount: number) {
    const target = weekDates(shiftDate(selected, amount));
    setSelected(target.includes(today(timezone)) ? today(timezone) : target[0]);
  }
  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] text-text-muted">
            {capitalize(formatDay(selected, 'LLLL yyyy'))}
          </p>
          <h1>Расписание</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="w-11 rounded-[14px] p-0"
            aria-label="Предыдущая неделя"
            onClick={() => move(-7)}
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant="secondary"
            className="w-11 rounded-[14px] p-0"
            aria-label="Следующая неделя"
            onClick={() => move(7)}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </header>
      <WeekStrip
        dates={dates}
        selected={selected}
        slots={slots}
        onSelect={setSelected}
      />
      <div className="flex items-baseline justify-between gap-2">
        <h2>{capitalize(formatDay(selected, 'EEEE, d MMMM'))}</h2>
        <span className="shrink-0 text-[13px] text-text-muted">
          {slotSummary(
            daySlots.length,
            daySlots.filter((s) => s.status === 'need_confirmation').length,
          )}
        </span>
      </div>
      {query.error ? (
        <QueryError error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-2.5">
          {daySlots.length ? (
            daySlots.map((slot) => <SlotCard key={slot.id} slot={slot} />)
          ) : (
            <Empty>В этот день окон нет</Empty>
          )}
        </div>
      )}
    </>
  );
}
