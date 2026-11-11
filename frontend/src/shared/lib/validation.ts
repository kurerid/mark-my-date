import type { ZodError } from 'zod';
export function fieldErrors(error: ZodError) {
  return Object.fromEntries(
    error.issues.map((issue) => [
      String(issue.path[0]),
      ['Заполните поле', 'Слишком длинно', 'Недопустимое значение'].includes(
        issue.message,
      )
        ? issue.message
        : 'Недопустимое значение',
    ]),
  );
}
