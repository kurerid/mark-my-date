// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { popup } from '@tma.js/sdk';
import { initializeTelegram } from '@/shared/lib/telegram';
it('инициализирует dev SDK и возвращает выбранное действие из popup с тремя кнопками', async () => {
  const prompt = vi.spyOn(window, 'prompt').mockReturnValue('Изменить время');
  expect(await initializeTelegram()).toBe(true);
  const result = await popup.show({
    message: 'Действия с окном 16:00',
    buttons: [
      { id: 'edit', text: 'Изменить время' },
      { id: 'delete', type: 'destructive', text: 'Удалить' },
      { id: 'cancel', text: 'Отмена' },
    ],
    timeout: 1000,
  });
  expect(result).toBe('edit');
  expect(prompt).toHaveBeenCalledOnce();
  prompt.mockRestore();
});
