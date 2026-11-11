import type { Slot } from '@/shared/api/schemas';
import { capitalize, formatDay, parseTiming } from '@/shared/lib/dates';
import { Avatar } from '@/shared/ui/Avatar';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
export function BookingRequestCard({
  slot,
  tone = 'warm',
  onConfirm,
  onReject,
  busy = false,
}: {
  slot: Extract<Slot, { status: 'need_confirmation' }>;
  tone?: 'warm' | 'blue';
  onConfirm?: () => void;
  onReject?: () => void;
  busy?: boolean;
}) {
  return (
    <article className="flex flex-col gap-3.5 rounded-card bg-surface p-4">
      <div className="flex items-center gap-3">
        <Avatar name={slot.customer.name} tone={tone} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{slot.customer.name}</div>
          {slot.customer.username && (
            <div className="mt-0.5 text-[13px] text-text-muted">
              @{slot.customer.username}
            </div>
          )}
        </div>
        <Badge variant="pending">Ждёт</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-button bg-surface-muted px-3 py-2.5">
        <div>
          <div className="text-[11px] text-text-muted">Дата и время</div>
          <div className="mt-0.5 text-[14px] font-semibold">
            {capitalize(formatDay(slot.date, 'EEE, d MMM'))} ·{' '}
            {parseTiming(slot.timing).start}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-text-muted">Услуга</div>
          <div className="mt-0.5 text-[14px] font-semibold">
            {slot.product.name}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          onClick={onReject}
          disabled={busy || !onReject}
        >
          Отклонить
        </Button>
        <Button onClick={onConfirm} disabled={busy || !onConfirm}>
          Подтвердить
        </Button>
      </div>
    </article>
  );
}
