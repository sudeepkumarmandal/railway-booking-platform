import React from 'react';

const CoachMap = ({ travelClass, selectedSeats, onToggleSeat, maxSeats = 1 }) => {
  const isChairCar = ['CC', 'EC'].includes(travelClass);
  const totalBerths = 24;
  const bookedSeats = [3, 7, 8, 12, 14, 19, 20];

  const getBerthType = (i) => {
    if (isChairCar) return i % 2 === 1 ? 'W' : 'A';
    const mod = i % 8;
    if (mod === 1 || mod === 4) return 'LB';
    if (mod === 2 || mod === 5) return 'MB';
    if (mod === 3 || mod === 6) return 'UB';
    if (mod === 7) return 'SL';
    return 'SU';
  };

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold uppercase text-slate-700">
          Coach Layout Preview (Coach {isChairCar ? 'C3' : 'B3'})
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-emerald-50 border border-emerald-300 rounded inline-block"></span> Avail
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-sky-600 rounded inline-block"></span> Selected
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-slate-200 rounded inline-block"></span> Booked
          </span>
        </div>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 py-1">
        {Array.from({ length: totalBerths }, (_, idx) => {
          const seatNum = idx + 1;
          const isBooked = bookedSeats.includes(seatNum);
          const isSelected = selectedSeats.includes(seatNum);
          const type = getBerthType(seatNum);

          return (
            <button
              key={seatNum}
              type="button"
              disabled={isBooked}
              onClick={() => onToggleSeat(seatNum)}
              className={`p-2 rounded font-mono text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                isBooked
                  ? 'bg-slate-200 text-slate-400 line-through cursor-not-allowed border-slate-300'
                  : isSelected
                  ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
              }`}
            >
              <span>{seatNum}</span>
              <span className="text-[9px] opacity-80">{type}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-2">
        Click to select up to {maxSeats} preferred berth(s). Berths will be automatically locked upon checkout.
      </p>
    </div>
  );
};

export default CoachMap;
