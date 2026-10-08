import React, { FormEvent, useState } from 'react';
import { ArrowRight, UserRound } from 'lucide-react';
import { dbService } from '../../services/dbService';
import { useRouter } from '../../context/RouterContext';
import { useToast } from '../../context/ToastContext';

export const AccountPage: React.FC = () => {
  const { navigate } = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState<{ name: string; age: number; gender: 'Male' | 'Female' | 'Other'; contact_number: string; address: string }>({ name: '', age: 18, gender: 'Other', contact_number: '', address: '' });

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'register') await dbService.registerPassenger({ ...profile, email }, password);
      else await dbService.loginPassenger(email, password);
      toast(mode === 'register' ? 'Account created' : 'Signed in', 'success', 'Your passenger account is ready.');
      navigate('/flights');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not complete sign-in.'); }
    finally { setBusy(false); }
  };

  const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100';
  return <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky-700"><UserRound /></div>
      <p className="text-xs font-bold uppercase tracking-[.18em] text-sky-700">Passenger account</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to book flights and manage your bookings securely.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {mode === 'register' && <>
          <label className="block text-sm font-semibold text-slate-700">Full name<input required minLength={2} maxLength={80} className={inputClass} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-slate-700">Age<input required type="number" min={1} max={120} className={inputClass} value={profile.age} onChange={e => setProfile({ ...profile, age: Number(e.target.value) })} /></label>
            <label className="block text-sm font-semibold text-slate-700">Gender<select className={inputClass} value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value as 'Male' | 'Female' | 'Other' })}><option>Other</option><option>Female</option><option>Male</option></select></label>
          </div>
          <label className="block text-sm font-semibold text-slate-700">Phone<input required maxLength={15} className={inputClass} value={profile.contact_number} onChange={e => setProfile({ ...profile, contact_number: e.target.value })} /></label>
          <label className="block text-sm font-semibold text-slate-700">Address<input required maxLength={150} className={inputClass} value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} /></label>
        </>}
        <label className="block text-sm font-semibold text-slate-700">Email<input required type="email" autoComplete="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="block text-sm font-semibold text-slate-700">Password<input required type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 10 : undefined} maxLength={128} className={inputClass} value={password} onChange={e => setPassword(e.target.value)} /><span className="mt-1 block text-xs font-normal text-slate-500">{mode === 'register' ? 'Use at least 10 characters.' : ''}</span></label>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight className="h-4 w-4" /></button>
      </form>
      <button className="mt-5 w-full text-center text-sm font-semibold text-sky-700 hover:underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
        {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
    </section>
  </main>;
};
