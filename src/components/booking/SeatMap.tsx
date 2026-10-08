import React from 'react';

interface SeatMapProps {
  flightNumber: string;
  selectedSeat: string;
  onSelectSeat: (seat: string) => void;
  occupiedSeats: string[];
  selectedClass: 'Economy' | 'Business';
}

export const SeatMap: React.FC<SeatMapProps> = ({
  selectedSeat,
  onSelectSeat,
  occupiedSeats,
  selectedClass
}) => {
  const totalRows = 22;
  const businessRows = [1, 2, 3, 4, 5];
  const rows = Array.from({ length: totalRows }, (_, i) => i + 1);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 select-none">
      {/* Legend & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            Interactive Cabin Seat Map
          </h4>
          <p className="text-xs text-slate-500">
            Simulated layout (22 rows · Boeing 737) · <span className="italic text-slate-400">Illustrative UI Demo</span>
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-sky-600 border border-sky-600" />
            <span className="font-semibold text-sky-700">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-200 border border-slate-300" />
            <span className="text-slate-400">Occupied</span>
          </div>
        </div>
      </div>

      {/* Plane Nose Indicator */}
      <div className="pt-6 pb-2 flex flex-col items-center">
        <div className="w-24 h-6 border-t-2 border-x-2 border-slate-300 rounded-t-full bg-white flex items-center justify-center text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Front · Cockpit
        </div>
      </div>

      {/* Cabin Scroll Area */}
      <div className="max-h-96 overflow-y-auto pr-1 py-2 space-y-2">
        {rows.map((rowNum) => {
          const isBusiness = businessRows.includes(rowNum);
          const isRowRecommendedForClass =
            (selectedClass === 'Business' && isBusiness) ||
            (selectedClass === 'Economy' && !isBusiness);
          const isWrongCabin = !isRowRecommendedForClass;

          return (
            <div key={rowNum} className="space-y-1">
              {/* Row Category divider when transitioning from Business to Economy */}
              {rowNum === 1 && (
                <div className="text-[11px] font-semibold text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded text-center mb-2">
                  Business Class Cabin (Rows 1–5)
                </div>
              )}
              {rowNum === 6 && (
                <div className="text-[11px] font-semibold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded text-center my-2">
                  Economy Class Cabin (Rows 6–22)
                </div>
              )}

              <div
                className={`flex items-center justify-center gap-2 p-1 rounded-lg transition-colors ${
                  isRowRecommendedForClass ? 'bg-white/80' : 'opacity-85'
                }`}
              >
                {/* Left side: A, B, C */}
                <div className="flex items-center gap-1.5">
                  {['A', 'B', 'C'].map((letter) => {
                    const seatId = `${rowNum.toString().padStart(2, '0')}${letter}`;
                    const isOccupied = occupiedSeats.includes(seatId);
                    const isSelected = selectedSeat === seatId;
                    const isUnavailable = isOccupied || isWrongCabin;

                    return (
                      <button
                        key={seatId}
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => onSelectSeat(seatId)}
                        className={`w-8 h-8 rounded-md text-xs font-mono font-medium transition-all duration-150 flex items-center justify-center ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300 scale-105'
                            : isUnavailable
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                            : 'bg-white text-slate-800 border border-slate-300 hover:border-sky-500 hover:text-sky-600'
                        }`}
                        title={
                          isOccupied
                            ? `Seat ${seatId} is already booked`
                            : isWrongCabin
                            ? `Seat ${seatId} is in ${isBusiness ? 'Business' : 'Economy'} class`
                            : `Select Seat ${seatId} (${isBusiness ? 'Business' : 'Economy'})`
                        }
                      >
                        {seatId}
                      </button>
                    );
                  })}
                </div>

                {/* Central Aisle / Row Number */}
                <div className="w-8 text-center text-xs font-mono font-semibold text-slate-400">
                  {rowNum}
                </div>

                {/* Right side: D, E, F */}
                <div className="flex items-center gap-1.5">
                  {['D', 'E', 'F'].map((letter) => {
                    const seatId = `${rowNum.toString().padStart(2, '0')}${letter}`;
                    const isOccupied = occupiedSeats.includes(seatId);
                    const isSelected = selectedSeat === seatId;
                    const isUnavailable = isOccupied || isWrongCabin;

                    return (
                      <button
                        key={seatId}
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => onSelectSeat(seatId)}
                        className={`w-8 h-8 rounded-md text-xs font-mono font-medium transition-all duration-150 flex items-center justify-center ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300 scale-105'
                            : isUnavailable
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                            : 'bg-white text-slate-800 border border-slate-300 hover:border-sky-500 hover:text-sky-600'
                        }`}
                        title={
                          isOccupied
                            ? `Seat ${seatId} is already booked`
                            : isWrongCabin
                            ? `Seat ${seatId} is in ${isBusiness ? 'Business' : 'Economy'} class`
                            : `Select Seat ${seatId} (${isBusiness ? 'Business' : 'Economy'})`
                        }
                      >
                        {seatId}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Seat Notification */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
        <span className="text-slate-500">Currently Selected:</span>
        <span className="font-mono font-bold text-sm text-slate-900 bg-white border border-slate-300 px-2.5 py-0.5 rounded-md">
          {selectedSeat || 'None'}
        </span>
      </div>
    </div>
  );
};
