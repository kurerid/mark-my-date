import { useState } from 'react';
import type { Product } from '@/shared/api/schemas';
import { MerchantForm } from './MerchantForm';
import { ProductForm } from './ProductForm';
import { useQuery } from '@tanstack/react-query';
import { shareURL } from '@tma.js/sdk';
import { MapPin, ChevronRight, Copy, Share } from 'lucide-react';
import { merchantQuery, productsQuery } from '@/shared/api/queries';
import { formatDuration, formatPrice } from '@/shared/lib/formatters';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Empty, Loading, QueryError } from '@/shared/ui/QueryState';
import { notify } from '@/shared/ui/Toast';
export function Page() {
  const [sheet, setSheet] = useState<
    { kind: 'merchant' } | { kind: 'product'; product?: Product } | null
  >(null);
  const merchant = useQuery(merchantQuery);
  const products = useQuery(productsQuery);
  if (merchant.error)
    return (
      <QueryError
        error={merchant.error}
        retry={() => void merchant.refetch()}
      />
    );
  if (!merchant.data) return <Loading heights={[40, 200, 200, 250]} />;
  const data = merchant.data;
  return (
    <>
      <header className="flex items-center justify-between">
        <h1>Профиль</h1>
        <Button
          variant="secondary"
          className="relative min-h-10 before:absolute before:-inset-y-0.5 before:inset-x-0"
          onClick={() => setSheet({ kind: 'merchant' })}
        >
          Изменить
        </Button>
      </header>
      <section className="flex flex-col items-center gap-2.5 rounded-section bg-surface p-5 text-center">
        <Avatar name={data.title} business />
        <h2 className="text-[20px]">{data.title}</h2>
        {data.address && (
          <div className="flex items-center gap-1.5 text-[13px] text-text-muted">
            <MapPin size={16} aria-hidden="true" />
            {data.address}
          </div>
        )}
      </section>
      <section className="flex flex-col gap-3 rounded-section bg-accent-soft p-4">
        <div>
          <h2 className="text-[15px]">Ссылка для записи</h2>
          <p className="mt-1 text-[13px] text-text-subtle">
            Отправьте клиентам — они увидят свободные окна и запишутся прямо в
            Telegram.
          </p>
        </div>
        <div className="break-all rounded-button bg-surface p-3 text-[14px] font-medium">
          {data.publicLink}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            className="border-transparent"
            onClick={() =>
              void navigator.clipboard
                .writeText(data.publicLink)
                .then(() => notify('Ссылка скопирована'))
                .catch(() => notify('Что-то пошло не так. Попробуйте ещё раз'))
            }
          >
            <Copy size={18} />
            Копировать
          </Button>
          <Button
            onClick={() => {
              try {
                shareURL(data.publicLink);
              } catch {
                notify('Что-то пошло не так. Попробуйте ещё раз');
              }
            }}
          >
            <Share size={18} />
            Поделиться
          </Button>
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h2>Услуги</h2>
          <button
            type="button"
            onClick={() => setSheet({ kind: 'product' })}
            className="min-h-11 text-[14px] font-semibold text-accent"
          >
            + Добавить
          </button>
        </div>
        {products.error ? (
          <QueryError
            error={products.error}
            retry={() => void products.refetch()}
          />
        ) : !products.data ? (
          <Loading heights={[68, 68, 68]} />
        ) : products.data.products.length ? (
          <div className="overflow-hidden rounded-card bg-surface">
            {products.data.products.map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => setSheet({ kind: 'product', product })}
                className="flex min-h-11 w-full items-center gap-2.5 border-divider px-4 py-3 text-left not-first:border-t"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-semibold">{product.name}</span>
                  <span className="text-[13px] text-text-muted">
                    {formatDuration(product.durationMinutes)}
                  </span>
                </span>
                <span className="text-[14px] font-semibold">
                  {formatPrice(product.price)}
                </span>
                <ChevronRight size={18} className="shrink-0 text-chevron" />
              </button>
            ))}
          </div>
        ) : (
          <Empty>Добавьте первую услугу</Empty>
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="px-1">О студии</h2>
        <div
          role={!data.description ? 'button' : undefined}
          tabIndex={!data.description ? 0 : undefined}
          onClick={() => {
            if (!data.description) setSheet({ kind: 'merchant' });
          }}
          onKeyDown={(e) => {
            if (!data.description && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setSheet({ kind: 'merchant' });
            }
          }}
          className={`whitespace-pre-wrap rounded-card bg-surface px-4 py-3.5 text-[14px] leading-[1.5] ${data.description ? 'text-text-subtle' : 'text-text-muted'}`}
        >
          {data.description || 'Расскажите клиентам о себе'}
        </div>
      </section>
      {sheet?.kind === 'merchant' && (
        <MerchantForm merchant={data} onClose={() => setSheet(null)} />
      )}
      {sheet?.kind === 'product' && (
        <ProductForm product={sheet.product} onClose={() => setSheet(null)} />
      )}
    </>
  );
}
