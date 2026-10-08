import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, Database, LogIn, LogOut, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { adminService, AdminTableName, AdminTables } from '../../services/adminService';
import { FlightManagement } from '../../components/flight/FlightManagement';
import { StaffManagement } from '../../components/admin/StaffManagement';
import { Airport } from '../../types/database';

const tableNames: AdminTableName[] = ['BOOKING', 'PASSENGER', 'FLIGHT', 'AIRPORT'];
const fallbackColumns: Record<AdminTableName, string[]> = {
  BOOKING: ['booking_id', 'passenger_id', 'flight_id', 'booking_date', 'seat_number', 'class', 'payment_status', 'booking_status'],
  PASSENGER: ['passenger_id', 'name', 'age', 'gender', 'contact_number', 'email', 'address'],
  FLIGHT: ['flight_id', 'flight_number', 'airline_name', 'departure_airport_id', 'arrival_airport_id', 'departure_time', 'arrival_time', 'flight_status'],
  AIRPORT: ['airport_id', 'airport_name', 'city', 'state', 'country', 'IATA_code']
};

function labelFor(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

export const AdminPage: React.FC = () => {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tables, setTables] = useState<AdminTables | null>(null);
  const [activeTable, setActiveTable] = useState<AdminTableName>('BOOKING');
  const [loginError, setLoginError] = useState('');
  const [dataError, setDataError] = useState('');
  const [busy, setBusy] = useState(false);

  const refreshTables = useCallback(async () => {
    try {
      const latest = await adminService.getTables();
      setTables(latest);
      setDataError('');
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Could not load the database tables.');
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    adminService.session()
      .then(session => {
        if (!mounted) return;
        setAdminName(session.username);
        setAuthenticated(true);
      })
      .catch(() => { if (mounted) setAuthenticated(false); })
      .finally(() => { if (mounted) setCheckingSession(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    void refreshTables();
    const interval = window.setInterval(() => { void refreshTables(); }, 15000);
    return () => window.clearInterval(interval);
  }, [authenticated, refreshTables]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setLoginError('');
    try {
      const session = await adminService.login(username.trim(), password);
      setAdminName(session.username);
      setPassword('');
      setAuthenticated(true);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await adminService.logout().catch(() => undefined);
    setAuthenticated(false);
    setTables(null);
    setAdminName('');
  };

  const rows = useMemo(() => (tables?.[activeTable] || []) as unknown as Array<Record<string, unknown>>, [tables, activeTable]);
  const columns = rows.length ? Object.keys(rows[0]) : fallbackColumns[activeTable];

  if (checkingSession) {
    return <main className="grid min-h-[70vh] place-items-center px-5 text-sm text-slate-500">Checking admin session…</main>;
  }

  if (!authenticated) {
    return <main className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-700"><ShieldCheck className="h-6 w-6" /></div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Aero administration</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with the administrator credentials configured in this project’s private `.env` file.</p>
        <form onSubmit={handleLogin} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">Username
            <input autoComplete="username" required value={username} onChange={event => setUsername(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">Password
            <input autoComplete="current-password" type="password" required value={password} onChange={event => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" />
          </label>
          {loginError && <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{loginError}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-wait disabled:opacity-60"><LogIn className="h-4 w-4" />{busy ? 'Signing in…' : 'Sign in to admin'}</button>
        </form>
      </div>
    </main>;
  }

  return <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Aero control room</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Admin dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Live records from the connected MySQL database. Refreshes automatically every 15 seconds.</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => void refreshTables()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-sky-300 hover:text-sky-700"><RefreshCw className="h-4 w-4" />Refresh</button>
        <button onClick={() => void handleLogout()} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"><LogOut className="h-4 w-4" />Sign out</button>
      </div>
    </div>

    <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><ShieldCheck className="h-4 w-4 shrink-0" />Signed in as <strong>{adminName}</strong><span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-700"><CalendarClock className="h-3.5 w-3.5" />Live database</span></div>

    {tables && <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tableNames.map(table => <button key={table} onClick={() => setActiveTable(table)} className={`rounded-2xl border p-5 text-left transition ${activeTable === table ? 'border-sky-300 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">{table}<Database className="h-4 w-4 text-sky-600" /></div>
        <div className="mt-3 text-3xl font-bold text-slate-950">{tables[table].length}</div>
        <div className="mt-1 text-xs text-slate-500">current records</div>
      </button>)}
    </section>}

    {tables && activeTable === 'FLIGHT' && <div className="mt-7"><FlightManagement role="admin" airports={tables.AIRPORT as Airport[]} /></div>}
    {tables && <StaffManagement />}

    <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div><h2 className="font-bold text-slate-900">{activeTable} table</h2><p className="mt-1 text-xs text-slate-500">{tables ? `${rows.length} records loaded from MySQL` : 'Loading live records…'}</p></div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"><Users className="h-3.5 w-3.5" />Admin only</div>
      </div>
      {dataError && <div role="alert" className="m-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{dataError}</div>}
      {!dataError && tables && rows.length === 0 && <div className="p-10 text-center text-sm text-slate-500">No records in this table yet.</div>}
      {tables && rows.length > 0 && <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50"><tr>{columns.map(column => <th key={column} className="whitespace-nowrap px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">{labelFor(column)}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={String(row.booking_id ?? row.passenger_id ?? row.flight_id ?? row.airport_id ?? index)} className="hover:bg-sky-50/40">{columns.map(column => <td key={column} className="max-w-xs px-5 py-3 text-slate-700"><span className="block truncate" title={String(row[column] ?? '')}>{row[column] == null || row[column] === '' ? '—' : String(row[column])}</span></td>)}</tr>)}</tbody>
        </table>
      </div>}
    </section>
  </main>;
};
