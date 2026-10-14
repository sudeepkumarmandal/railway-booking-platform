const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ProviderError,
  getProviderSearchResults,
  getProviderStatus,
  normalizeProviderStatus,
  validateDate
} = require('../services/trainTrackingService');

const sampleProviderData = {
  trainNumber: '12919',
  trainName: 'Malwa SF Express',
  startDate: '2026-06-22',
  lastUpdatedAt: '2026-06-22T07:14:00+05:30',
  status: 'running',
  delayMinutes: 12,
  currentLocation: { stationCode: 'UJN', sequence: 2, status: 'departed', segmentProgress: 0.45 },
  previousHalt: { stationCode: 'INDB', stationName: 'Indore Junction' },
  nextHalt: { stationCode: 'UJN', stationName: 'Ujjain Junction' },
  route: [
    { stationCode: 'INDB', stationName: 'Indore Junction', lat: 22.72, lng: 75.86, scheduledDeparture: '2026-06-22T23:55:00+05:30' },
    { stationCode: 'UJN', stationName: 'Ujjain Junction', lat: 23.17, lng: 75.78, scheduledArrival: '2026-06-23T00:55:00+05:30', delayArrival: 12 }
  ]
};

const response = (status, body, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json', ...headers }
});

test('validates journey dates without accepting impossible calendar dates', () => {
  assert.equal(validateDate('2026-06-22'), '2026-06-22');
  assert.equal(validateDate('2026-02-30'), null);
  assert.equal(validateDate('22-06-2026'), null);
  assert.equal(validateDate(undefined), undefined);
});

test('normalizes provider status while withholding a train map pin without exact coordinates', () => {
  const status = normalizeProviderStatus(sampleProviderData, '2026-06-22');

  assert.equal(status.mode, 'live');
  assert.equal(status.provider, 'RailRadar');
  assert.equal(status.providerIsOfficial, false);
  assert.equal(status.currentStation, 'Ujjain Junction');
  assert.equal(status.currentStationIndex, 1);
  assert.equal(status.nextStation, 'Ujjain Junction');
  assert.equal(status.delayText, '12 min late');
  assert.equal(status.lastUpdated, sampleProviderData.lastUpdatedAt);
  assert.equal(status.location, null);
  assert.equal(status.timeline[1].scheduledArrival, '00:55');
  assert.equal(status.timeline[1].estimatedArrival, '01:07');
  assert.equal(status.timeline[1].latitude, 23.17);
  assert.equal(status.refreshAfterSeconds, null);
});

test('calls the provider over HTTPS with the secret in the Authorization header', async () => {
  process.env.RAILRADAR_API_KEY = 'test-private-key';
  let requestUrl;
  let authorization;
  const status = await getProviderStatus('12919', '2026-06-22', async (url, options) => {
    requestUrl = String(url);
    authorization = options.headers.Authorization;
    return response(200, { success: true, data: sampleProviderData });
  });

  assert.equal(requestUrl, 'https://api.railradar.in/v1/trains/12919/live?date=2026-06-22');
  assert.equal(authorization, 'Bearer test-private-key');
  assert.equal(status.trainNumber, '12919');
});

test('uses the provider train-name search endpoint and normalizes search results', async () => {
  process.env.RAILRADAR_API_KEY = 'test-private-key';
  let requestUrl;
  const results = await getProviderSearchResults('Shatabdi', async (url) => {
    requestUrl = String(url);
    return response(200, {
      success: true,
      data: [{ number: '12002', name: 'Bhopal Shatabdi', source: 'NDLS', destination: 'RKMP' }]
    });
  });

  assert.equal(requestUrl, 'https://api.railradar.in/v1/lookup/search/trains?q=Shatabdi&limit=20');
  assert.deepEqual(results, [{
    trainNumber: '12002',
    trainName: 'Bhopal Shatabdi',
    sourceStation: { code: 'NDLS', name: 'NDLS' },
    destinationStation: { code: 'RKMP', name: 'RKMP' },
    dataSource: 'RailRadar'
  }]);
});

test('surfaces the provider free-tier rate limit and retry hint', async () => {
  process.env.RAILRADAR_API_KEY = 'test-private-key';
  await assert.rejects(
    getProviderStatus('12919', undefined, async () => response(429, { success: false }, { 'retry-after': '3600' })),
    (error) => error instanceof ProviderError &&
      error.statusCode === 429 &&
      error.retryAfter === '3600'
  );
});

test('rejects malformed provider data rather than returning demo-shaped live status', async () => {
  process.env.RAILRADAR_API_KEY = 'test-private-key';
  await assert.rejects(
    getProviderStatus('12919', undefined, async () => response(200, { success: true, data: {} })),
    (error) => error instanceof ProviderError && error.statusCode === 502
  );
});

test('maps provider timeouts to a gateway timeout', async () => {
  process.env.RAILRADAR_API_KEY = 'test-private-key';
  await assert.rejects(
    getProviderStatus('12919', undefined, async () => {
      const timeoutError = new Error('request aborted');
      timeoutError.name = 'AbortError';
      throw timeoutError;
    }),
    (error) => error instanceof ProviderError && error.statusCode === 504
  );
});
