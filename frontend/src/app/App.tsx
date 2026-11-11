import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Page as Calendar } from '@/pages/calendar/Page';
import { Page as Bookings } from '@/pages/bookings/Page';
import { Page as Profile } from '@/pages/profile/Page';
import { Page as Settings } from '@/pages/settings/Page';
import { queryClient } from './queryClient';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <main className="p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
