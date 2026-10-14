const mongoose = require('mongoose');

const routeStopSchema = new mongoose.Schema({
  stationCode: { type: String, required: true, uppercase: true },
  stationName: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  departureTime: { type: String, required: true },
  haltMinutes: { type: String, default: '2 min' },
  distanceKm: { type: Number, required: true },
  dayCount: { type: Number, default: 1 },
  platform: { type: String, default: '1' }
});

const classSchema = new mongoose.Schema({
  fare: { type: Number, required: true },
  totalSeats: { type: Number, default: 72 },
  availableSeats: { type: Number, default: 40 },
  status: { type: String, default: 'AVAILABLE' }, // AVAILABLE, RAC, WL
  confirmationProbability: { type: Number, default: 100 }
});

const trainSchema = new mongoose.Schema({
  trainNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  trainName: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Vande Bharat', 'Rajdhani', 'Shatabdi', 'Duronto', 'Tejas', 'Superfast', 'Express'],
    default: 'Superfast'
  },
  sourceStation: {
    code: { type: String, required: true, uppercase: true },
    name: { type: String, required: true }
  },
  destinationStation: {
    code: { type: String, required: true, uppercase: true },
    name: { type: String, required: true }
  },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  duration: { type: String, required: true },
  totalDistanceKm: { type: Number, required: true },
  runningDays: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
  classes: {
    '1A': classSchema,
    '2A': classSchema,
    '3A': classSchema,
    '3E': classSchema,
    'CC': classSchema,
    'EC': classSchema,
    'SL': classSchema,
    '2S': classSchema
  },
  route: [routeStopSchema],
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Train', trainSchema);
