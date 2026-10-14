const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Transgender'], required: true },
  berthPreference: { type: String, default: 'Lower' },
  mealPreference: { type: String, default: 'Veg' },
  allocatedCoach: { type: String, default: 'B3' },
  allocatedBerth: { type: Number, default: 21 },
  berthType: { type: String, default: 'LB' },
  bookingStatus: { type: String, default: 'CNF' }, // CNF, RAC, WL
  currentStatus: { type: String, default: 'CNF' }
});

const bookingSchema = new mongoose.Schema({
  pnr: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Train',
    required: true
  },
  trainNumber: { type: String, required: true },
  trainName: { type: String, required: true },
  fromStation: { type: String, required: true },
  fromStationName: { type: String, required: true },
  toStation: { type: String, required: true },
  toStationName: { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  journeyDate: { type: String, required: true },
  travelClass: { type: String, required: true },
  quota: { type: String, default: 'General (GN)' },
  passengers: [passengerSchema],
  fareBreakdown: {
    baseFare: { type: Number, required: true },
    catering: { type: Number, default: 0 },
    reservationCharge: { type: Number, default: 40 },
    superfastCharge: { type: Number, default: 45 },
    gst: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalFare: { type: Number, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ['WALLET', 'UPI', 'CARD', 'NETBANKING'],
    default: 'WALLET'
  },
  status: {
    type: String,
    enum: ['CONFIRMED', 'RAC', 'WAITLISTED', 'CANCELLED'],
    default: 'CONFIRMED'
  },
  chartStatus: {
    type: String,
    enum: ['CHART NOT PREPARED', 'CHART PREPARED'],
    default: 'CHART NOT PREPARED'
  },
  cancellationDetails: {
    cancelledAt: { type: Date },
    cancellationFee: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    refundStatus: { type: String, default: 'PENDING' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
