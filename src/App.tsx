import React, { useEffect, useState } from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/public/HomePage';
import { FlightsPage } from './pages/public/FlightsPage';
import { FlightDetailPage } from './pages/public/FlightDetailPage';
import { ManageBookingPage } from './pages/public/ManageBookingPage';
import { AboutPage } from './pages/public/AboutPage';
import { AdminPage } from './pages/admin/AdminPage';
import { AccountPage } from './pages/public/AccountPage';
import { StaffPage } from './pages/staff/StaffPage';
import { DB_CHANGE_EVENT, dbService } from './services/dbService';

const AppRoutes: React.FC = () => {
  const { path } = useRouter();
  const renderRoute = () => {
    if (path === '/' || path === '') return <HomePage />;
    if (path === '/flights') return <FlightsPage />;
    if (path.startsWith('/flights/')) return <FlightDetailPage />;
    if (path === '/manage-booking') return <ManageBookingPage />;
    if (path === '/account') return <AccountPage />;
    if (path === '/about') return <AboutPage />;
    if (path === '/admin') return <AdminPage />;
    if (path === '/staff') return <StaffPage />;
    return <HomePage />;
  };

  return <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 font-sans selection:bg-sky-500 selection:text-white">
    <Navbar />
    <main className="flex-1">{renderRoute()}</main>
    <Footer />
  </div>;
};

const AppContent: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [, refreshDatabaseView] = useState(0);

  useEffect(() => {
    dbService.initialize().then(() => setReady(true)).catch((cause: Error) => setError(cause.message));
  }, []);
  useEffect(() => {
    const refresh = () => refreshDatabaseView(value => value + 1);
    window.addEventListener(DB_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(DB_CHANGE_EVENT, refresh);
  }, []);

  if (error) return <div className="min-h-screen grid place-items-center p-6"><div className="max-w-lg rounded-2xl border border-rose-200 bg-white p-7 text-center shadow-sm"><h1 className="text-xl font-bold">Could not connect to the project database</h1><p className="mt-3 text-sm text-slate-600">{error}</p><p className="mt-3 text-sm text-slate-600">Check that Aiven is running, your backend environment file is configured, and the API server is open.</p></div></div>;
  if (!ready) return <div className="min-h-screen grid place-items-center text-sm text-slate-500">Connecting to flight information…</div>;

  return <ToastProvider><RouterProvider><AppRoutes /></RouterProvider></ToastProvider>;
};

export default function App() { return <AppContent />; }
