import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { dbService } from '../../services/dbService';
import { BookingWizardModal } from '../../components/booking/BookingWizardModal';
import { ArrowLeft, Plane, Clock, ShieldCheck, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

export const FlightDetailPage: React.FC = () => {
  const { params, navigate } = useRouter();
  const flightId = parseInt(params.flightId || '0', 10);
  const enrichedFlights = dbService.getEnrichedFlights();
  const flight = enrichedFlights.find(f => f.flight_id === flightId);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<'Economy' | 'Business'>('Economy');

  if (!flight) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Flight Not Found</h2>
        <p className="text-xs text-slate-500">We couldn’t find that flight.</p>
        <button
          onClick={() => navigate('/flights')}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg"
        >
          Return to Flight List
        </button>
      </div>
    );
  }

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '--:--';
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const occupiedSeats = dbService.getOccupiedSeatsForFlight(flight.flight_id);
  const totalCapacity = 22 * 6; // 132 seats
  const availableSeatsCount = totalCapacity - occupiedSeats.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/flights')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Flights</span>
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 font-bold flex items-center justify-center text-sm">
              {flight.airline_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">
                {flight.airline_name} · Flight {flight.flight_number}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Direct nonstop flight · {flight.flight_number}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Flight Date</span>
            <span className="text-sm font-semibold text-slate-900">{formatDate(flight.departure_time)}</span>
            <span className={`mt-1 block text-xs font-semibold ${flight.flight_status === 'Delayed' ? 'text-amber-700' : flight.flight_status === 'Cancelled' ? 'text-rose-700' : 'text-sky-700'}`}>Status: {flight.flight_status}</span>
          </div>
        </div>

        {/* Route Details Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-4">
          {/* Origin */}
          <div className="md:col-span-4 bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Departure
            </div>
            <div className="text-3xl font-extrabold font-mono text-slate-900">
              {formatTime(flight.departure_time)}
            </div>
            <div className="mt-2">
              <span className="font-bold text-slate-900 text-base">{flight.departure_airport?.city}</span>
              <span className="ml-2 font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded text-xs">
                {flight.departure_airport?.IATA_code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {flight.departure_airport?.airport_name}, {flight.departure_airport?.state}, {flight.departure_airport?.country}
            </p>
          </div>

          {/* Center Connection */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center px-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-800">{flight.duration_formatted}</span>
              <span>non-stop</span>
            </div>
            <div className="w-full flex items-center gap-2">
              <div className="h-0.5 flex-1 bg-slate-200" />
              <Plane className="w-5 h-5 text-sky-600 rotate-90" />
              <div className="h-0.5 flex-1 bg-slate-200" />
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-2">
              Available Seats: {availableSeatsCount} / {totalCapacity}
            </span>
          </div>

          {/* Destination */}
          <div className="md:col-span-4 bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Arrival
            </div>
            <div className="text-3xl font-extrabold font-mono text-slate-900">
              {formatTime(flight.arrival_time)}
            </div>
            <div className="mt-2">
              <span className="font-bold text-slate-900 text-base">{flight.arrival_airport?.city}</span>
              <span className="ml-2 font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded text-xs">
                {flight.arrival_airport?.IATA_code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {flight.arrival_airport?.airport_name}, {flight.arrival_airport?.state}, {flight.arrival_airport?.country}
            </p>
          </div>
        </div>

        {/* Fare and Booking Card */}
        <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Illustrative Fare Options (Demo Estimate)
            </span>
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs text-slate-500">Economy Class:</span>
                <span className="ml-2 font-mono font-extrabold text-lg text-slate-900">
                  ₹{flight.demo_fare_estimate.economy.toLocaleString()}
                </span>
              </div>
              <div className="border-l border-slate-200 pl-6">
                <span className="text-xs text-slate-500">Business Class:</span>
                <span className="ml-2 font-mono font-extrabold text-lg text-slate-900">
                  ₹{flight.demo_fare_estimate.business.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={flight.flight_status === 'Cancelled'}
              onClick={() => { setSelectedClass('Economy'); setBookingModalOpen(true); }}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {flight.flight_status === 'Cancelled' ? 'Flight cancelled' : 'Book Economy'}
            </button>
            <button
              disabled={flight.flight_status === 'Cancelled'}
              onClick={() => { setSelectedClass('Business'); setBookingModalOpen(true); }}
              className="px-5 py-2.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors border border-sky-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Book Business
            </button>
          </div>
        </div>
      </div>

      {/* Booking Wizard Modal */}
      <BookingWizardModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        flight={flight}
        initialClass={selectedClass}
      />
    </div>
  );
};
