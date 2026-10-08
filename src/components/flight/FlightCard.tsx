import React from 'react';
import { EnrichedFlight } from '../../types/database';
import { Plane, ArrowRight, Clock } from 'lucide-react';

interface FlightCardProps {
  flight: EnrichedFlight;
  onSelect?: (flight: EnrichedFlight, selectedClass: 'Economy' | 'Business') => void;
  onViewDetails?: (flight: EnrichedFlight) => void;
  initialClass?: 'Economy' | 'Business';
}

export const FlightCard: React.FC<FlightCardProps> = ({
  flight,
  onSelect,
  onViewDetails,
  initialClass = 'Economy'
}) => {
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '--:--';
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200">
      {/* Top Header: Airline & Flight Number */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 font-bold flex items-center justify-center text-xs">
            {flight.airline_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm tracking-tight">
              {flight.airline_name}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Flight {flight.flight_number} · Nonstop
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Date: <span className="font-medium text-slate-800">{formatDate(flight.departure_time)}</span></span>
          {flight.flight_status !== 'Scheduled' && <span className={`rounded-full px-2 py-1 font-semibold ${flight.flight_status === 'Delayed' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>{flight.flight_status}</span>}
        </div>
      </div>

      {/* Route & Timing Grid */}
      <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Departure */}
        <div className="md:col-span-4 text-left">
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900">
            {formatTime(flight.departure_time)}
          </div>
          <div className="font-semibold text-sm text-slate-800 flex items-center gap-1.5 mt-0.5">
            <span className="text-sky-600 font-mono font-bold">{flight.departure_airport?.IATA_code}</span>
            <span>·</span>
            <span>{flight.departure_airport?.city}</span>
          </div>
          <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
            {flight.departure_airport?.airport_name}
          </div>
        </div>

        {/* Flight Path / Duration */}
        <div className="md:col-span-4 flex flex-col items-center justify-center px-2">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-medium">{flight.duration_formatted}</span>
            <span className="text-slate-400">· Computed</span>
          </div>
          <div className="w-full flex items-center gap-2">
            <div className="h-0.5 flex-1 bg-slate-200 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-400" />
            </div>
            <Plane className="w-4 h-4 text-sky-600 rotate-90 shrink-0" />
            <div className="h-0.5 flex-1 bg-slate-200 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-400" />
            </div>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1">Direct Flight</span>
        </div>

        {/* Arrival */}
        <div className="md:col-span-4 md:text-right">
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900">
            {formatTime(flight.arrival_time)}
          </div>
          <div className="font-semibold text-sm text-slate-800 flex md:justify-end items-center gap-1.5 mt-0.5">
            <span>{flight.arrival_airport?.city}</span>
            <span>·</span>
            <span className="text-sky-600 font-mono font-bold">{flight.arrival_airport?.IATA_code}</span>
          </div>
          <div className="text-xs text-slate-500 truncate max-w-xs md:ml-auto mt-0.5">
            {flight.arrival_airport?.airport_name}
          </div>
        </div>
      </div>

      {/* Bottom Area: Class Fare Options & Select Actions */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Economy (Demo Est.)</span>
            <span className="text-sm font-bold text-slate-900 font-mono">
              ₹{flight.demo_fare_estimate.economy.toLocaleString()}
            </span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-slate-500 block text-[11px]">Business (Demo Est.)</span>
            <span className="text-sm font-bold text-slate-900 font-mono">
              ₹{flight.demo_fare_estimate.business.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(flight)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Details
            </button>
          )}

          {onSelect && (
            <button
              onClick={() => onSelect(flight, initialClass)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <span>Book {initialClass}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
