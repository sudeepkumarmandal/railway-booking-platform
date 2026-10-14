import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TrainSearch from './components/TrainSearch';
import TrainCard from './components/TrainCard';
import BookingModal from './components/BookingModal';
import PaymentModal from './components/PaymentModal';
import ETicketModal from './components/ETicketModal';
import PnrEnquiry from './components/PnrEnquiry';
import LiveTrainTracker from './components/LiveTrainTracker';
import MyBookings from './components/MyBookings';
import Dashboard from './components/Dashboard';
import { searchTrainsApi, createBookingApi, cancelBookingApi, getStationsApi, DEMO_STATIONS, MOCK_TRAINS } from './services/api';

const DEFAULT_BOOKINGS = [
  {
    pnr: '2458914562',
    trainNumber: '22436',
    trainName: 'Vande Bharat Express',
    fromStation: 'NDLS',
    fromStationName: 'New Delhi',
    toStation: 'BSB',
    toStationName: 'Varanasi Junction',
    departureTime: '06:00',
    arrivalTime: '14:00',
    journeyDate: '2026-10-18',
    travelClass: 'CC',
    quota: 'General (GN)',
    status: 'CONFIRMED',
    chartStatus: 'CHART NOT PREPARED',
    passengers: [
      { name: 'Rahul Sharma', age: 32, gender: 'Male', allocatedCoach: 'C3', allocatedBerth: 42, berthType: 'Window', bookingStatus: 'CNF', currentStatus: 'CNF' }
    ],
    fareBreakdown: { totalFare: 1840, baseFare: 1750 }
  }
];

const getSuggestedJourneyDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 4);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getStoredWalletBalance = () => {
  const storedBalance = Number.parseFloat(localStorage.getItem('bharatrail_mern_wallet') || '5000');
  return Number.isFinite(storedBalance) && storedBalance >= 0 ? storedBalance : 5000;
};

