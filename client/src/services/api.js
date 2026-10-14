import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const DEMO_STATIONS = [
  { code: 'NDLS', name: 'New Delhi' },
  { code: 'MMCT', name: 'Mumbai Central' },
  { code: 'HWH', name: 'Howrah Junction' },
  { code: 'BSB', name: 'Varanasi Junction' },
  { code: 'PNBE', name: 'Patna Junction' },
  { code: 'SBC', name: 'KSR Bengaluru' },
  { code: 'JP', name: 'Jaipur Junction' },
  { code: 'MAS', name: 'MGR Chennai Central' },
  { code: 'CNB', name: 'Kanpur Central' },
  { code: 'PRYJ', name: 'Prayagraj Junction' },
  { code: 'KOTA', name: 'Kota Junction' },
  { code: 'BRC', name: 'Vadodara Junction' },
  { code: 'LKO', name: 'Lucknow Charbagh' },
  { code: 'ADI', name: 'Ahmedabad Junction' }
];

// Fallback mock trains if backend MongoDB is not running
export const MOCK_TRAINS = [
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
    classes: {
      'CC': { fare: 1750, availableSeats: 48, status: 'AVAILABLE', confirmationProbability: 100 },
      'EC': { fare: 3300, availableSeats: 12, status: 'AVAILABLE', confirmationProbability: 100 }
    },
    route: [
      { stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '--:--', departureTime: '06:00', haltMinutes: '--', distanceKm: 0, platform: '16' },
      { stationCode: 'CNB', stationName: 'Kanpur Central', arrivalTime: '10:08', departureTime: '10:10', haltMinutes: '2 min', distanceKm: 440, platform: '5' },
      { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', arrivalTime: '12:08', departureTime: '12:10', haltMinutes: '2 min', distanceKm: 635, platform: '6' },
      { stationCode: 'BSB', stationName: 'Varanasi Junction', arrivalTime: '14:00', departureTime: '--:--', haltMinutes: '--', distanceKm: 760, platform: '1' }
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
    classes: {
      '3A': { fare: 2450, availableSeats: 32, status: 'AVAILABLE', confirmationProbability: 100 },
      '2A': { fare: 3680, availableSeats: 14, status: 'AVAILABLE', confirmationProbability: 100 },
      '1A': { fare: 5200, availableSeats: 4, status: 'AVAILABLE', confirmationProbability: 100 }
    },
    route: [
      { stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '--:--', departureTime: '16:55', haltMinutes: '--', distanceKm: 0, platform: '2' },
      { stationCode: 'KOTA', stationName: 'Kota Junction', arrivalTime: '21:30', departureTime: '21:40', haltMinutes: '10 min', distanceKm: 465, platform: '1' },
      { stationCode: 'MMCT', stationName: 'Mumbai Central', arrivalTime: '08:35', departureTime: '--:--', haltMinutes: '--', distanceKm: 1386, platform: '5' }
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
    classes: {
      '3A': { fare: 2580, availableSeats: 18, status: 'AVAILABLE', confirmationProbability: 100 },
      '2A': { fare: 3890, availableSeats: 6, status: 'AVAILABLE', confirmationProbability: 100 },
      '1A': { fare: 5450, availableSeats: 0, status: 'WL 4', confirmationProbability: 65 }
    },
    route: [
      { stationCode: 'NDLS', stationName: 'New Delhi', arrivalTime: '--:--', departureTime: '16:50', haltMinutes: '--', distanceKm: 0, platform: '5' },
      { stationCode: 'CNB', stationName: 'Kanpur Central', arrivalTime: '21:32', departureTime: '21:37', haltMinutes: '5 min', distanceKm: 440, platform: '4' },
      { stationCode: 'HWH', stationName: 'Howrah Junction', arrivalTime: '09:55', departureTime: '--:--', haltMinutes: '--', distanceKm: 1450, platform: '9' }
    ]
  }
];

const getMockSearchResults = (from, to, travelClass) => MOCK_TRAINS.filter((train) => (
  train.route.findIndex((stop) => stop.stationCode === from) !== -1 &&
  train.route.findIndex((stop) => stop.stationCode === to) > train.route.findIndex((stop) => stop.stationCode === from) &&
  (!travelClass || travelClass === 'ALL' || train.classes[travelClass])
)).map((train) => getTrainSegment(train, from, to));

const getTrainSegment = (train, from, to) => {
  const route = train.route || [];
  const fromIndex = route.findIndex((stop) => stop.stationCode === from);
  const toIndex = route.findIndex((stop) => stop.stationCode === to);
  if (fromIndex < 0 || toIndex <= fromIndex) return train;

  const segment = route.slice(fromIndex, toIndex + 1);
  const origin = segment[0];
  const destination = segment[segment.length - 1];
  const startDay = origin.dayCount || 1;
  const endDay = destination.dayCount || startDay;
  const toMinutes = (time) => {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const departureMinutes = toMinutes(origin.departureTime);
  const arrivalMinutes = toMinutes(destination.arrivalTime);
  let elapsedMinutes = departureMinutes === null || arrivalMinutes === null
    ? null
    : ((endDay - startDay) * 1440) + arrivalMinutes - departureMinutes;
  if (elapsedMinutes !== null && elapsedMinutes < 0 && endDay === startDay) {
    elapsedMinutes += 1440;
  }
  const duration = elapsedMinutes === null || elapsedMinutes < 0
    ? train.duration
    : `${Math.floor(elapsedMinutes / 60)}h ${String(elapsedMinutes % 60).padStart(2, '0')}m`;

  return {
    ...train,
    sourceStation: { code: origin.stationCode, name: origin.stationName },
    destinationStation: { code: destination.stationCode, name: destination.stationName },
    departureTime: origin.departureTime,
    arrivalTime: destination.arrivalTime,
    totalDistanceKm: Math.max(0, (destination.distanceKm || 0) - (origin.distanceKm || 0)),
    duration,
    route: segment
  };
};

export const getStationsApi = async () => {
  try {
    const res = await apiClient.get('/trains/stations/all');
    if (!Array.isArray(res.data?.data)) {
      throw new Error('The station list response was invalid.');
    }

    const stations = [...res.data.data, ...DEMO_STATIONS];
    const uniqueStations = new Map();
    stations.forEach((station) => {
      if (station?.code && station?.name) {
        const code = station.code.toUpperCase();
        if (!uniqueStations.has(code)) uniqueStations.set(code, { code, name: station.name });
      }
    });
    return [...uniqueStations.values()].sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    if (err.response) throw err;
    console.warn('Backend unavailable, using the demo station list:', err.message);
    return DEMO_STATIONS;
  }
};

export const searchTrainsApi = async (from, to, date, travelClass) => {
  let res;
  try {
    res = await apiClient.get('/trains/search', { params: { from, to, date, travelClass } });
  } catch (err) {
    if (err.response) throw err;
    console.warn('Backend unavailable, using fallback search data:', err.message);
    return getMockSearchResults(from, to, travelClass);
  }

  if (!Array.isArray(res.data?.data)) {
    throw new Error('The train search response was invalid.');
  }
  if (res.data.data.length > 0) {
    return res.data.data.map((train) => getTrainSegment(train, from, to));
  }

  if (res.data.totalActiveTrains === 0) {
    console.info('No trains are seeded in the backend; using matching demo trains.');
    return getMockSearchResults(from, to, travelClass);
  }
  return [];
};

const getDemoTrackingTrain = (trainNumber) => MOCK_TRAINS.find((train) => train.trainNumber === trainNumber);

const getDemoTrackingStatus = (train) => ({
  trainNumber: train.trainNumber,
  trainName: train.trainName,
  mode: 'demo',
  runningStatus: 'Sample timetable only — live running status is unavailable',
  currentStation: null,
  currentStationCode: null,
  nextStation: null,
  delayMinutes: null,
  delayText: 'Not reported',
  lastUpdated: null,
  refreshAfterSeconds: null,
  location: null,
  timeline: train.route.map((stop) => ({
    stationCode: stop.stationCode,
    stationName: stop.stationName,
    scheduledArrival: stop.arrivalTime,
    scheduledDeparture: stop.departureTime,
    estimatedArrival: null,
    delayMinutes: null,
    status: 'Scheduled timetable'
  }))
});

export const searchTrackingTrainsApi = async (query) => {
  const res = await apiClient.get('/trains/tracking/search', { params: { query } });
  if (!res.data?.success || !Array.isArray(res.data.data)) {
    throw new Error(res.data?.message || 'The train tracking search response was invalid.');
  }

  const results = res.data.data;
  if (res.data.totalActiveTrains === 0 || results.length === 0) {
    const normalizedQuery = query.trim().toLowerCase();
    const demoResults = MOCK_TRAINS.filter((train) =>
      train.trainNumber.toLowerCase().includes(normalizedQuery) ||
      train.trainName.toLowerCase().includes(normalizedQuery)
    );
    return [...results, ...demoResults.filter((demo) =>
      !results.some((train) => train.trainNumber === demo.trainNumber)
    )];
  }
  return results;
};

export const getTrackingStatusApi = async (trainNumber, date) => {
  try {
    const res = await apiClient.get(`/trains/${encodeURIComponent(trainNumber)}/status`, { params: { date } });
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || 'The train status response was invalid.');
    }
    return res.data.data;
  } catch (err) {
    const isDemoTrainMissingFromBackend = err.response?.status === 404 &&
      err.response.data?.code === 'TRAIN_NOT_IN_CATALOG';
    const backendUnavailable = !err.response;
    const demoTrain = getDemoTrackingTrain(trainNumber);
    if ((isDemoTrainMissingFromBackend || backendUnavailable) && demoTrain) {
      return getDemoTrackingStatus(demoTrain);
    }
    throw err;
  }
};

export const getTrackingRouteApi = async (trainNumber) => {
  try {
    const res = await apiClient.get(`/trains/${encodeURIComponent(trainNumber)}/route`);
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || 'The train route response was invalid.');
    }
    return res.data.data;
  } catch (err) {
    const isDemoTrainMissingFromBackend = err.response?.status === 404 &&
      err.response.data?.code === 'TRAIN_NOT_IN_CATALOG';
    const backendUnavailable = !err.response;
    const demoTrain = getDemoTrackingTrain(trainNumber);
    if ((isDemoTrainMissingFromBackend || backendUnavailable) && demoTrain) {
      return {
        trainNumber: demoTrain.trainNumber,
        trainName: demoTrain.trainName,
        mode: 'demo',
        stops: demoTrain.route.map((stop) => ({
          stationCode: stop.stationCode,
          stationName: stop.stationName,
          arrivalTime: stop.arrivalTime,
          departureTime: stop.departureTime
        }))
      };
    }
    throw err;
  }
};

