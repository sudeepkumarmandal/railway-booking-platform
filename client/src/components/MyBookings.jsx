import React, { useState } from 'react';

const MyBookings = ({ bookings, onCancelTicket, onViewTicket }) => {
  const [filter, setFilter] = useState('ALL');
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const filtered = bookings.filter(b => {
    if (filter === 'CONFIRMED') return b.status === 'CONFIRMED';
    if (filter === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  const handleOpenCancel = (b) => {
    const total = b.fareBreakdown?.totalFare || b.fare || 1500;
    const base = b.fareBreakdown?.baseFare || total * 0.8;
    const clerkage = (b.passengers?.length || 1) * 180;
    const deduction = Math.max(clerkage, Math.round(base * 0.25));
    const refund = Math.max(0, total - deduction);

    setCancelModal({
      booking: b,
      total,
      deduction,
      refund
    });
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    setCancelError('');
    try {
      await onCancelTicket(cancelModal.booking.pnr, cancelModal.refund);
      setCancelModal(null);
    } catch (error) {
      setCancelError(error.message || 'Cancellation failed. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">My Train Bookings</h2>
          <p className="text-xs text-slate-500">Manage all your upcoming, completed, and cancelled journeys</p>
        </div>
        <div className="flex gap-2">
          {['ALL', 'CONFIRMED', 'CANCELLED'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === type ? 'bg-sky-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <div className="text-3xl mb-2">🎫</div>
            <h4 className="font-bold text-slate-800">No Bookings Found</h4>
            <p className="text-xs text-slate-500 mt-1">Book your next journey from the search tab!</p>
          </div>
        ) : (
          filtered.map(b => {
            const isCancelled = b.status === 'CANCELLED';
            return (
              <div
                key={b.pnr}
                className={`p-5 bg-white border rounded-xl shadow-sm transition-all ${
                  isCancelled ? 'opacity-65 bg-slate-50' : 'hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-center border-b pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-800">PNR: {b.pnr}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCancelled ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Class: {b.travelClass}</span>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{b.trainNumber} - {b.trainName}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {b.fromStationName || b.fromStation} ➔ {b.toStationName || b.toStation} | Date: {b.journeyDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900">
                      ₹{b.fareBreakdown?.totalFare?.toFixed(2) || b.fare}
                    </div>
                    <div className="text-[10px] text-slate-400">{b.passengers?.length || 1} Passenger(s)</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                  <button
                    onClick={() => onViewTicket(b)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-50"
                  >
                    View E-Ticket
                  </button>
                  {!isCancelled && (
                    <button
                      onClick={() => handleOpenCancel(b)}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                    >
                      Cancel Ticket
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cancellation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="cancel-ticket-title" className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 id="cancel-ticket-title" className="font-bold text-base text-slate-900 mb-2">Cancel Ticket & Refund Calculation</h3>
            <p className="text-xs text-rose-600 mb-4">
              Cancelling PNR <strong>{cancelModal.booking.pnr}</strong> ({cancelModal.booking.trainName})
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Total Ticket Fare:</span>
                <span className="font-bold">₹{cancelModal.total}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>IRCTC Cancellation Charges (25%):</span>
                <span className="font-bold">-₹{cancelModal.deduction}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-emerald-700 text-sm">
                <span>Refund Amount to Wallet:</span>
                <span>₹{cancelModal.refund}</span>
              </div>
            </div>

            {cancelError && (
              <p role="alert" className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {cancelError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setCancelModal(null);
                  setCancelError('');
                }}
                disabled={isCancelling}
                className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Keep Ticket
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
              >
                {isCancelling ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
