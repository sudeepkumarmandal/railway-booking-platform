const RAILRADAR_BASE_URL = 'https://api.railradar.in/v1';
const REQUEST_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 1024 * 1024;

class ProviderError extends Error {
  constructor(message, statusCode, retryAfter) {
    super(message);
    this.name = 'ProviderError';
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
    this.code = statusCode === 404 ? 'PROVIDER_DATA_NOT_FOUND' : 'PROVIDER_REQUEST_FAILED';
  }
}

const isProviderEnabled = () =>
  process.env.TRAIN_TRACKING_PROVIDER === 'railradar' &&
  Boolean(process.env.RAILRADAR_API_KEY);

const validateDate = (date) => {
  if (date === undefined) return undefined;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
    ? date
    : null;
};

const requestProviderJson = async (url, fetchImpl = fetch) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.RAILRADAR_API_KEY}`,
        Accept: 'application/json'
      },
      signal: controller.signal
    });
    const declaredSize = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredSize) && declaredSize > MAX_RESPONSE_BYTES) {
      throw new ProviderError('The train data provider returned an oversized response.', 502);
    }
    const body = await response.text();
    if (body.length > MAX_RESPONSE_BYTES) {
      throw new ProviderError('The train data provider returned an oversized response.', 502);
    }

    if (response.status === 429) {
      throw new ProviderError(
        'The free provider request quota has been reached. Try again after the provider resets your quota.',
        429,
        response.headers.get('retry-after')
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new ProviderError('The configured provider API key was rejected.', 502);
    }
    if (response.status === 404) {
      throw new ProviderError('The provider has no matching train or running-status record.', 404);
    }
    if (!response.ok) {
      throw new ProviderError('The train data provider is temporarily unavailable.', 502);
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      throw new ProviderError('The train data provider returned an invalid response.', 502);
    }

    return payload;
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (error.name === 'AbortError') {
      throw new ProviderError('The train data provider timed out. Please try again later.', 504);
    }
    throw new ProviderError('Could not connect to the train data provider.', 502);
  } finally {
    clearTimeout(timeout);
  }
};

const providerRequest = async (trainNumber, date, fetchImpl = fetch) => {
  const url = new URL(`${RAILRADAR_BASE_URL}/trains/${encodeURIComponent(trainNumber)}/live`);
  if (date) url.searchParams.set('date', date);
  const payload = await requestProviderJson(url, fetchImpl);
  if (payload?.success !== true || !payload.data || typeof payload.data !== 'object') {
    throw new ProviderError('The train data provider returned no usable status data.', 502);
  }
  return payload.data;
};

const getProviderSearchResults = async (query, fetchImpl) => {
  const url = new URL(`${RAILRADAR_BASE_URL}/lookup/search/trains`);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '20');
  const payload = await requestProviderJson(url, fetchImpl);
  if (payload?.success !== true || !Array.isArray(payload.data)) {
    throw new ProviderError('The train data provider returned an invalid search response.', 502);
  }
  return payload.data
    .filter((train) => train && /^\d{1,8}$/.test(String(train.number || '')) && typeof train.name === 'string')
    .map((train) => ({
      trainNumber: String(train.number),
      trainName: train.name,
      sourceStation: train.source ? { code: train.source, name: train.source } : null,
      destinationStation: train.destination ? { code: train.destination, name: train.destination } : null,
      dataSource: 'RailRadar'
    }));
};

const numberOrNull = (value) => Number.isFinite(value) ? value : null;

const formatProviderTime = (value) => {
  if (typeof value !== 'string' || !value.includes('T')) return value || null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Kolkata'
  }).format(parsed);
};

const estimateArrival = (scheduledArrival, delayMinutes) => {
  if (typeof scheduledArrival !== 'string' || !Number.isFinite(delayMinutes)) return null;
  const scheduledDate = new Date(scheduledArrival);
  if (Number.isNaN(scheduledDate.getTime())) return null;
  return formatProviderTime(new Date(scheduledDate.getTime() + delayMinutes * 60_000).toISOString());
};

const normalizeProviderStatus = (data, date) => {
  const providerRoute = Array.isArray(data.route) ? data.route : [];
  const currentLocation = data.currentLocation && typeof data.currentLocation === 'object'
    ? data.currentLocation
    : null;
  const currentStop = currentLocation
    ? providerRoute.find((stop) => stop.stationCode === currentLocation.stationCode)
    : null;
  const normalizeStop = (stop) => ({
    stationCode: typeof stop.stationCode === 'string' ? stop.stationCode : null,
    stationName: typeof stop.stationName === 'string' ? stop.stationName : null,
    scheduledArrival: formatProviderTime(stop.scheduledArrival),
    scheduledDeparture: formatProviderTime(stop.scheduledDeparture),
    estimatedArrival: formatProviderTime(stop.estimatedArrival || stop.expectedArrival) ||
      estimateArrival(stop.scheduledArrival, numberOrNull(stop.delayArrival)),
    delayMinutes: numberOrNull(stop.delayArrival) ?? numberOrNull(stop.delayDeparture),
    status: typeof stop.status === 'string' ? stop.status : null,
    platform: stop.platform || null,
    latitude: Number.isFinite(stop.lat) && stop.lat >= -90 && stop.lat <= 90 ? stop.lat : null,
    longitude: Number.isFinite(stop.lng) && stop.lng >= -180 && stop.lng <= 180 ? stop.lng : null
  });
  const timeline = providerRoute.map(normalizeStop);
  const delayMinutes = numberOrNull(data.delayMinutes);
  const status = typeof data.status === 'string' ? data.status : 'unavailable';
  const nextHalt = data.nextHalt && typeof data.nextHalt === 'object' ? data.nextHalt : null;
  const previousHalt = data.previousHalt && typeof data.previousHalt === 'object' ? data.previousHalt : null;

  return {
    trainNumber: String(data.trainNumber || data.train?.number || ''),
    trainName: data.trainName || data.train?.name || null,
    mode: 'live',
    provider: 'RailRadar',
    providerIsOfficial: false,
    runningStatus: status,
    currentStation: currentStop?.stationName || currentLocation?.stationName || null,
    currentStationCode: currentLocation?.stationCode || null,
    currentStationIndex: currentStop ? providerRoute.indexOf(currentStop) : null,
    nextStation: nextHalt?.stationName || null,
    previousStation: previousHalt?.stationName || null,
    delayMinutes,
    delayText: delayMinutes === null
      ? 'Not reported'
      : delayMinutes > 0 ? `${delayMinutes} min late` : delayMinutes < 0 ? `${Math.abs(delayMinutes)} min early` : 'On time',
    lastUpdated: data.lastUpdatedAt || null,
    refreshAfterSeconds: null,
    location: null,
    journeyDate: data.startDate || date || null,
    timeline
  };
};

const getProviderStatus = async (trainNumber, date, fetchImpl) => {
  const validDate = validateDate(date);
  if (validDate === null) {
    throw new ProviderError('Date must be a valid date in YYYY-MM-DD format.', 400);
  }
  const data = await providerRequest(trainNumber, validDate, fetchImpl);
  const normalized = normalizeProviderStatus(data, validDate);
  if (!normalized.trainNumber) {
    throw new ProviderError('The provider response is missing the train number.', 502);
  }
  return normalized;
};

module.exports = {
  ProviderError,
  getProviderSearchResults,
  getProviderStatus,
  isProviderEnabled,
  normalizeProviderStatus,
  validateDate
};
