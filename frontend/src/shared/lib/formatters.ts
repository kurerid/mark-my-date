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
