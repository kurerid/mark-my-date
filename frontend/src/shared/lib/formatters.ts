export const statusLabel = {
  free: 'Свободно',
  need_confirmation: 'Ждёт подтверждения',
  confirmed: 'Занято',
} as const;
export function slotSummary(count: number, pending: number) {
  const rule = new Intl.PluralRules('ru').select(count);
  const word = rule === 'one' ? 'окно' : rule === 'few' ? 'окна' : 'окон';
  return `${count} ${word}${pending ? ` · ${pending} ждёт` : ''}`;
}

export const formatPrice = (price: number | null) =>
  price === null ? '—' : `${new Intl.NumberFormat('ru-RU').format(price)} ₽`;
export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60),
    m = minutes % 60;
  return [h ? `${h} ч` : '', m ? `${m} мин` : ''].filter(Boolean).join(' ');
}
