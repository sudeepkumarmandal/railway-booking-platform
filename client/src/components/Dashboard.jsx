import React from 'react';

const Dashboard = ({ bookings, walletBalance, onAddMoney, onQuickRebook }) => {
  const activeCount = bookings.filter(b => b.status === 'CONFIRMED').length;
  const totalSpent = bookings
    .filter(b => b.status === 'CONFIRMED')
    .reduce((acc, curr) => acc + (curr.fareBreakdown?.totalFare || curr.fare || 0), 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-bold">Total Trips Booked</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{bookings.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Active Rail User</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-bold">Upcoming Journeys</div>
          <div className="text-3xl font-black text-sky-700 mt-1">{activeCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Confirmed status</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-bold">Total Fare Spent</div>
          <div className="text-3xl font-black text-slate-900 mt-1">₹{Math.round(totalSpent).toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">Lifetime booking amount</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-400 uppercase font-bold">Rail Wallet Balance</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">₹{walletBalance.toLocaleString('en-IN')}</div>
          <button onClick={onAddMoney} className="text-[11px] text-sky-600 font-bold hover:underline mt-1 block">
            + Add Funds
          </button>
        </div>

      </div>

      {/* Guidelines & Quick Rebook */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Guidelines */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 mb-3">⚡ Tatkal Timings & Booking Rules</h3>
          <ul className="text-xs space-y-2.5 text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>AC Classes:</strong> Tatkal booking opens at 10:00 AM daily, one day in advance.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Non-AC Classes:</strong> Sleeper/2S Tatkal opens at 11:00 AM daily.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Auto-Refund:</strong> In case ticket remains Waitlisted after chart preparation, 100% fare is refunded.</span>
            </li>
          </ul>
        </div>

        {/* Quick Rebook */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 mb-3">🔄 Favorite Quick Rebook Routes</h3>
          <div className="space-y-3">
            <div
              onClick={() => onQuickRebook('NDLS', 'BSB')}
              className="p-3 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-200 cursor-pointer flex justify-between items-center transition-all"
            >
              <div>
                <div className="font-bold text-xs text-slate-800">New Delhi (NDLS) ➔ Varanasi (BSB)</div>
                <div className="text-[11px] text-slate-500">Vande Bharat Express • 8h 00m</div>
              </div>
              <span className="text-xs font-bold text-sky-600">Book ➔</span>
            </div>

            <div
              onClick={() => onQuickRebook('NDLS', 'MMCT')}
              className="p-3 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-200 cursor-pointer flex justify-between items-center transition-all"
            >
              <div>
                <div className="font-bold text-xs text-slate-800">New Delhi (NDLS) ➔ Mumbai Central (MMCT)</div>
                <div className="text-[11px] text-slate-500">Tejas Rajdhani Express • 15h 40m</div>
              </div>
              <span className="text-xs font-bold text-sky-600">Book ➔</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
