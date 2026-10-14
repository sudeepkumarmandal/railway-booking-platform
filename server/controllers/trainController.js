const Train = require('../models/Train');
const Station = require('../models/Station');
const {
  getProviderSearchResults,
  getProviderStatus,
  isProviderEnabled,
  ProviderError
} = require('../services/trainTrackingService');

// @desc    Search trains between two stations
// @route   GET /api/trains/search
exports.searchTrains = async (req, res) => {
  try {
    const { from, to, date, travelClass } = req.query;

    if (!from || !to) {
      return res.status(400).json({ success: false, message: 'Source and destination stations required' });
    }

    // Find trains that cover both stations in correct sequence
    const trains = await Train.find({ active: true });

    let weekday;
    if (date) {
      const journeyDate = new Date(`${date}T12:00:00`);
      if (Number.isNaN(journeyDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid journey date' });
      }
      weekday = journeyDate.toLocaleDateString('en-US', { weekday: 'short' });
    }

    const matchedTrains = trains.reduce((matched, train) => {
      const fromIdx = train.route.findIndex(r => r.stationCode === from.toUpperCase());
      const toIdx = train.route.findIndex(r => r.stationCode === to.toUpperCase());
      const runsOnDate = !weekday || !train.runningDays?.length || train.runningDays.includes(weekday);
      const hasClass = !travelClass || travelClass === 'ALL' || Boolean(train.classes?.[travelClass]);

      if (fromIdx === -1 || toIdx <= fromIdx || !runsOnDate || !hasClass) return matched;

      const route = train.route.slice(fromIdx, toIdx + 1);
      const origin = route[0];
      const destination = route[route.length - 1];
      const trainData = train.toObject();
      matched.push({
        ...trainData,
        sourceStation: { code: origin.stationCode, name: origin.stationName },
        destinationStation: { code: destination.stationCode, name: destination.stationName },
        departureTime: origin.departureTime,
        arrivalTime: destination.arrivalTime,
        totalDistanceKm: Math.max(0, destination.distanceKm - origin.distanceKm),
        route
      });
      return matched;
    }, []);

    res.status(200).json({
      success: true,
      count: matchedTrains.length,
      totalActiveTrains: trains.length,
      data: matchedTrains
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get train route and timetable by train number
// @route   GET /api/trains/:trainNumber
exports.getTrainByNumber = async (req, res) => {
  try {
    const train = await Train.findOne({ trainNumber: req.params.trainNumber });
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }
    res.status(200).json({ success: true, data: train });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all available railway stations
// @route   GET /api/trains/stations/all
exports.getAllStations = async (req, res) => {
  try {
    const [storedStations, activeTrains] = await Promise.all([
      Station.find().lean(),
      Train.find({ active: true })
        .select('route sourceStation destinationStation')
        .lean()
    ]);
    const stationsByCode = new Map();
    storedStations.forEach(station => {
      stationsByCode.set(station.code, station);
    });
    activeTrains.forEach(train => {
      const routeStations = (train.route || []).map(stop => ({
        code: stop.stationCode,
        name: stop.stationName
      }));
      routeStations.push(train.sourceStation, train.destinationStation);
      routeStations.forEach(station => {
        if (station?.code && station?.name && !stationsByCode.has(station.code)) {
          stationsByCode.set(station.code, {
            code: station.code,
            name: station.name,
            city: station.name,
            state: '',
            junction: true
          });
        }
      });
    });
    const stations = [...stationsByCode.values()].sort((a, b) => a.name.localeCompare(b.name));
    res.status(200).json({ success: true, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const isValidJourneyDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const findActiveTrain = (trainNumber) => Train.findOne({
  trainNumber,
  active: true
}).lean();

// @route   GET /api/trains/tracking/search?query=...
exports.searchTrackingTrains = async (req, res) => {
  try {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    if (query.length < 1 || query.length > 80) {
      return res.status(400).json({ success: false, message: 'Search query must be between 1 and 80 characters.' });
    }
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const trains = await Train.find({
      active: true,
      $or: [
        { trainNumber: { $regex: escapedQuery, $options: 'i' } },
        { trainName: { $regex: escapedQuery, $options: 'i' } }
      ]
    })
      .select('trainNumber trainName sourceStation destinationStation departureTime arrivalTime route')
      .sort({ trainNumber: 1 })
      .limit(20)
      .lean();
    const localResults = trains.map((train) => ({
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      sourceStation: train.sourceStation,
      destinationStation: train.destinationStation,
      departureTime: train.departureTime,
      arrivalTime: train.arrivalTime
    }));
    const providerResults = isProviderEnabled()
      ? await getProviderSearchResults(query)
      : [];
    const resultsByTrainNumber = new Map(providerResults.map((train) => [train.trainNumber, train]));
    localResults.forEach((train) => resultsByTrainNumber.set(train.trainNumber, train));
    const data = [...resultsByTrainNumber.values()].slice(0, 20);
    if (data.length === 0 && isProviderEnabled() && /^\d{1,8}$/.test(query)) {
      data.push({
        trainNumber: query,
        trainName: `Train ${query}`,
        sourceStation: null,
        destinationStation: null
      });
    }
    const totalActiveTrains = await Train.countDocuments({ active: true });
    return res.status(200).json({ success: true, count: data.length, totalActiveTrains, data });
  } catch (error) {
    if (error instanceof ProviderError) {
      if (error.retryAfter) res.set('Retry-After', error.retryAfter);
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Train tracking search failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to search trains at this time.' });
  }
};

// @route   GET /api/trains/:trainNumber/route
exports.getTrainTrackingRoute = async (req, res) => {
  try {
    const train = await findActiveTrain(req.params.trainNumber);
    if (!train) {
      return res.status(404).json({
        success: false,
        code: 'TRAIN_NOT_IN_CATALOG',
        message: 'Train not found in the local train catalog.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        mode: 'schedule',
        stops: (train.route || []).map((stop) => ({
          stationCode: stop.stationCode,
          stationName: stop.stationName,
          scheduledArrival: stop.arrivalTime,
          scheduledDeparture: stop.departureTime,
          distanceKm: stop.distanceKm,
          platform: stop.platform
        }))
      }
    });
  } catch (error) {
    console.error('Train tracking route request failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to load this train route.' });
  }
};

// @route   GET /api/trains/:trainNumber/status?date=YYYY-MM-DD
exports.getTrainTrackingStatus = async (req, res) => {
  try {
    const trainNumber = req.params.trainNumber;
    if (!/^\d{1,8}$/.test(trainNumber)) {
      return res.status(400).json({ success: false, message: 'Train number must contain 1 to 8 digits.' });
    }
    const date = req.query.date;
    if (date !== undefined && !isValidJourneyDate(date)) {
      return res.status(400).json({ success: false, message: 'Date must be a valid date in YYYY-MM-DD format.' });
    }

    if (isProviderEnabled()) {
      const status = await getProviderStatus(trainNumber, date);
      return res.status(200).json({ success: true, data: status });
    }

    const train = await findActiveTrain(trainNumber);
    if (!train) {
      return res.status(404).json({
        success: false,
        code: 'TRAIN_NOT_IN_CATALOG',
        message: 'Train not found in the local train catalog.'
      });
    }

    const status = {
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      mode: 'demo',
      runningStatus: 'Live running status unavailable — schedule reference only',
      currentStation: null,
      currentStationCode: null,
      nextStation: null,
      previousStation: null,
      delayMinutes: null,
      delayText: 'Not reported',
      lastUpdated: null,
      refreshAfterSeconds: null,
      location: null,
      journeyDate: date || null,
      timeline: (train.route || []).map((stop) => ({
        stationName: stop.stationName,
        stationCode: stop.stationCode,
        scheduledArrival: stop.arrivalTime,
        scheduledDeparture: stop.departureTime,
        estimatedArrival: null,
        delayMinutes: null,
        platform: stop.platform,
        status: 'Scheduled timetable only'
      }))
    };

    return res.status(200).json({ success: true, data: status });
  } catch (error) {
    if (error instanceof ProviderError) {
      if (error.retryAfter) res.set('Retry-After', error.retryAfter);
      return res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message
      });
    }
    console.error('Train status request failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to load train running status.' });
  }
};

// Backward-compatible endpoint; never return fabricated live/GPS status.
exports.getLiveRunningStatus = exports.getTrainTrackingStatus;
