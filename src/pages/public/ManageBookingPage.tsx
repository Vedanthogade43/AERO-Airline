import React, { useState } from 'react';
import { dbService } from '../../services/dbService';
import { EnrichedBooking } from '../../types/database';
import { TicketCard } from '../../components/booking/TicketCard';
import { useToast } from '../../context/ToastContext';
import { Search, AlertCircle, Ticket } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';

export const ManageBookingPage: React.FC = () => {
  const { toast } = useToast();
  const { navigate } = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [booking, setBooking] = useState<EnrichedBooking | null>(null);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);

  const lookup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d+$/.test(bookingId.trim())) {
      toast('Check your details', 'error', 'Enter a valid booking number.');
      return;
    }
    setBusy(true);
    try {
      const result = await dbService.findBookingByVerification(Number(bookingId));
      setBooking(result);
      setSearched(true);
      if (!result) toast('Booking not found', 'warning', 'Those details did not match a booking.');
    } catch (error) {
      toast('Could not retrieve booking', 'error', error instanceof Error ? error.message : 'Please try again.');
    } finally { setBusy(false); }
  };

  const cancel = async () => {
    if (!booking || !confirm(`Cancel booking #${booking.booking_id}? The cancellation will be recorded and its seat released.`)) return;
    setBusy(true);
    try {
      await dbService.cancelBooking(booking.booking_id);
      setBooking(null);
      toast('Booking cancelled', 'success', 'The cancellation has been recorded and the seat released.');
    } catch (error) {
      toast('Could not cancel booking', 'error', error instanceof Error ? error.message : 'Please try again.');
    } finally { setBusy(false); }
  };

  return <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-xl space-y-2 text-center">
      <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky-600"><Ticket className="h-6 w-6" /></div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Manage your booking</h1>
      <p className="text-sm leading-relaxed text-slate-500">Sign in to securely view or cancel bookings attached to your passenger account.</p>
    </div>
    {!dbService.getPassengerSession() ? <div className="mx-auto max-w-xl rounded-2xl border border-sky-200 bg-sky-50 p-6 text-center"><p className="text-sm text-sky-950">You need to sign in before managing bookings.</p><button onClick={() => navigate('/account')} className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Passenger sign in</button></div> : <>
    <form onSubmit={lookup} className="mx-auto max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div><label className="mb-1 block text-sm font-semibold text-slate-700">Booking number</label><input required inputMode="numeric" value={bookingId} onChange={e => setBookingId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none" placeholder="Your booking number" /></div>
      <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"><Search className="h-4 w-4" />{busy ? 'Please wait…' : 'Find booking'}</button>
    </form>
    {searched && <div className="space-y-6">{booking ? <><TicketCard booking={booking} /><div className="mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"><div><h2 className="font-semibold">Cancel this booking?</h2><p className="mt-1 text-sm text-slate-500">Cancellation is recorded and the seat becomes available again.</p></div><button disabled={busy} onClick={cancel} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60">Cancel booking</button></div></> : <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center"><AlertCircle className="mx-auto h-8 w-8 text-amber-500" /><h2 className="mt-3 font-bold">No active booking found</h2><p className="mt-2 text-sm text-slate-500">Check the booking number and ensure it belongs to your signed-in account.</p></div>}</div>}
    </>}
  </div>;
};
