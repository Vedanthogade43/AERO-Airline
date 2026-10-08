import React, { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, UserPlus, UserRoundX } from 'lucide-react';
import { adminService, StaffAccount } from '../../services/adminService';

const empty = { username: '', full_name: '', email: '', phone: '', password: '' };
const inputClass = 'mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100';

export const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    try { setStaff(await adminService.getStaff()); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load staff accounts.'); }
  };
  useEffect(() => { void refresh(); }, []);
  const add = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { await adminService.addStaff(form); setForm(empty); setNotice('Staff account created.'); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create staff account.'); }
    finally { setBusy(false); }
  };
  const remove = async (item: StaffAccount) => {
    if (!window.confirm(`Remove staff account “${item.username}”? They will lose access immediately.`)) return;
    setBusy(true); setError(''); setNotice('');
    try { await adminService.removeStaff(item.staff_id); setNotice(`${item.username} removed.`); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not remove staff account.'); }
    finally { setBusy(false); }
  };
  return <section className="mt-7 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <header><h2 className="text-lg font-bold text-slate-950">Staff accounts</h2><p className="mt-1 text-sm text-slate-500">Only administrators can create or remove staff sign-in accounts.</p></header>
    {error && <p role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <form onSubmit={add} className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-xs font-semibold text-slate-700">Full name<input required maxLength={80} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={inputClass} /></label>
      <label className="text-xs font-semibold text-slate-700">Username<input required minLength={3} maxLength={40} pattern="[A-Za-z0-9._-]+" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className={inputClass} /></label>
      <label className="text-xs font-semibold text-slate-700">Email<input required type="email" maxLength={120} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} /></label>
      <label className="text-xs font-semibold text-slate-700">Phone (optional)<input maxLength={20} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} /></label>
      <label className="text-xs font-semibold text-slate-700">Temporary password<input required type="password" minLength={10} maxLength={128} autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} /><span className="mt-1 block font-normal text-slate-500">At least 10 characters</span></label>
      <div className="flex items-end"><button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><UserPlus className="h-4 w-4" />Create staff account</button></div>
    </form>
    <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Username</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{staff.map(item => <tr key={item.staff_id}><td className="px-4 py-3 font-semibold">{item.full_name}</td><td className="px-4 py-3">{item.username}</td><td className="px-4 py-3">{item.email}</td><td className="px-4 py-3">{item.phone || '—'}</td><td className="px-4 py-3"><button type="button" disabled={busy} onClick={() => void remove(item)} aria-label={`Remove ${item.username}`} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"><UserRoundX className="h-4 w-4" /></button></td></tr>)}</tbody></table>{staff.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No staff accounts have been added yet.</p>}</div>
  </section>;
};
