import React from 'react';
import { EnrichedBooking } from '../../types/database';
import { Plane, Printer, QrCode, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface TicketCardProps {
  booking: EnrichedBooking;
}

export const TicketCard: React.FC<TicketCardProps> = ({ booking }) => {
  const { toast } = useToast();
  const flight = booking.flight;
  const passenger = booking.passenger;

  const handlePrint = () => {
    toast('Preparing Boarding Pass', 'info', 'Opening printer preview...');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '--:--';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '--:--';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      return new Date(dateStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isPaid = booking.payment_status === 'Paid';

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-w-2xl mx-auto print:shadow-none print:border-none">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">Aero Boarding Pass</span>
              <span className="text-xs bg-sky-500/20 text-sky-300 font-mono px-2 py-0.5 rounded border border-sky-400/30">
                {booking.class} Class
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Booking number: <span className="font-mono text-white font-bold">#{booking.booking_id}</span> · Reference: <span className="font-mono text-white">AER-{booking.booking_id * 17}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Airline & Flight</div>
            <div className="text-lg font-bold font-mono text-sky-400 flex items-center gap-1.5 justify-end">
              <Plane className="w-4 h-4 rotate-45" />
              <span>{flight?.airline_name} {flight?.flight_number}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Ticket Body */}
      <div className="p-6 md:p-8 space-y-6">
        {/* Route Row */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="text-left">
            <div className="text-3xl font-extrabold font-mono text-slate-900">
              {flight?.departure_airport?.IATA_code || 'BOM'}
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {flight?.departure_airport?.city}
            </div>
            <div className="text-xs text-slate-400 max-w-[160px] truncate">
              {flight?.departure_airport?.airport_name}
            </div>
            <div className="mt-2 text-xs font-mono text-slate-600">
              Dep: <span className="font-bold text-slate-900">{formatTime(flight?.departure_time)}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 px-4">
            <div className="text-[11px] font-mono text-slate-400 mb-1">
              {flight?.duration_formatted || '2h 10m'} Direct
            </div>
            <div className="w-full flex items-center gap-2">
              <div className="h-0.5 flex-1 bg-slate-200" />
              <Plane className="w-4 h-4 text-sky-600 rotate-90" />
              <div className="h-0.5 flex-1 bg-slate-200" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Confirmed Non-stop</div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-extrabold font-mono text-slate-900">
              {flight?.arrival_airport?.IATA_code || 'DEL'}
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {flight?.arrival_airport?.city}
            </div>
            <div className="text-xs text-slate-400 max-w-[160px] truncate ml-auto">
              {flight?.arrival_airport?.airport_name}
            </div>
            <div className="mt-2 text-xs font-mono text-slate-600">
              Arr: <span className="font-bold text-slate-900">{formatTime(flight?.arrival_time)}</span>
            </div>
          </div>
        </div>

        {/* Passenger & Booking Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-b border-slate-100 pb-6 text-xs">
          <div>
            <div className="text-slate-400 uppercase tracking-wider text-[10px]">Passenger Name</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5 truncate">
              {passenger?.name || 'Traveller'}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {passenger?.gender || ''}
            </div>
          </div>

          <div>
            <div className="text-slate-400 uppercase tracking-wider text-[10px]">Assigned Seat</div>
            <div className="font-mono font-extrabold text-sky-600 text-lg mt-0.5">
              {booking.seat_number}
            </div>
            <div className="text-[11px] text-slate-500">
              {booking.class} Class
            </div>
          </div>

          <div>
            <div className="text-slate-400 uppercase tracking-wider text-[10px]">Flight Date</div>
            <div className="font-semibold text-slate-900 mt-0.5">
              {formatDate(flight?.departure_time)}
            </div>
            <div className="text-[11px] text-slate-500">
              Booked: {booking.booking_date}
            </div>
          </div>

          <div>
            <div className="text-slate-400 uppercase tracking-wider text-[10px]">Payment Status</div>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-sm">
              {isPaid ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Paid
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Pending
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 italic">
              {isPaid ? 'Simulation verified' : 'Payment pending'}
            </div>
          </div>
        </div>

        {/* Decorative Barcode / QR Code Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Simulated QR Code */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-slate-900 rounded-xl p-1.5 flex items-center justify-center text-white shrink-0 shadow-sm">
              <QrCode className="w-10 h-10 text-white" />
            </div>
            <div className="text-[11px] text-slate-500 leading-tight">
              <span className="font-semibold text-slate-700 block">Security Boarding Token</span>
              Present at the airport · Aero v1.0
            </div>
          </div>

          {/* Simulated Barcode */}
          <div className="flex flex-col items-center sm:items-end">
            <div className="font-mono text-[9px] tracking-[4px] text-slate-400 select-none overflow-hidden h-8 flex items-end">
              ||| | || |||| | ||| || |||| ||||| || | |||| ||
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              *{booking.booking_id}-{booking.flight_id}-{booking.seat_number}*
            </span>
          </div>
        </div>
      </div>

      {/* Print / Action Footer (Hidden on actual print) */}
      <div className="bg-slate-50 border-t border-slate-100 p-4 px-6 flex items-center justify-between print:hidden">
        <span className="text-xs text-slate-500">
          Digital simulation copy · No real airlines
        </span>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Boarding Pass</span>
        </button>
      </div>
    </div>
  );
};