export const getLiveTrainStatusApi = async (trainNumber) => {
  const status = await getTrackingStatusApi(trainNumber);
  return { ...status, isDemo: status.mode !== 'live' };
};

export const createBookingApi = async (payload) => {
  let res;
  try {
    res = await apiClient.post('/bookings/create', payload);
  } catch (err) {
    const isUnseededDemoUser = err.response?.status === 404 &&
      /user not found/i.test(err.response.data?.message || '');
    if (err.response && !isUnseededDemoUser) throw err;
    console.warn('Backend unavailable, simulating booking client-side');
    return createDemoBooking(payload);
  }

  if (!res.data?.success || !res.data?.data) {
    throw new Error(res.data?.message || 'The booking could not be completed.');
  }
  return res.data;
};

const createDemoBooking = (payload) => {
  const coachCode = ['CC', 'EC'].includes(payload.travelClass) ? 'C3' : 'B3';
  const passengersWithBerths = (payload.passengers || []).map((p, i) => ({
    ...p,
    allocatedCoach: coachCode,
    allocatedBerth: (payload.selectedSeats && payload.selectedSeats[i]) || (14 + i * 2),
    berthType: p.berthPreference || 'LB',
    bookingStatus: 'CNF',
    currentStatus: 'CNF'
  }));

  return {
    success: true,
    data: {
      pnr: '245' + Math.floor(1000000 + Math.random() * 9000000),
      ...payload,
      passengers: passengersWithBerths,
      status: 'CONFIRMED',
      chartStatus: 'CHART NOT PREPARED'
    }
  };
};

export const getPnrStatusApi = async (pnr) => {
  try {
    const res = await apiClient.get(`/bookings/pnr/${pnr}`);
    return res.data.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const cancelBookingApi = async (pnr) => {
  try {
    const res = await apiClient.post(`/bookings/cancel/${pnr}`);
    return res.data;
  } catch (err) {
    const isNotStoredOnBackend = err.response?.status === 404 &&
      /booking not found/i.test(err.response.data?.message || '');
    if (err.response && !isNotStoredOnBackend) throw err;
    return { success: true, message: `Cancelled PNR ${pnr}` };
  }
};

export default apiClient;
