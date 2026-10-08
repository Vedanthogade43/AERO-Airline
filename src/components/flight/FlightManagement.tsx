import React, { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, Plane, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Airport } from '../../types/database';
import { FlightStatus, StaffFlight } from '../../services/staffService';
import { FlightDraft, OperationsRole, operationsService } from '../../services/operationsService';

const transitions: Record<FlightStatus, FlightStatus[]> = {
  Scheduled: ['Scheduled', 'Delayed', 'Boarding', 'Cancelled'], Delayed: ['Delayed', 'Boarding', 'Cancelled'],
  Boarding: ['Boarding', 'Departed', 'Cancelled'], Departed: ['Departed', 'Arrived'], Arrived: ['Arrived'], Cancelled: ['Cancelled']
};
const formatTime = (value: string) => new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}+05:30`).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const blankFlight = (airports: Airport[]): FlightDraft => ({
  flight_number: '', airline_name: '', departure_airport_id: airports[0]?.airport_id || 0,
  arrival_airport_id: airports[1]?.airport_id || airports[0]?.airport_id || 0,
  departure_time: '', arrival_time: ''
});

export const FlightManagement: React.FC<{ role: OperationsRole; airports: Airport[] }> = ({ role, airports }) => {
  const [flights, setFlights] = useState<StaffFlight[]>([]);
  const [draft, setDraft] = useState<FlightDraft>(() => blankFlight(airports));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    setLoading(true);
    try { setFlights(await operationsService.flights(role)); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load flights.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, [role]);
  useEffect(() => { setDraft(current => ({ ...current, departure_airport_id: current.departure_airport_id || airports[0]?.airport_id || 0, arrival_airport_id: current.arrival_airport_id || airports[1]?.airport_id || 0 })); }, [airports]);

  const change = <K extends keyof FlightDraft>(key: K, value: FlightDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  const add = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      await operationsService.addFlight(role, draft);
      setDraft(blankFlight(airports)); setNotice('Flight added to the schedule.'); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add this flight.'); }
    finally { setBusy(false); }
  };
  const remove = async (flight: StaffFlight) => {
    if (!window.confirm(`Remove ${flight.flight_number} from the schedule? Flights with booking history cannot be deleted.`)) return;
    setBusy(true); setError(''); setNotice('');
    try { await operationsService.removeFlight(role, flight.flight_id); setNotice(`${flight.flight_number} removed.`); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not remove this flight.'); }
    finally { setBusy(false); }
  };
  const setStatus = async (flight: StaffFlight, status: FlightStatus) => {
    setBusy(true); setError('');
    try { await operationsService.updateStatus(flight.flight_id, status); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update status.'); }
    finally { setBusy(false); }
  };

  const fieldClass = 'mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100';
  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-950">Flight schedule</h2><p className="mt-1 text-sm text-slate-500">Add flights and manage the published schedule. Times use India Standard Time.</p></div><button type="button" onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw className="h-4 w-4" />Refresh</button></header>
    {error && <p role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <form onSubmit={add} className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs font-semibold text-slate-700">Flight number<input required maxLength={10} value={draft.flight_number} onChange={e => change('flight_number', e.target.value)} placeholder="6E123" className={fieldClass} /></label>
      <label className="text-xs font-semibold text-slate-700">Airline<input required maxLength={50} value={draft.airline_name} onChange={e => change('airline_name', e.target.value)} placeholder="IndiGo" className={fieldClass} /></label>
      <label className="text-xs font-semibold text-slate-700">From<select required value={draft.departure_airport_id} onChange={e => change('departure_airport_id', Number(e.target.value))} className={fieldClass}>{airports.map(a => <option key={a.airport_id} value={a.airport_id}>{a.city} ({a.IATA_code})</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-700">To<select required value={draft.arrival_airport_id} onChange={e => change('arrival_airport_id', Number(e.target.value))} className={fieldClass}>{airports.map(a => <option key={a.airport_id} value={a.airport_id}>{a.city} ({a.IATA_code})</option>)}</select></label>
      <label className="text-xs font-semibold text-slate-700">Departure time (IST)<input required type="datetime-local" value={draft.departure_time} onChange={e => change('departure_time', e.target.value)} className={fieldClass} /></label>
      <label className="text-xs font-semibold text-slate-700">Arrival time (IST)<input required type="datetime-local" value={draft.arrival_time} onChange={e => change('arrival_time', e.target.value)} className={fieldClass} /></label>
      <div className="flex items-end lg:col-span-2"><button disabled={busy || airports.length < 2} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" />{busy ? 'Saving…' : 'Add flight'}</button></div>
    </form>
    <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Flight</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Departure (IST)</th><th className="px-4 py-3">Arrival (IST)</th><th className="px-4 py-3">Seats</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{flights.map(f => <tr key={f.flight_id}><td className="whitespace-nowrap px-4 py-3 font-bold"><span className="inline-flex items-center gap-2"><Plane className="h-4 w-4 text-sky-600" />{f.flight_number}</span><span className="mt-1 block pl-6 text-xs font-normal text-slate-500">{f.airline_name}</span></td><td className="whitespace-nowrap px-4 py-3">{f.departure_city} <b>{f.departure_code}</b> → {f.arrival_city} <b>{f.arrival_code}</b></td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatTime(f.departure_time)}</td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatTime(f.arrival_time)}</td><td className="px-4 py-3">{f.occupied_seats} / 132</td><td className="px-4 py-3">{role === 'staff' ? <select disabled={busy} aria-label={`Status for ${f.flight_number}`} value={f.flight_status} onChange={e => void setStatus(f, e.target.value as FlightStatus)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold">{transitions[f.flight_status].map(s => <option key={s}>{s}</option>)}</select> : <span className="whitespace-nowrap">{f.flight_status}</span>}</td><td className="px-4 py-3"><button type="button" disabled={busy} onClick={() => void remove(f)} aria-label={`Remove ${f.flight_number}`} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table>{!loading && flights.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No flights are scheduled yet.</p>}{loading && <p className="p-5 text-center text-sm text-slate-500">Loading flights…</p>}</div>
    <p className="text-xs leading-5 text-slate-500">Deleting a flight with bookings is blocked to preserve booking records. Mark it Cancelled instead.</p>
  </section>;
};
