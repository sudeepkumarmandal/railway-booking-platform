import React from 'react';

const Navbar = ({ activeTab, setActiveTab, walletBalance, onAddMoney }) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <button
            type="button"
            aria-label="BharatRail home"
            onClick={() => setActiveTab('book')}
            className="flex shrink-0 items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-orange-500 flex items-center justify-center shadow-md">
              <span className="text-2xl">🚆</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-xl font-black tracking-tight text-white">BharatRail</span>
                <span className="text-xs bg-orange-500 text-white font-bold px-1.5 py-0.5 rounded">MERN</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">भारतीय रेल आरक्षण पोर्टल</p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab('book')}
              aria-current={activeTab === 'book' ? 'page' : undefined}
              className={`px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'book' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <span>🎫</span> <span>Book Ticket</span>
            </button>
            <button
              onClick={() => setActiveTab('pnr')}
              aria-current={activeTab === 'pnr' ? 'page' : undefined}
              className={`px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'pnr' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <span>🔍</span> <span>PNR Status</span>
            </button>
            <button
              onClick={() => setActiveTab('live')}
              aria-current={activeTab === 'live' ? 'page' : undefined}
              className={`px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'live' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <span>📍</span> <span>Live Train Tracking</span>
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              aria-current={activeTab === 'bookings' ? 'page' : undefined}
              className={`px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'bookings' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <span>📑</span> <span>My Bookings</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              aria-current={activeTab === 'dashboard' ? 'page' : undefined}
              className={`px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'dashboard' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <span>📊</span> <span>Dashboard</span>
            </button>
          </nav>

          {/* Wallet & User Pill */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onAddMoney}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 transition-all hover:bg-slate-700"
              title="Click to recharge wallet"
              aria-label={`Recharge Rail Wallet, current balance ₹${walletBalance.toLocaleString('en-IN')}`}
            >
              <span className="text-emerald-400 text-sm">💳</span>
              <div className="hidden min-[380px]:block text-left">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Rail Wallet</div>
                <div className="font-bold text-xs text-emerald-300">₹{walletBalance.toLocaleString('en-IN')}</div>
              </div>
              <span className="text-slate-400 text-xs font-bold pl-1">+</span>
            </button>

            <div className="hidden w-8 h-8 rounded-full border border-sky-500 bg-sky-700 sm:flex items-center justify-center font-bold text-xs text-white">
              RS
            </div>
          </div>

        </div>

        <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto border-t border-slate-800 py-2 md:hidden">
          {[
            ['book', '🎫', 'Book'],
            ['pnr', '🔍', 'PNR'],
            ['live', '📍', 'Live Tracking'],
            ['bookings', '📑', 'Bookings'],
            ['dashboard', '📊', 'Dashboard']
          ].map(([tab, icon, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-current={activeTab === tab ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                activeTab === tab ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
