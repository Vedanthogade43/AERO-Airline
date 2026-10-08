import React, { useState, useRef, useEffect } from 'react';
import { Airport } from '../../types/database';
import { MapPin, Search } from 'lucide-react';

interface AirportSelectorProps {
  label: string;
  airports: Airport[];
  selectedId: number;
  onSelect: (airportId: number) => void;
  excludeId?: number;
  placeholder?: string;
}

export const AirportSelector: React.FC<AirportSelectorProps> = ({
  label,
  airports,
  selectedId,
  onSelect,
  excludeId,
  placeholder = "Select airport"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedAirport = airports.find(a => a.airport_id === selectedId);

  const filteredAirports = airports.filter(a => {
    if (excludeId && a.airport_id === excludeId) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      a.city.toLowerCase().includes(q) ||
      a.IATA_code.toLowerCase().includes(q) ||
      a.airport_name.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative flex-1 ${isOpen ? 'z-[60]' : ''}`} ref={wrapperRef}>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
      </label>

      {/* Button trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2.5 transition-colors flex items-center justify-between gap-2 group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 text-sky-600 group-hover:bg-sky-100 transition-colors">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="truncate">
            {selectedAirport ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm tracking-tight">
                    {selectedAirport.city}
                  </span>
                  <span className="text-xs font-mono font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                    {selectedAirport.IATA_code}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {selectedAirport.airport_name}
                </div>
              </div>
            ) : (
              <span className="text-slate-400 text-sm">{placeholder}</span>
            )}
          </div>
        </div>
      </button>

      {/* Dropdown search modal / flyout */}
      {isOpen && (
        <div className="absolute left-0 top-full z-[60] mt-1.5 w-[min(24rem,calc(100vw-2rem))] min-w-[min(18rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in-50 zoom-in-95">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Search city, code (e.g. BOM, DEL)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-50">
            {filteredAirports.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No matching airports found
              </div>
            ) : (
              filteredAirports.map(airport => (
                <button
                  key={airport.airport_id}
                  type="button"
                  onClick={() => {
                    onSelect(airport.airport_id);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-sky-50/70 transition-colors ${
                    airport.airport_id === selectedId ? 'bg-sky-50 font-medium' : ''
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>{airport.city}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({airport.country})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {airport.airport_name}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {airport.IATA_code}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
