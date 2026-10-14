const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Train = require('./models/Train');
const Station = require('./models/Station');
const User = require('./models/User');

dotenv.config();

const SEED_STATIONS = [
  { code: 'NDLS', name: 'New Delhi', city: 'Delhi', state: 'Delhi' },
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra' },
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal' },
  { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai', state: 'Tamil Nadu' },
  { code: 'SBC', name: 'KSR Bengaluru', city: 'Bengaluru', state: 'Karnataka' },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna', state: 'Bihar' },
  { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat' },
  { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur', state: 'Rajasthan' },
  { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', state: 'Uttar Pradesh' },
  { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh' },
  { code: 'LKO', name: 'Lucknow Charbagh', city: 'Lucknow', state: 'Uttar Pradesh' }
];

const SEED_TRAINS = [
  {
    trainNumber: '22436',
    trainName: 'Vande Bharat Express',
    type: 'Vande Bharat',
    sourceStation: { code: 'NDLS', name: 'New Delhi' },
    destinationStation: { code: 'BSB', name: 'Varanasi Junction' },
    departureTime: '06:00',
    arrivalTime: '14:00',
    duration: '8h 00m',
    totalDistanceKm: 760,
    runningDays: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'],
    classes: {
      'CC': { fare: 1750, totalSeats: 78, availableSeats: 48, status: 'AVAILABLE', confirmationProbability: 100 },
      'EC': { fare: 3300, totalSeats: 20, availableSeats: 12, status: 'AVAILABLE', confirmationProbability: 100 }
    },
    route: [
      { stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '--:--', departureTime: '06:00', haltMinutes: '--', distanceKm: 0, dayCount: 1, platform: '16' },
      { stationCode: 'CNB', stationName: 'Kanpur Central', arrivalTime: '10:08', departureTime: '10:10', haltMinutes: '2 min', distanceKm: 440, dayCount: 1, platform: '5' },
      { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', arrivalTime: '12:08', departureTime: '12:10', haltMinutes: '2 min', distanceKm: 635, dayCount: 1, platform: '6' },
      { stationCode: 'BSB', stationName: 'Varanasi Junction', arrivalTime: '14:00', departureTime: '--:--', haltMinutes: '--', distanceKm: 760, dayCount: 1, platform: '1' }
    ]
  },
  {
    trainNumber: '12952',
    trainName: 'Mumbai Tejas Rajdhani',
    type: 'Rajdhani',
    sourceStation: { code: 'NDLS', name: 'New Delhi' },
    destinationStation: { code: 'MMCT', name: 'Mumbai Central' },
    departureTime: '16:55',
    arrivalTime: '08:35',
    duration: '15h 40m',
    totalDistanceKm: 1386,
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    classes: {
      '3A': { fare: 2450, totalSeats: 64, availableSeats: 32, status: 'AVAILABLE', confirmationProbability: 100 },
      '2A': { fare: 3680, totalSeats: 32, availableSeats: 14, status: 'AVAILABLE', confirmationProbability: 100 },
      '1A': { fare: 5200, totalSeats: 10, availableSeats: 4, status: 'AVAILABLE', confirmationProbability: 100 }
    },
    route: [
      { stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '--:--', departureTime: '16:55', haltMinutes: '--', distanceKm: 0, dayCount: 1, platform: '2' },
      { stationCode: 'KOTA', stationName: 'Kota Junction', arrivalTime: '21:30', departureTime: '21:40', haltMinutes: '10 min', distanceKm: 465, dayCount: 1, platform: '1' },
      { stationCode: 'BRC', stationName: 'Vadodara Junction', arrivalTime: '03:40', departureTime: '03:50', haltMinutes: '10 min', distanceKm: 992, dayCount: 2, platform: '3' },
      { stationCode: 'MMCT', stationName: 'Mumbai Central', arrivalTime: '08:35', departureTime: '--:--', haltMinutes: '--', distanceKm: 1386, dayCount: 2, platform: '5' }
    ]
  },
  {
    trainNumber: '12302',
    trainName: 'Howrah Kolkata Rajdhani',
    type: 'Rajdhani',
    sourceStation: { code: 'NDLS', name: 'New Delhi' },
    destinationStation: { code: 'HWH', name: 'Howrah Junction' },
    departureTime: '16:50',
    arrivalTime: '09:55',
    duration: '17h 05m',
    totalDistanceKm: 1450,
    runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Sat', 'Sun'],
    classes: {
      '3A': { fare: 2580, totalSeats: 64, availableSeats: 18, status: 'AVAILABLE', confirmationProbability: 100 },
      '2A': { fare: 3890, totalSeats: 32, availableSeats: 6, status: 'AVAILABLE', confirmationProbability: 100 },
      '1A': { fare: 5450, totalSeats: 10, availableSeats: 0, status: 'WL 4', confirmationProbability: 65 }
    },
    route: [
      { stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '--:--', departureTime: '16:50', haltMinutes: '--', distanceKm: 0, dayCount: 1, platform: '5' },
      { stationCode: 'CNB', stationName: 'Kanpur Central', arrivalTime: '21:32', departureTime: '21:37', haltMinutes: '5 min', distanceKm: 440, dayCount: 1, platform: '4' },
      { stationCode: 'HWH', stationName: 'Howrah Junction', arrivalTime: '09:55', departureTime: '--:--', haltMinutes: '--', distanceKm: 1450, dayCount: 2, platform: '9' }
    ]
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bharatrail');
    console.log('🌱 Connected to MongoDB for seeding...');

    // Clear old data
    await Station.deleteMany({});
    await Train.deleteMany({});
    await User.deleteMany({});

    // Seed Stations & Trains
    await Station.insertMany(SEED_STATIONS);
    await Train.insertMany(SEED_TRAINS);

    // Create Test User
    const user = new User({
      name: 'Rahul Sharma',
      email: 'traveler@bharatrail.in',
      phone: '9876543210',
      password: 'password123',
      walletBalance: 5000
    });
    await user.save();

    console.log('✅ Database seeded successfully with Stations, Trains, and Demo User (email: traveler@bharatrail.in, pass: password123)');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
