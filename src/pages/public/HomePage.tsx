import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { dbService } from '../../services/dbService';
import { AirportSelector } from '../../components/flight/AirportSelector';
import { FlightCard } from '../../components/flight/FlightCard';
import { BookingWizardModal } from '../../components/booking/BookingWizardModal';
import { EnrichedFlight } from '../../types/database';
import { ArrowLeftRight, ArrowRight, Search, Calendar, Shield, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import heroImage from '../../assets/images/airline_hero_aircraft_1790780054033.jpg';
import mumbaiImage from '../../assets/images/destination_mumbai_1790780065737.jpg';

const todayLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const flightInstant = (value: string) => new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}+05:30`);
export const HomePage: React.FC = () => {
  const { navigate } = useRouter();
  const { toast } = useToast();
  const airports = dbService.getAirports();
  const enrichedFlights = dbService.getEnrichedFlights();

  // Search form state
  const [originId, setOriginId] = useState<number>(1); // Mumbai (BOM)
  const [destinationId, setDestinationId] = useState<number>(2); // Delhi (DEL)
  const [departureDate, setDepartureDate] = useState<string>(() => {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  });
  const [cabinClass, setCabinClass] = useState<'Economy' | 'Business'>('Economy');

  // Booking wizard modal state
  const [bookingFlight, setBookingFlight] = useState<EnrichedFlight | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Swap origin and destination
  const handleSwapAirports = () => {
    const temp = originId;
    setOriginId(destinationId);
    setDestinationId(temp);
    toast('Routes Swapped', 'info', 'Origin and destination airports exchanged.');
  };

  // Perform search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (originId === destinationId) {
      toast('Invalid Route', 'error', 'Origin and destination airports cannot be identical.');
      return;
    }
    navigate(`/flights?from=${originId}&to=${destinationId}&date=${departureDate}&class=${cabinClass}`);
  };

  const handleSelectFlight = (flight: EnrichedFlight, selectedClass: 'Economy' | 'Business') => {
    setCabinClass(selectedClass);
    setBookingFlight(flight);
    setBookingModalOpen(true);
  };

  // Featured sample flights for quick preview
  const featuredFlights = enrichedFlights.filter(f => f.flight_status !== 'Cancelled' && flightInstant(f.departure_time).getTime() > Date.now()).slice(0, 3);

  return (
    <div className="space-y-16 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-900 text-white min-h-[540px] flex items-center">
        {/* Background photo with measured contrast scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Commercial airliner in golden hour sky"
            className="w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 bg-sky-950/70 border border-sky-800/80 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Find your next destination</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Fly beyond boundaries.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Search routes, choose your seat, and book your next journey in a few simple steps.
            </p>
          </div>

          {/* FLIGHT SEARCH WIDGET */}
          <div className="mt-10 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 max-w-5xl">
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Top Controls: Class and Passenger Count */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Trip Type:</span>
                  <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md">
                    One-Way Direct
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Cabin:</span>
                    <select
                      value={cabinClass}
                      onChange={(e) => setCabinClass(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 font-medium text-slate-800 focus:outline-none focus:border-sky-500"
                    >
                      <option value="Economy">Economy Class</option>
                      <option value="Business">Business Class</option>
                    </select>
                  </div>

                  <span className="text-slate-500">One passenger per booking</span>
                </div>
              </div>

              {/* Main inputs row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Origin */}
                <div className="md:col-span-4">
                  <AirportSelector
                    label="From (Origin)"
                    airports={airports}
                    selectedId={originId}
                    onSelect={(id) => setOriginId(id)}
                    excludeId={destinationId}
                  />
                </div>

                {/* Swap button */}
                <div className="md:col-span-1 flex items-center justify-center pb-1">
                  <button
                    type="button"
                    onClick={handleSwapAirports}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 text-slate-600 transition-colors"
                    title="Swap origin and destination"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-sky-600" />
                  </button>
                </div>

                {/* Destination */}
                <div className="md:col-span-4">
                  <AirportSelector
                    label="To (Destination)"
                    airports={airports}
                    selectedId={destinationId}
                    onSelect={(id) => setDestinationId(id)}
                    excludeId={originId}
                  />
                </div>

                {/* Departure Date */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departure Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      min={todayLocal()}
                      required
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="text-xs text-slate-500">
                  Popular routes: <button type="button" onClick={() => { setOriginId(1); setDestinationId(2); }} className="text-sky-600 font-semibold hover:underline">BOM → DEL</button>, <button type="button" onClick={() => { setOriginId(5); setDestinationId(1); }} className="text-sky-600 font-semibold hover:underline">HYD → BOM</button>, <button type="button" onClick={() => { setOriginId(3); setDestinationId(4); }} className="text-sky-600 font-semibold hover:underline">PNQ → BLR</button>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-md active:scale-98"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Flights</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* INSPIRATION & KEY DESTINATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Featured Flight Routes
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Explore sample domestic routes connecting major Indian cities.
            </p>
          </div>
          <button
            onClick={() => navigate('/flights')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
          >
            <span>View All Schedules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Mumbai */}
          <div
            onClick={() => { setOriginId(1); setDestinationId(2); navigate(`/flights?from=1&to=2&date=${departureDate}`); }}
            className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs hover:shadow-lg transition-all"
          >
            <div className="h-44 relative overflow-hidden">
              <img
                src={mumbaiImage}
                alt="Mumbai skyline"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 text-white">
                <span className="font-mono text-xs font-bold text-sky-300 bg-sky-950/70 px-2 py-0.5 rounded">BOM → DEL</span>
                <h3 className="font-bold text-base mt-1">Mumbai to New Delhi</h3>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between text-xs">
              <span className="text-slate-500">Air India · IndiGo (Nonstop)</span>
              <span className="font-mono font-bold text-slate-900">From ₹4,850*</span>
            </div>
          </div>

          {/* Card 2: Hyderabad */}
          <div
            onClick={() => { setOriginId(5); setDestinationId(1); navigate(`/flights?from=5&to=1&date=${departureDate}`); }}
            className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs hover:shadow-lg transition-all"
          >
            <div className="h-44 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-sky-900 to-cyan-700">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_70%_30%,white,transparent_35%)]" />
              <div className="absolute bottom-3 left-4 text-white">
                <span className="font-mono text-xs font-bold text-sky-200 bg-sky-950/70 px-2 py-0.5 rounded">HYD → BOM</span>
                <h3 className="font-bold text-base mt-1">Hyderabad to Mumbai</h3>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between text-xs">
              <span className="text-slate-500">IndiGo · SpiceJet (Nonstop)</span>
              <span className="font-mono font-bold text-slate-900">From ₹2,760*</span>
            </div>
          </div>

        </div>
      </section>

      {/* QUICK FLIGHT RESULTS PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Active Schedules & Booking Preview
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select any flight below to test the full interactive booking, seat selection, and digital boarding pass workflow.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {featuredFlights.map((flight) => (
            <FlightCard
              key={flight.flight_id}
              flight={flight}
              onSelect={handleSelectFlight}
              onViewDetails={(f) => navigate(`/flights/${f.flight_id}`)}
            />
          ))}
        </div>
      </section>

      {/* Booking Wizard Modal */}
      <BookingWizardModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        flight={bookingFlight}
        initialClass={cabinClass}
      />

    </div>
  );
};
