// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { SlotCard } from '@/entities/slot/SlotCard';
import { BookingRequestCard } from '@/entities/booking/BookingRequestCard';
import { TabBar } from '@/widgets/tab-bar/TabBar';
import { createFixtures } from '@/mocks/fixtures';
import { Switch } from './Switch';
import { QueryError } from './QueryState';
import { ApiError } from '@/shared/api/client';
afterEach(cleanup);
const slots = createFixtures().slots;
describe('SlotCard', () => {
  it('показывает свободное окно и его меню без данных клиента', async () => {
    const menu = vi.fn();
    render(<SlotCard slot={slots[2]} onMenu={menu} />);
    expect(screen.getByText('Свободно')).toBeVisible();
    expect(screen.getByText('Открыто для записи')).toBeVisible();
    expect(screen.queryByText('Подтвердить')).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Действия с окном 14:00' }),
    );
    expect(menu).toHaveBeenCalledOnce();
  });
  it('показывает клиента и услугу подтверждённого окна', () => {
    render(<SlotCard slot={slots[0]} />);
    expect(screen.getByText('Занято')).toBeVisible();
    expect(screen.getByText('Анна Ковалёва')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('позволяет подтвердить и отклонить ожидающую запись, блокирует повторную отправку', async () => {
    const confirm = vi.fn(),
      reject = vi.fn();
    const view = render(
      <SlotCard slot={slots[1]} onConfirm={confirm} onReject={reject} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));
    await userEvent.click(screen.getByRole('button', { name: 'Отклонить' }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(reject).toHaveBeenCalledOnce();
    view.rerender(
      <SlotCard slot={slots[1]} onConfirm={confirm} onReject={reject} busy />,
    );
    expect(screen.getByRole('button', { name: 'Подтвердить' })).toBeDisabled();
  });
});
describe('BookingRequestCard', () => {
  it('показывает дату, услугу и инициалы, username nullable', async () => {
    const slot = slots[1];
    if (slot.status !== 'need_confirmation') throw new Error('fixture');
    const reject = vi.fn();
    render(
      <BookingRequestCard
        slot={{ ...slot, customer: { ...slot.customer, username: null } }}
        onReject={reject}
      />,
    );
    expect(screen.getByText('МС')).toBeInTheDocument();
    expect(screen.getByText('Наращивание')).toBeVisible();
    expect(screen.queryByText('@maria_s')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Отклонить' }));
    expect(reject).toHaveBeenCalledOnce();
  });
});
describe('TabBar', () => {
  it('отмечает активный маршрут, показывает счётчик и переключает вкладку', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    client.setQueryData(['counters'], { needConfirmation: 2 });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/calendar']}>
          <TabBar />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByRole('link', { name: 'Календарь' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByLabelText('Ожидают · 2')).toHaveTextContent('2');
    await userEvent.click(screen.getByRole('link', { name: 'Профиль' }));
    expect(screen.getByRole('link', { name: 'Профиль' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getAllByRole('link')).toHaveLength(4);
    client.clear();
  });
  it('скрывает нулевой бейдж', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    });
    client.setQueryData(['counters'], { needConfirmation: 0 });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <TabBar />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.queryByLabelText('Ожидают · 0')).not.toBeInTheDocument();
    client.clear();
  });
});
it('Switch имеет доступное состояние и меняет его по нажатию', async () => {
  const change = vi.fn();
  render(<Switch label="Новая заявка" checked={false} onChange={change} />);
  const control = screen.getByRole('switch', { name: 'Новая заявка' });
  expect(control).toHaveAttribute('aria-checked', 'false');
  await userEvent.click(control);
  expect(change).toHaveBeenCalledWith(true);
});
it('ошибка загрузки позволяет повторить запрос, 401 даёт инструкцию Telegram', async () => {
  const retry = vi.fn();
  const view = render(<QueryError error={new Error()} retry={retry} />);
  await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
  expect(retry).toHaveBeenCalledOnce();
  view.rerender(
    <QueryError
      error={new ApiError(401, 'unauthorized', 'secret-server-error')}
      retry={retry}
    />,
  );
  expect(screen.getByText('Откройте приложение из Telegram')).toBeVisible();
  expect(screen.queryByText('secret-server-error')).not.toBeInTheDocument();
});
