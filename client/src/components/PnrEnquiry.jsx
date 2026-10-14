import React, { useState } from 'react';
import { getPnrStatusApi } from '../services/api';

const PnrEnquiry = ({ bookings, onViewTicket }) => {
  const [pnr, setPnr] = useState('2458914562');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async (event) => {
    event.preventDefault();
    if (!/^\d{10}$/.test(pnr)) {
      setError('Enter a valid 10-digit PNR.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const localBooking = bookings.find((booking) => String(booking.pnr) === pnr);
      const data = localBooking || await getPnrStatusApi(pnr);
      if (!data) {
        setError('No booking was found for this PNR.');
        return;
      }
      setResult(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to check this PNR right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <span className="text-3xl">🔍</span>
        <h2 className="text-2xl font-black text-slate-900 mt-2">PNR Status & Live Charting Enquiry</h2>
        <p className="text-xs text-slate-500 mt-1">Get real-time Passenger Reservation System (PRS) status and coach position</p>
      </div>

      <form onSubmit={handleCheck} className="mx-auto max-w-md">
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="pnr-number">10-digit PNR</label>
          <input
            id="pnr-number"
            type="text"
            inputMode="numeric"
            value={pnr}
            onChange={(e) => setPnr(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="Enter 10-Digit PNR"
            maxLength={10}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-center font-mono text-sm outline-none shadow-sm focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-sky-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mx-auto mt-3 max-w-md text-center text-sm font-medium text-rose-700">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-6 bg-slate-50 border rounded-xl p-5 text-xs">
          <div className="flex justify-between items-center border-b pb-3 mb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">PNR Query Result</span>
              <h4 className="text-xl font-black text-sky-800 font-mono">{result.pnr}</h4>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              ● {result.chartStatus || 'CHART NOT PREPARED'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <span className="text-slate-500">Train:</span>
              <div className="font-bold text-slate-900">{result.trainNumber} - {result.trainName}</div>
            </div>
            <div>
              <span className="text-slate-500">Route:</span>
              <div className="font-bold text-slate-900">{result.fromStation} ➔ {result.toStation}</div>
            </div>
            <div>
              <span className="text-slate-500">Date:</span>
              <div className="font-bold text-slate-900">{result.journeyDate}</div>
            </div>
          </div>

          <div className="border-t pt-3">
            <h5 className="font-bold text-slate-700 mb-2">Passengers:</h5>
            <div className="space-y-1.5">
              {result.passengers?.map((p, i) => (
                <div key={i} className="bg-white p-2.5 rounded border flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800">{p.name}</span>
                    <span className="text-slate-400 ml-2">({p.age}/{p.gender?.[0]})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{p.currentStatus || 'CNF'}</span>
                    <span className="font-bold text-sky-800">{p.allocatedCoach || 'C3'}-{p.allocatedBerth || 18}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => onViewTicket(result)}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700"
            >
              View Printable Slip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PnrEnquiry;
