import React from 'react';

const TrainCard = ({ train, onSelectClass, onViewRoute }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 mb-4">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b pb-4 mb-4 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-base text-sky-800">{train.trainNumber}</span>
            <h3 className="font-bold text-lg text-slate-900">{train.trainName}</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-sky-100 text-sky-800">
              {train.type}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Runs On: <strong className="text-slate-700">Daily</strong> | Total Distance: {train.totalDistanceKm} km
          </div>
        </div>

        <button
          onClick={() => onViewRoute(train)}
          className="text-xs font-semibold text-sky-600 hover:text-sky-800"
        >
          📅 View Timetable & Stops
        </button>
      </div>

      {/* Schedule Bar */}
      <div className="grid grid-cols-3 items-center text-center py-2 bg-slate-50 rounded-lg mb-4">
        <div className="text-left pl-4">
          <div className="text-xl font-bold text-slate-900">{train.departureTime}</div>
          <div className="text-xs font-semibold text-slate-700">{train.sourceStation.name} ({train.sourceStation.code})</div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-500 font-medium">{train.duration}</span>
          <div className="w-24 h-0.5 bg-slate-300 relative my-1">
            <div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-slate-500"></div>
            <div className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-slate-500"></div>
          </div>
          <span className="text-[11px] text-slate-400">{train.totalDistanceKm} km</span>
        </div>
        <div className="text-right pr-4">
          <div className="text-xl font-bold text-slate-900">{train.arrivalTime}</div>
          <div className="text-xs font-semibold text-slate-700">{train.destinationStation.name} ({train.destinationStation.code})</div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="text-xs font-semibold text-slate-500 mb-2">Select Class to Book:</div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(train.classes || {}).map(([cls, info]) => {
          const isAvail = info.availableSeats > 0;
          return (
            <button
              key={cls}
              type="button"
              disabled={!isAvail}
              onClick={() => onSelectClass(train, cls)}
              aria-label={`${cls}, ${info.status}, ${info.availableSeats} seats, ₹${info.fare}`}
              className={`flex-1 min-w-[110px] rounded-lg border p-3 text-center transition-all hover:border-sky-500 hover:shadow-sm disabled:cursor-not-allowed ${
                isAvail ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm text-slate-900">{cls}</span>
                <span className="text-xs font-bold text-slate-900">₹{info.fare}</span>
              </div>
              <div className="text-xs font-bold">
                {info.status} {isAvail ? info.availableSeats : ''}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {info.confirmationProbability}% Confirm Chance
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default TrainCard;
