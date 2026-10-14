import React, { useState } from 'react';
import CoachMap from './CoachMap';

const BookingModal = ({ bookingState, onClose, onProceedToPay }) => {
  const { train, travelClass, journeyDate, quota } = bookingState;

  const [passengers, setPassengers] = useState([
    { name: 'Rahul Sharma', age: '32', gender: 'Male', berthPreference: 'Lower', mealPreference: 'Veg' }
  ]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');

  const classFare = train.classes[travelClass]?.fare || 1500;
  const count = passengers.length;
  const baseFare = classFare * count;
  const discount = appliedCoupon === 'FIRSTRAIL'
    ? 150
    : appliedCoupon === 'VANDEBHARAT'
      ? Math.round(baseFare * 0.10)
      : 0;
  const catering = ['1A', '2A', '3A', 'CC', 'EC'].includes(travelClass) ? (count * 250) : 0;
  const reservationFee = count * 40;
  const superfastFee = count * 45;
  const gst = Math.round(baseFare * 0.05);
  const insurance = count * 0.35;
  const totalPayable = Math.max(0, baseFare + catering + reservationFee + superfastFee + gst + insurance - discount);

  const handleAddPassenger = () => {
    if (passengers.length >= 6) return alert('Maximum 6 passengers allowed');
    setPassengers([...passengers, { name: '', age: '', gender: 'Male', berthPreference: 'Lower', mealPreference: 'Veg' }]);
  };

  const handleRemovePassenger = (idx) => {
    setPassengers(passengers.filter((_, i) => i !== idx));
    setSelectedSeats(seats => seats.slice(0, passengers.length - 1));
  };

  const handlePassengerChange = (idx, field, value) => {
    const updated = [...passengers];
    updated[idx][field] = value;
    setPassengers(updated);
  };

  const handleToggleSeat = (seatNum) => {
    if (selectedSeats.includes(seatNum)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
    } else {
      if (selectedSeats.length >= passengers.length) {
        setSelectedSeats([...selectedSeats.slice(1), seatNum]);
      } else {
        setSelectedSeats([...selectedSeats, seatNum]);
      }
    }
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'FIRSTRAIL') {
      setAppliedCoupon('FIRSTRAIL');
      alert('Coupon FIRSTRAIL applied! ₹150 discount added.');
    } else if (code === 'VANDEBHARAT') {
      const d = Math.round(baseFare * 0.10);
      setAppliedCoupon('VANDEBHARAT');
      alert(`Coupon VANDEBHARAT applied! ₹${d} discount added.`);
    } else {
      setAppliedCoupon('');
      alert('Invalid coupon code. Try FIRSTRAIL or VANDEBHARAT');
    }
  };

  const handleSubmit = () => {
    const hasInvalidPassenger = passengers.some((p) => {
      const age = Number(p.age);
      return !p.name.trim() || !Number.isInteger(age) || age < 1 || age > 110;
    });
    if (hasInvalidPassenger) {
      alert('Please enter a name and a valid age (1–110) for every passenger.');
      return;
    }

    onProceedToPay({
      ...bookingState,
      passengers,
      selectedSeats,
      appliedCoupon,
      fareBreakdown: {
        baseFare,
        catering,
        reservationCharge: reservationFee,
        superfastCharge: superfastFee,
        gst,
        insurance,
        discount,
        totalFare: totalPayable
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
    <div role="dialog" aria-modal="true" aria-labelledby="booking-modal-title" className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl my-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <div>
            <h3 id="booking-modal-title" className="text-lg font-bold text-slate-900">Passenger Details & Berth Allocation</h3>
            <p className="text-xs text-slate-500">
              {train.trainNumber} - {train.trainName} | Class: <strong>{travelClass}</strong> | Date: {journeyDate}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
        </div>

        {/* Passenger List */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold uppercase text-slate-600">Passengers ({passengers.length}/6)</label>
            <button
              type="button"
              onClick={handleAddPassenger}
              className="text-xs font-bold text-sky-600 hover:text-sky-800"
            >
              + Add Another Passenger
            </button>
          </div>

          <div className="space-y-2">
            {passengers.map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border rounded-lg flex flex-wrap gap-2 items-center text-xs">
                <span className="font-bold text-slate-600 w-6">#{idx + 1}</span>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={p.name}
                  onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                  className="p-2 border rounded font-medium flex-1 min-w-[160px]"
                  required
                />
                <input
                  type="number"
                  placeholder="Age"
                  min="1"
                  max="110"
                  value={p.age}
                  onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                  className="p-2 border rounded w-16"
                  required
                />
                <select
                  value={p.gender}
                  onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                </select>
                <select
                  value={p.berthPreference}
                  onChange={(e) => handlePassengerChange(idx, 'berthPreference', e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="Lower">Lower Berth</option>
                  <option value="Middle">Middle Berth</option>
                  <option value="Upper">Upper Berth</option>
                  <option value="Side Lower">Side Lower</option>
                  <option value="Side Upper">Side Upper</option>
                  <option value="Window">Window</option>
                </select>
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePassenger(idx)}
                    className="text-rose-500 font-bold p-1 hover:bg-rose-50 rounded"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Visual Coach Map */}
        <div className="mb-4">
          <CoachMap
            travelClass={travelClass}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
            maxSeats={passengers.length}
          />
        </div>

        {/* Coupons & Fare Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Promo / Coupon Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. FIRSTRAIL, VANDEBHARAT"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 p-2 border rounded-lg text-xs font-mono uppercase"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
              >
                Apply
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Available: <strong>FIRSTRAIL</strong> (₹150 off), <strong>VANDEBHARAT</strong> (10% off)
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border text-xs space-y-1.5">
            <div className="flex justify-between text-slate-500">
              <span>Base Fare ({count}x ₹{classFare}):</span>
              <span className="font-semibold text-slate-800">₹{baseFare}</span>
            </div>
            {catering > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Catering Charges:</span>
                <span className="font-semibold text-slate-800">₹{catering}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Reservation & Superfast:</span>
              <span className="font-semibold text-slate-800">₹{reservationFee + superfastFee}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST (5%):</span>
              <span className="font-semibold text-slate-800">₹{gst}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Coupon ({appliedCoupon}):</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="border-t pt-1.5 flex justify-between font-bold text-sm text-slate-900">
              <span>Total Payable:</span>
              <span className="text-sky-700">₹{totalPayable}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t pt-4 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md"
          >
            Proceed to Payment ➔
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookingModal;
