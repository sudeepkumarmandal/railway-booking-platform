import React, { useState } from 'react';

const toLocalDateInputValue = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
);

const getToday = () => toLocalDateInputValue(new Date());
const getSuggestedDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 4);
  return toLocalDateInputValue(date);
};

const TrainSearch = ({ stations, onSearch }) => {
  const [from, setFrom] = useState('NDLS');
  const [to, setTo] = useState('BSB');
  const [date, setDate] = useState(getSuggestedDate);
  const [travelClass, setTravelClass] = useState('ALL');
  const [quota, setQuota] = useState('General (GN)');
  const [validationError, setValidationError] = useState('');

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (from === to) {
      setValidationError('Choose different source and destination stations.');
      return;
    }
    if (!date || date < getToday()) {
      setValidationError('Choose today or a future journey date.');
      return;
    }
    setValidationError('');
    onSearch({ from, to, date, travelClass, quota });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-1">Search Trains Between Any Listed Stations</h2>
      <p className="text-xs text-slate-500 mb-6">Search train routes stored in the local database. Schedules and seat availability are demo data unless you connect a live railway data provider.</p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* From */}
          <div className="md:col-span-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">From Station</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-transparent font-bold text-sm text-slate-900 outline-none mt-1 cursor-pointer"
            >
              {stations.map(s => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Swap */}
          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 hover:bg-sky-100 flex items-center justify-center text-sky-700 shadow-sm transition-all"
            >
              ⇄
            </button>
          </div>

          {/* To */}
          <div className="md:col-span-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">To Station</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-transparent font-bold text-sm text-slate-900 outline-none mt-1 cursor-pointer"
            >
              {stations.map(s => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="md:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Journey Date</label>
            <input
              type="date"
              value={date}
              min={getToday()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent font-bold text-sm text-slate-900 outline-none mt-1 cursor-pointer"
            />
          </div>

          {/* Quota */}
          <div className="md:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quota</label>
            <select
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              className="w-full bg-transparent font-bold text-xs text-slate-900 outline-none mt-1 cursor-pointer"
            >
              <option value="General (GN)">General (GN)</option>
              <option value="Tatkal (TQ)">Tatkal (TQ)</option>
              <option value="Ladies (LD)">Ladies (LD)</option>
              <option value="Senior Citizen (SS)">Senior Citizen (SS)</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
            >
              Find
            </button>
          </div>

        </div>
      </form>

      {validationError && (
        <p role="alert" className="mt-3 text-sm font-medium text-rose-700">
          {validationError}
        </p>
      )}

      {/* Quick Pills */}
      <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t text-xs text-slate-500">
        <span className="font-semibold text-slate-400">Popular:</span>
        <button onClick={() => { setFrom('NDLS'); setTo('BSB'); onSearch({ from: 'NDLS', to: 'BSB', date, travelClass, quota }); }} className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">Delhi ➔ Varanasi</button>
        <button onClick={() => { setFrom('NDLS'); setTo('MMCT'); onSearch({ from: 'NDLS', to: 'MMCT', date, travelClass, quota }); }} className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">Delhi ➔ Mumbai</button>
        <button onClick={() => { setFrom('NDLS'); setTo('HWH'); onSearch({ from: 'NDLS', to: 'HWH', date, travelClass, quota }); }} className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">Delhi ➔ Howrah</button>
      </div>
    </div>
  );
};

export default TrainSearch;
