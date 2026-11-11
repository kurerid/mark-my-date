import {
  CalendarDays,
  ClipboardList,
  UserRound,
  SlidersHorizontal,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router';
import { countersQuery } from '@/shared/api/queries';
const tabs = [
  { path: '/calendar', label: 'Календарь', icon: CalendarDays },
  { path: '/bookings', label: 'Записи', icon: ClipboardList },
  { path: '/profile', label: 'Профиль', icon: UserRound },
  { path: '/settings', label: 'Настройки', icon: SlidersHorizontal },
];
export function TabBar() {
  const { data } = useQuery(countersQuery);
  return (
    <nav aria-label="Основная навигация" className="tab-bar">
      {tabs.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex min-h-11 flex-col items-center justify-center gap-[3px] no-underline text-[11px] ${isActive ? 'text-accent font-semibold' : 'text-text-muted font-medium'}`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`relative flex h-[30px] w-14 items-center justify-center rounded-full ${isActive ? 'bg-accent-soft' : ''}`}
              >
                <Icon size={22} strokeWidth={2} aria-hidden="true" />
                {path === '/bookings' && Boolean(data?.needConfirmation) && (
                  <span
                    className="absolute top-0 right-[10px] flex h-4 min-w-4 items-center justify-center rounded-full bg-counter px-1 text-[10px] font-bold text-white"
                    aria-label={`Ожидают · ${data?.needConfirmation}`}
                  >
                    {data?.needConfirmation}
                  </span>
                )}
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
