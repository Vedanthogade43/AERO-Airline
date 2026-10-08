import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { dbService } from '../../services/dbService';
import { FlightCard } from '../../components/flight/FlightCard';
import { AirportSelector } from '../../components/flight/AirportSelector';
import { BookingWizardModal } from '../../components/booking/BookingWizardModal';
import { EnrichedFlight } from '../../types/database';
import { Filter, ArrowUpDown, X, Plane, Search } from 'lucide-react';

const todayLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const flightInstant = (value: string) => new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}+05:30`);

export const FlightsPage: React.FC = () => {
  const { searchParams, navigate } = useRouter();
  const airports = dbService.getAirports();
  const enrichedFlights = dbService.getEnrichedFlights();

  // Search parameters from URL or defaults
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const dateParam = searchParams.get('date') || '';
  const classParam = searchParams.get('class') === 'Business' ? 'Business' : 'Economy';

  const [originFilter, setOriginFilter] = useState<number>(fromParam ? parseInt(fromParam, 10) : 0);
  const [destFilter, setDestFilter] = useState<number>(toParam ? parseInt(toParam, 10) : 0);
  const [airlineFilter, setAirlineFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState(dateParam);
  const [sortBy, setSortBy] = useState<'departure' | 'arrival' | 'duration' | 'price'>('departure');
  const [selectedCabin, setSelectedCabin] = useState<'Economy' | 'Business'>(classParam);
  useEffect(() => {
    setOriginFilter(fromParam ? Number(fromParam) : 0);
    setDestFilter(toParam ? Number(toParam) : 0);
    setDateFilter(dateParam);
    setSelectedCabin(classParam);
  }, [fromParam, toParam, dateParam, classParam]);

  // Booking modal
  const [bookingFlight, setBookingFlight] = useState<EnrichedFlight | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Filter & sort logic
  const filteredFlights = useMemo(() => {
    return enrichedFlights.filter(f => {
      if (f.flight_status === 'Cancelled') return false;
      if (flightInstant(f.departure_time).getTime() <= Date.now()) return false;
      if (originFilter !== 0 && f.departure_airport_id !== originFilter) return false;
      if (destFilter !== 0 && f.arrival_airport_id !== destFilter) return false;
      if (airlineFilter !== 'all' && f.airline_name !== airlineFilter) return false;
      if (dateFilter && String(f.departure_time).slice(0, 10) !== dateFilter) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'departure') {
        return flightInstant(a.departure_time).getTime() - flightInstant(b.departure_time).getTime();
      }
      if (sortBy === 'arrival') {
        return flightInstant(a.arrival_time).getTime() - flightInstant(b.arrival_time).getTime();
      }
      if (sortBy === 'duration') {
        return a.duration_minutes - b.duration_minutes;
      }
      if (sortBy === 'price') {
        return a.demo_fare_estimate.economy - b.demo_fare_estimate.economy;
      }
      return 0;
    });
  }, [enrichedFlights, originFilter, destFilter, airlineFilter, dateFilter, sortBy]);

  // Unique airlines for filter dropdown
  const airlines = Array.from(new Set(enrichedFlights.map(f => f.airline_name)));

  const handleSelectFlight = (flight: EnrichedFlight, cabin: 'Economy' | 'Business') => {
    setSelectedCabin(cabin);
    setBookingFlight(flight);
    setBookingModalOpen(true);
  };

  const clearFilters = () => {
    setOriginFilter(0);
    setDestFilter(0);
    setAirlineFilter('all');
    setDateFilter('');
    setSortBy('departure');
  };

  const hasActiveFilters = originFilter !== 0 || destFilter !== 0 || airlineFilter !== 'all' || dateFilter !== '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Flight Schedules & Search
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse available routes and departure times.
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear All Filters</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="relative z-20 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3 items-end">
          {/* Origin Picker */}
          <div className="min-w-0 xl:col-span-3">
            <AirportSelector
              label="Origin Airport"
              airports={airports}
              selectedId={originFilter}
              onSelect={(id) => setOriginFilter(id)}
              placeholder="All Origin Airports"
            />
          </div>

          {/* Destination Picker */}
          <div className="min-w-0 xl:col-span-3">
            <AirportSelector
              label="Destination Airport"
              airports={airports}
              selectedId={destFilter}
              onSelect={(id) => setDestFilter(id)}
              placeholder="All Destination Airports"
            />
          </div>

          {/* Travel Date */}
          <div className="min-w-0 xl:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Travel date</label>
            <input type="date" min={todayLocal()} value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="block w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-800" />
          </div>

          {/* Airline Filter */}
          <div className="min-w-0 xl:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Airline
            </label>
            <select
              value={airlineFilter}
              onChange={(e) => setAirlineFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Airlines</option>
              {airlines.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="min-w-0 xl:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span>Sort By</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500"
            >
              <option value="departure">Departure Time</option>
              <option value="arrival">Arrival Time</option>
              <option value="duration">Fastest Duration</option>
              <option value="price">Lowest Demo Fare</option>
            </select>
          </div>
        </div>

        {/* Results Count & Sub-bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{filteredFlights.length}</span>
            <span>flights match your selection</span>
            {originFilter !== 0 && (
              <>
                <span>·</span>
                <span>From: {airports.find(a => a.airport_id === originFilter)?.IATA_code}</span>
              </>
            )}
            {destFilter !== 0 && (
              <>
                <span>·</span>
                <span>To: {airports.find(a => a.airport_id === destFilter)?.IATA_code}</span>
              </>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            * Fares shown are illustrative UI estimates
          </div>
        </div>
      </div>

      {/* Flight Results List */}
      {filteredFlights.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              No matching flights found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No direct flight matches this route. Try another airport selection.
            </p>
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
          >
            Reset Filters & View All Flights
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFlights.map((flight) => (
            <FlightCard
              key={flight.flight_id}
              flight={flight}
              initialClass={selectedCabin}
              onSelect={handleSelectFlight}
              onViewDetails={(f) => navigate(`/flights/${f.flight_id}`)}
            />
          ))}
        </div>
      )}

      {/* Booking Wizard Modal */}
      <BookingWizardModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        flight={bookingFlight}
        initialClass={selectedCabin}
      />
    </div>
  );
};
