import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { EnrichedBooking, EnrichedFlight } from '../../types/database';
import { dbService } from '../../services/dbService';
import { useToast } from '../../context/ToastContext';
import { useRouter } from '../../context/RouterContext';
import { Modal } from '../common/Modal';
import { SeatMap } from './SeatMap';
import { TicketCard } from './TicketCard';

interface BookingWizardModalProps { isOpen: boolean; onClose: () => void; flight: EnrichedFlight | null; initialClass?: 'Economy' | 'Business' }
type Step = 'passenger' | 'seat' | 'summary' | 'payment' | 'confirmation';
function firstAvailableSeat(cabin: 'Economy' | 'Business', occupied: string[]) {
  const firstRow = cabin === 'Business' ? 1 : 6;
  const lastRow = cabin === 'Business' ? 5 : 22;
  for (let row = firstRow; row <= lastRow; row++) {
    for (const letter of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const seat = `${String(row).padStart(2, '0')}${letter}`;
      if (!occupied.includes(seat)) return seat;
    }
  }
  return '';
}

export const BookingWizardModal: React.FC<BookingWizardModalProps> = ({ isOpen, onClose, flight, initialClass = 'Economy' }) => {
  const { toast } = useToast();
  const { navigate } = useRouter();
  const [step, setStep] = useState<Step>('passenger');
  const [selectedClass, setSelectedClass] = useState<'Economy' | 'Business'>(initialClass);
  const [selectedSeat, setSelectedSeat] = useState(initialClass === 'Business' ? '02A' : '12B');
  const [busy, setBusy] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<EnrichedBooking | null>(null);
  const passenger = dbService.getPassengerSession();
  useEffect(() => {
    setStep('passenger'); setSelectedClass(initialClass); setSelectedSeat(firstAvailableSeat(initialClass, dbService.getOccupiedSeatsForFlight(flight?.flight_id || 0))); setConfirmedBooking(null);
  }, [isOpen, flight?.flight_id, initialClass]);
  if (!flight) return null;
  const occupiedSeats = dbService.getOccupiedSeatsForFlight(flight.flight_id);
  const fare = selectedClass === 'Business' ? flight.demo_fare_estimate.business : flight.demo_fare_estimate.economy;
  const submitBooking = async () => {
    setBusy(true);
    try {
      const result = await dbService.createBooking({ flight_id: flight.flight_id, seat_number: selectedSeat, class: selectedClass });
      setConfirmedBooking({ ...result.booking, passenger: result.passenger, flight });
      setStep('confirmation');
      toast('Demo booking created', 'success', `Booking #${result.booking.booking_id} is confirmed with payment pending.`);
    } catch (error) { toast('Booking could not be saved', 'error', error instanceof Error ? error.message : 'Please retry.'); }
    finally { setBusy(false); }
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={step === 'confirmation' ? 'Booking Confirmation' : `Book Flight ${flight.flight_number}`} subtitle={`${flight.departure_airport?.city} (${flight.departure_airport?.IATA_code}) → ${flight.arrival_airport?.city} (${flight.arrival_airport?.IATA_code})`} maxWidth={step === 'confirmation' || step === 'seat' ? '2xl' : 'xl'}>
    {step !== 'confirmation' && <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4 text-xs font-semibold text-slate-500"><span className={step === 'passenger' ? 'text-sky-700' : ''}>1 Account</span><span>›</span><span className={step === 'seat' ? 'text-sky-700' : ''}>2 Seat</span><span>›</span><span className={step === 'summary' ? 'text-sky-700' : ''}>3 Review</span><span>›</span><span className={step === 'payment' ? 'text-sky-700' : ''}>4 Confirm</span></div>}
    {step === 'passenger' && <section className="space-y-4 py-2">
      {passenger ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="font-bold text-emerald-900">Booking as {passenger.name}</p><p className="mt-1 text-sm text-emerald-800">{passenger.email}</p><p className="mt-3 text-xs text-emerald-800">Your booking will be linked to this signed-in passenger account.</p></div> : <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="font-bold text-amber-950">Sign in to continue</p><p className="mt-1 text-sm leading-6 text-amber-900">Passenger sign-in protects your profile and lets you manage your bookings.</p><button onClick={() => { onClose(); navigate('/account'); }} className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Sign in or create account</button></div>}
      <div className="flex justify-end"><button disabled={!passenger} onClick={() => setStep('seat')} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Choose seat <ArrowRight className="h-4 w-4" /></button></div>
    </section>}
    {step === 'seat' && <section className="space-y-4"><div className="grid grid-cols-2 gap-3"><button onClick={() => { setSelectedClass('Economy'); setSelectedSeat(firstAvailableSeat('Economy', occupiedSeats)); }} className={`rounded-xl border p-3 text-left ${selectedClass === 'Economy' ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}`}><b>Economy</b><div className="mt-1 text-xs text-slate-500">Demo fare estimate ₹{flight.demo_fare_estimate.economy.toLocaleString()}</div></button><button onClick={() => { setSelectedClass('Business'); setSelectedSeat(firstAvailableSeat('Business', occupiedSeats)); }} className={`rounded-xl border p-3 text-left ${selectedClass === 'Business' ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}`}><b>Business</b><div className="mt-1 text-xs text-slate-500">Demo fare estimate ₹{flight.demo_fare_estimate.business.toLocaleString()}</div></button></div><SeatMap flightNumber={flight.flight_number} selectedSeat={selectedSeat} onSelectSeat={setSelectedSeat} occupiedSeats={occupiedSeats} selectedClass={selectedClass} /><div className="flex justify-between"><button onClick={() => setStep('passenger')} className="inline-flex items-center gap-2 px-2 text-sm text-slate-600"><ArrowLeft className="h-4 w-4" />Back</button><button disabled={!selectedSeat} onClick={() => { if (occupiedSeats.includes(selectedSeat)) { toast('Seat unavailable', 'warning', 'Choose another seat.'); return; } setStep('summary'); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Review booking <ArrowRight className="h-4 w-4" /></button></div></section>}
    {step === 'summary' && <section className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm"><div className="font-bold">{flight.airline_name} · {flight.flight_number}</div><div className="mt-2 text-slate-600">{new Date(flight.departure_time).toLocaleString()} · Seat {selectedSeat} · {selectedClass}</div><div className="mt-2 text-xs text-slate-500">Passenger: {passenger?.name}</div><div className="mt-3 border-t pt-3 text-xs text-slate-600">Illustrative fare estimate only: <b>₹{fare.toLocaleString()}</b>. No charge will be made.</div></div><div className="flex justify-between"><button onClick={() => setStep('seat')} className="inline-flex items-center gap-2 px-2 text-sm text-slate-600"><ArrowLeft className="h-4 w-4" />Back</button><button onClick={() => setStep('payment')} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Continue</button></div></section>}
    {step === 'payment' && <section className="space-y-4"><div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4"><ShieldCheck className="h-5 w-5 shrink-0 text-sky-700" /><div><b className="text-sm text-sky-950">Classroom demo — no payment is processed</b><p className="mt-1 text-xs leading-5 text-sky-900">The booking will be saved as payment pending. This screen does not collect card or UPI details.</p></div></div><button disabled={busy} onClick={submitBooking} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Saving booking…' : 'Create booking (payment pending)'}<CheckCircle2 className="h-4 w-4" /></button><button onClick={() => setStep('summary')} className="text-sm text-slate-600">Back to review</button></section>}
    {step === 'confirmation' && confirmedBooking && <section className="space-y-5"><div className="text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" /><h3 className="mt-2 text-lg font-bold">Booking saved</h3><p className="text-sm text-slate-500">Payment status: pending · Booking #{confirmedBooking.booking_id}</p></div><TicketCard booking={confirmedBooking} /><div className="flex justify-end"><button onClick={onClose} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Done</button></div></section>}
  </Modal>;
};
