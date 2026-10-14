import React from 'react';

const ETicketModal = ({ ticket, onClose }) => {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-6 max-h-[90vh] overflow-y-auto">
        
        {/* Actions Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4 no-print">
          <h3 className="font-bold text-slate-900 text-base">Electronic Reservation Slip (ERS)</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 flex items-center gap-1.5"
            >
              <span>🖨️ Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl font-bold ml-2"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Printable Ticket */}
        <div id="printable-ticket" className="border-4 border-slate-900 rounded-xl p-6 bg-white shadow-lg text-xs">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚆</span>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">BHARAT RAIL (भारत रेल)</h2>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Electronic Reservation Slip (ERS) — IRCTC Authorized
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-bold">PNR NUMBER</div>
              <div className="font-mono text-2xl font-black text-sky-800">{ticket.pnr}</div>
            </div>
          </div>

          {/* Journey Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-100 rounded-lg mb-4 text-xs">
            <div>
              <span className="text-slate-500">Train</span>
              <div className="font-bold text-slate-900">{ticket.trainNumber} / {ticket.trainName}</div>
            </div>
            <div>
              <span className="text-slate-500">Date</span>
              <div className="font-bold text-slate-900">{ticket.journeyDate}</div>
            </div>
            <div>
              <span className="text-slate-500">Class & Quota</span>
              <div className="font-bold text-slate-900">{ticket.travelClass} | {ticket.quota}</div>
            </div>
            <div>
              <span className="text-slate-500">Status</span>
              <div className="font-bold text-emerald-700">{ticket.status}</div>
            </div>
          </div>

          {/* Stations */}
          <div className="grid grid-cols-2 gap-4 border-y py-3 mb-4">
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold">From Station</span>
              <div className="text-base font-bold text-slate-900">{ticket.fromStationName || ticket.fromStation} ({ticket.fromStation})</div>
              <div className="text-xs font-mono text-slate-600">Dep: {ticket.departureTime} hrs</div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">To Station</span>
              <div className="text-base font-bold text-slate-900">{ticket.toStationName || ticket.toStation} ({ticket.toStation})</div>
              <div className="text-xs font-mono text-slate-600">Arr: {ticket.arrivalTime} hrs</div>
            </div>
          </div>

          {/* Passengers */}
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Passenger Information</h4>
            <table className="w-full text-left">
              <thead className="bg-slate-200 text-slate-800 text-xs uppercase font-bold">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Age/Sex</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Coach & Berth</th>
                </tr>
              </thead>
              <tbody>
                {ticket.passengers?.map((p, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 font-mono">{idx + 1}</td>
                    <td className="p-2 font-bold">{p.name}</td>
                    <td className="p-2">{p.age} / {p.gender?.[0]}</td>
                    <td className="p-2"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{p.bookingStatus || 'CNF'}</span></td>
                    <td className="p-2 font-bold text-sky-800">{p.allocatedCoach || 'C3'} - {p.allocatedBerth || 18} ({p.berthType || 'LB'})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer & Barcode */}
          <div className="flex flex-wrap justify-between items-end border-t pt-4">
            <div>
              <div className="font-mono text-xs text-slate-400 tracking-widest mb-1">|||||| | |||||||||| |||||||| ||||||</div>
              <div className="text-[11px] text-slate-500">Helpline: Dial 139 (Indian Railways 24x7)</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Total Fare:</span>
              <div className="text-2xl font-black text-slate-900">₹{ticket.fareBreakdown?.totalFare?.toFixed(2) || '0.00'}</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ETicketModal;
