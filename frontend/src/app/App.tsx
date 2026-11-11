import { lazy } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Layout } from './Layout';
import { queryClient } from './queryClient';

const Calendar = lazy(() =>
  import('@/pages/calendar/Page').then((module) => ({ default: module.Page })),
);
const Bookings = lazy(() =>
  import('@/pages/bookings/Page').then((module) => ({ default: module.Page })),
);
const Profile = lazy(() =>
  import('@/pages/profile/Page').then((module) => ({ default: module.Page })),
);
const Settings = lazy(() =>
  import('@/pages/settings/Page').then((module) => ({ default: module.Page })),
);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
