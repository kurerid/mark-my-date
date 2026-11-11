import { MoreHorizontal } from 'lucide-react';
import type { Slot } from '@/shared/api/schemas';
import { parseTiming } from '@/shared/lib/dates';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
export function SlotCard({
  slot,
  onMenu,
  onConfirm,
  onReject,
  busy = false,
}: {
  slot: Slot;
  onMenu?: () => void;
  onConfirm?: () => void;
  onReject?: () => void;
  busy?: boolean;
}) {
  const { start, end } = parseTiming(slot.timing);
  const pending = slot.status === 'need_confirmation';
  return (
    <article
      className={`flex flex-col gap-3 rounded-card bg-surface p-3.5 ${pending ? 'shadow-[inset_0_0_0_1.5px_#F2B66B]' : ''}`}
    >
      <div
        className={`flex gap-3.5 ${slot.status === 'free' ? 'items-center' : ''}`}
      >
        <div className="flex w-[52px] shrink-0 flex-col gap-0.5">
          <span className="text-[16px] font-bold">{start}</span>
          <span className="text-[12px] text-text-muted">{end}</span>
        </div>
        <div
          className={`flex min-w-0 flex-1 flex-col gap-1 ${pending ? 'pl-[15px]' : slot.status === 'confirmed' ? 'border-l-[3px] border-accent pl-3' : 'border-l-[3px] border-dashed border-free pl-3'}`}
        >
          {slot.status === 'free' ? (
            <>
              <span className="font-semibold text-text-subtle">Свободно</span>
              <span className="text-[13px] text-text-muted">
                Открыто для записи
              </span>
            </>
          ) : (
            <>
              <Badge variant={pending ? 'pending' : 'booked'}>
                {pending ? 'Ждёт подтверждения' : 'Занято'}
              </Badge>
              <span className="font-semibold">{slot.customer.name}</span>
              <span className="text-[13px] text-text-muted">
                {slot.product.name}
                {pending && slot.customer.username
                  ? ` · @${slot.customer.username}`
                  : ''}
              </span>
            </>
          )}
        </div>
        {slot.status === 'free' && (
          <Button
            variant="ghost-icon"
            aria-label={`Действия с окном ${start}`}
            onClick={onMenu}
            disabled={!onMenu || busy}
          >
            <MoreHorizontal size={20} />
          </Button>
        )}
      </div>
      {pending && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={onReject}
            disabled={!onReject || busy}
          >
            Отклонить
          </Button>
          <Button onClick={onConfirm} disabled={!onConfirm || busy}>
            Подтвердить
          </Button>
        </div>
      )}
    </article>
  );
}
