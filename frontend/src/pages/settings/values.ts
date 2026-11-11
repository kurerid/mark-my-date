export const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const horizonLabel = (days: number) =>
  days === 7 ? 'на 1 неделю' : days === 14 ? 'на 2 недели' : `на ${days} дней`;
export const hoursBeforeLabel = (hours: number) =>
  `За ${hours} ${hours === 1 ? 'час' : 'часа'}`;
export function workDaysLabel(days: number[]) {
  const sorted = [...days].sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const day of sorted) {
    const last = groups.at(-1);
    if (last && last.at(-1) === day - 1) last.push(day);
    else groups.push([day]);
  }
  return groups
    .map((g) =>
      g.length === 1
        ? weekdays[g[0] - 1]
        : `${weekdays[g[0] - 1]}–${weekdays[g[g.length - 1] - 1]}`,
    )
    .join(', ');
}
export const editorTitles = {
  workDays: 'Рабочие дни',
  workHours: 'Часы работы',
  breakMinutes: 'Перерыв между окнами',
  bookingHorizonDays: 'Открывать запись',
  deadlineHours: 'Срок на подтверждение',
  dayBefore: 'Время отправки',
  sameDay: 'За сколько',
};
export type EditorKind = keyof typeof editorTitles;
