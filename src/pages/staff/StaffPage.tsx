import React, { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { staffService } from '../../services/staffService';
import { dbService } from '../../services/dbService';
import { FlightManagement } from '../../components/flight/FlightManagement';

export const StaffPage: React.FC = () => {
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    staffService.session().then(result => { if (mounted) { setUsername(result.username); setAuthenticated(true); } }).catch(() => undefined).finally(() => { if (mounted) setChecking(false); });
    return () => { mounted = false; };
  }, []);

  const signIn = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { const session = await staffService.login(loginName.trim(), password); setUsername(session.username); setPassword(''); setAuthenticated(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not sign in.'); }
    finally { setBusy(false); }
  };

  if (checking) return <main className="grid min-h-[70vh] place-items-center text-sm text-slate-500">Checking staff session…</main>;
  if (!authenticated) return <main className="flex min-h-[75vh] items-center justify-center px-4 py-12"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
    <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-700"><ShieldCheck /></div><p className="text-xs font-bold uppercase tracking-[.18em] text-sky-700">Aero operations</p><h1 className="mt-2 text-2xl font-bold">Staff sign in</h1><p className="mt-2 text-sm leading-6 text-slate-500">Use the separate staff credentials configured in the backend environment.</p>
    <form onSubmit={signIn} className="mt-7 space-y-4"><label className="block text-sm font-semibold text-slate-700">Username<input required autoComplete="username" value={loginName} onChange={e => setLoginName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal" /></label><label className="block text-sm font-semibold text-slate-700">Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal" /></label>{error && <p role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"><LogIn className="h-4 w-4" />{busy ? 'Signing in…' : 'Sign in to operations'}</button></form>
  </section></main>;

  return <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-sky-700">Aero operations</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Flight operations</h1><p className="mt-2 text-sm text-slate-500">Add and remove flights, and update operational status. Flight times use India Standard Time.</p></div><button onClick={async () => { await staffService.logout().catch(() => undefined); setAuthenticated(false); setUsername(''); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><LogOut className="h-4 w-4" />Sign out</button></header>
    <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"><ShieldCheck className="h-4 w-4" />Signed in as <b>{username}</b><span className="ml-auto">Staff access</span></div>
    <FlightManagement role="staff" airports={dbService.getAirports()} />
    <p className="text-xs leading-5 text-slate-500">Staff can manage flights and statuses, but cannot create or manage staff accounts. Deleting a flight with bookings is blocked to preserve booking history.</p>
  </main>;
};
