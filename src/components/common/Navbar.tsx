import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { dbService, PASSENGER_SESSION_EVENT } from '../../services/dbService';

export const Navbar: React.FC = () => {
  const { path, navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const [, refresh] = useState(0);
  const links = [
    { label: 'Home', href: '/' }, { label: 'Flights', href: '/flights' },
    { label: 'Manage booking', href: '/manage-booking' }, { label: 'About', href: '/about' },
    { label: 'Staff', href: '/staff' }, { label: 'Admin', href: '/admin' }
  ];
  useEffect(() => {
    const update = () => refresh(value => value + 1);
    window.addEventListener(PASSENGER_SESSION_EVENT, update);
    return () => window.removeEventListener(PASSENGER_SESSION_EVENT, update);
  }, []);
  const go = (href: string) => { navigate(href); setOpen(false); };
  const account = dbService.getPassengerSession();
  const sessionControl = <button onClick={async () => { if (account) await dbService.logoutPassenger().catch(() => undefined); go(account ? '/' : '/account'); }} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">{account ? 'Sign out' : 'Passenger sign in'}</button>;

  return <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <button onClick={() => go('/')} className="flex shrink-0 items-center gap-2.5" aria-label="Aero home">
        <img src="/logo.png" alt="Aero Airline Management System" className="h-10 w-32 object-contain" />
      </button>
      <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
        {links.map(link => <button key={link.href} onClick={() => go(link.href)} className={path === link.href ? 'font-semibold text-sky-600' : 'hover:text-slate-900'}>{link.label}</button>)}
        {sessionControl}
      </nav>
      <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-slate-600 md:hidden" aria-label="Toggle navigation">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
    </div>
    {open && <nav className="space-y-1 border-t border-slate-100 px-4 py-3 md:hidden">{links.map(link => <button key={link.href} onClick={() => go(link.href)} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">{link.label}</button>)}<div className="px-3 pt-2">{sessionControl}</div></nav>}
  </header>;
};