const getStoredBookings = () => {
  try {
    const storedBookings = localStorage.getItem('bharatrail_mern_bookings');
    if (!storedBookings) return DEFAULT_BOOKINGS;
    const parsedBookings = JSON.parse(storedBookings);
    return Array.isArray(parsedBookings) ? parsedBookings : DEFAULT_BOOKINGS;
  } catch (error) {
    console.warn('Saved bookings could not be read; loading the demo booking instead.', error);
    return DEFAULT_BOOKINGS;
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('book');
  const [walletBalance, setWalletBalance] = useState(getStoredWalletBalance);
  const [bookings, setBookings] = useState(getStoredBookings);

  const [trains, setTrains] = useState(() => MOCK_TRAINS.filter(
    train => train.sourceStation.code === 'NDLS' && train.destinationStation.code === 'BSB'
  ));
  const [stations, setStations] = useState(DEMO_STATIONS);
  const [searchSummary, setSearchSummary] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Modals state
  const [activeBookingState, setActiveBookingState] = useState(null);
  const [pendingPaymentPayload, setPendingPaymentPayload] = useState(null);
  const [activeETicket, setActiveETicket] = useState(null);

  useEffect(() => {
    localStorage.setItem('bharatrail_mern_wallet', walletBalance.toString());
    localStorage.setItem('bharatrail_mern_bookings', JSON.stringify(bookings));
  }, [walletBalance, bookings]);

  useEffect(() => {
    let isCurrent = true;
    getStationsApi()
      .then((availableStations) => {
        if (isCurrent) setStations(availableStations);
      })
      .catch((error) => {
        console.error('Could not load railway stations:', error);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const handleSearch = async (params) => {
    setSearchSummary(params);
    setIsSearching(true);
    setSearchError('');
    try {
      const results = await searchTrainsApi(params.from, params.to, params.date, params.travelClass);
      setTrains(results);
    } catch (error) {
      setTrains([]);
      setSearchError(error.response?.data?.message || error.message || 'Train search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectClass = (train, cls) => {
    setActiveBookingState({
      train,
      travelClass: cls,
      journeyDate: searchSummary?.date || getSuggestedJourneyDate(),
      quota: searchSummary?.quota || 'General (GN)'
    });
  };

  const handleProceedToPayment = (payload) => {
    setActiveBookingState(null);
    setPendingPaymentPayload(payload);
  };

  const handlePaymentSuccess = async (method) => {
    const payload = pendingPaymentPayload;
    const total = payload.fareBreakdown.totalFare;

    const res = await createBookingApi({
      userId: '661bc1234567890abcdef123',
      trainNumber: payload.train.trainNumber,
      trainName: payload.train.trainName,
      fromStation: payload.train.sourceStation?.code || 'NDLS',
      fromStationName: payload.train.sourceStation?.name || 'New Delhi',
      toStation: payload.train.destinationStation?.code || 'BSB',
      toStationName: payload.train.destinationStation?.name || 'Varanasi Junction',
      departureTime: payload.train.departureTime || '06:00',
      arrivalTime: payload.train.arrivalTime || '14:00',
      travelClass: payload.travelClass,
      quota: payload.quota,
      journeyDate: payload.journeyDate,
      passengers: payload.passengers,
      selectedSeats: payload.selectedSeats,
      paymentMethod: method,
      appliedCoupon: payload.appliedCoupon,
      fareBreakdown: payload.fareBreakdown
    });

    const newTicket = res.data;
    if (method === 'WALLET') {
      setWalletBalance(prev => Math.max(0, prev - total));
    }
    setBookings(prev => [newTicket, ...prev]);
    setPendingPaymentPayload(null);
    setActiveETicket(newTicket);
  };

  const handleCancelTicket = async (pnr, refundAmount) => {
    const result = await cancelBookingApi(pnr);
    const refund = result.data?.cancellationDetails?.refundAmount ?? refundAmount;
    setBookings(prev => prev.map(b => b.pnr === pnr ? { ...b, status: 'CANCELLED' } : b));
    setWalletBalance(prev => prev + refund);
    alert(`Ticket ${pnr} has been cancelled! ₹${refund} refunded to your Rail Wallet.`);
  };

  const handleAddMoney = () => {
    const amt = prompt('Enter amount to add to Rail Wallet (₹):', '2000');
    const num = parseFloat(amt);
    if (!isNaN(num) && num > 0) {
      setWalletBalance(prev => prev + num);
      alert(`₹${num} added to your wallet!`);
    }
  };

  const handleQuickRebook = (from, to) => {
    setActiveTab('book');
    handleSearch({ from, to, date: getSuggestedJourneyDate(), travelClass: 'ALL', quota: 'General (GN)' });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        walletBalance={walletBalance}
        onAddMoney={handleAddMoney}
      />

      {/* Alert Banner */}
      <div className="bg-indigo-950 text-indigo-200 py-2 px-4 text-xs border-b border-indigo-900 text-center">
        ⚡ Local train catalog • Demo schedules, availability, bookings, and payments are simulated.
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* TAB 1: BOOKING */}
        {activeTab === 'book' && (
          <div className="space-y-6">
            <TrainSearch stations={stations} onSearch={handleSearch} />

            {searchSummary && (
              <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-xl shadow">
                <div className="text-xs">
                  <strong>{searchSummary.from} ➔ {searchSummary.to}</strong> | Date: {searchSummary.date} | Quota: {searchSummary.quota}
                </div>
                <div className="text-xs text-sky-400 font-bold">
                  {trains.length} Trains Found
                </div>
              </div>
            )}

            {searchError && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {searchError}
              </div>
            )}

            <div>
              {isSearching ? (
                <div role="status" className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm font-semibold text-slate-500">
                  Searching trains…
                </div>
              ) : trains.length > 0 ? (
                trains.map(train => (
                  <TrainCard
                    key={train.trainNumber}
                    train={train}
                    onSelectClass={handleSelectClass}
                    onViewRoute={(t) => alert(`Train: ${t.trainNumber} stops at: ${t.route.map(r => r.stationName).join(' ➔ ')}`)}
                  />
                ))
              ) : searchSummary ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
                  <div className="mb-2 text-3xl" aria-hidden="true">🚆</div>
                  <h3 className="font-bold text-slate-900">No trains found for this route</h3>
                  <p className="mt-1 text-sm text-slate-500">Try another station pair or choose one of the popular routes.</p>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB 2: PNR ENQUIRY */}
        {activeTab === 'pnr' && (
          <PnrEnquiry
            bookings={bookings}
            onViewTicket={(ticket) => setActiveETicket(ticket)}
          />
        )}

        {/* TAB 3: LIVE GPS TRACKER */}
        {activeTab === 'live' && (
          <LiveTrainTracker />
        )}

        {/* TAB 4: MY BOOKINGS */}
        {activeTab === 'bookings' && (
          <MyBookings
            bookings={bookings}
            onCancelTicket={handleCancelTicket}
            onViewTicket={(ticket) => setActiveETicket(ticket)}
          />
        )}

        {/* TAB 5: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <Dashboard
            bookings={bookings}
            walletBalance={walletBalance}
            onAddMoney={handleAddMoney}
            onQuickRebook={handleQuickRebook}
          />
        )}

      </main>

      {/* MODALS */}
      {activeBookingState && (
        <BookingModal
          bookingState={activeBookingState}
          onClose={() => setActiveBookingState(null)}
          onProceedToPay={handleProceedToPayment}
        />
      )}

      {pendingPaymentPayload && (
        <PaymentModal
          bookingPayload={pendingPaymentPayload}
          walletBalance={walletBalance}
          onClose={() => setPendingPaymentPayload(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {activeETicket && (
        <ETicketModal
          ticket={activeETicket}
          onClose={() => setActiveETicket(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 text-center">
        © 2026 BharatRail MERN Platform. Indian Railways NextGen Booking Architecture. Helpline: 139
      </footer>

    </div>
  );
}

export default App;
