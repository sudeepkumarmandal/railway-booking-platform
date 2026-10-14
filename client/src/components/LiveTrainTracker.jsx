import React, { useEffect, useMemo, useState } from 'react';
import { searchTrackingTrainsApi, getTrackingStatusApi, getTrackingRouteApi } from '../services/api';

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatUpdatedAt = (value) => {
  if (!value) return 'Update time unavailable';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const RouteMap = ({ status, route }) => {
  const position = status?.location;
  const stops = route?.stops || route?.route || [];
  const geoStops = stops.filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude));

  if (!position || !Number.isFinite(position.latitude) || !Number.isFinite(position.longitude) || geoStops.length < 2) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <span className="text-3xl" aria-hidden="true">🗺️</span>
        <p className="mt-2 text-sm font-semibold text-slate-700">Route map unavailable</p>
        <p className="mt-1 max-w-md text-xs text-slate-500">
          The selected data source has not supplied verified train and station coordinates. We will not estimate or invent a map position.
        </p>
      </div>
    );
  }

  const points = [...geoStops, position];
  const longitudes = points.map((point) => point.longitude);
  const latitudes = points.map((point) => point.latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const x = (longitude) => 32 + ((longitude - minLongitude) / (maxLongitude - minLongitude || 1)) * 536;
  const y = (latitude) => 190 - ((latitude - minLatitude) / (maxLatitude - minLatitude || 1)) * 150;
  const path = geoStops.map((stop, index) => `${index ? 'L' : 'M'} ${x(stop.longitude)} ${y(stop.latitude)}`).join(' ');

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-sky-50">
      <svg viewBox="0 0 600 220" role="img" aria-label="Train route map based on provider-supplied coordinates" className="h-auto min-h-48 w-full">
        <path d={path} fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {geoStops.map((stop, index) => (
          <g key={`${stop.stationCode || stop.stationName}-${index}`}>
            <circle cx={x(stop.longitude)} cy={y(stop.latitude)} r="7" fill="#fff" stroke="#0284c7" strokeWidth="4" />
            <title>{stop.stationName || stop.stationCode}</title>
          </g>
        ))}
        <g>
          <circle cx={x(position.longitude)} cy={y(position.latitude)} r="12" fill="#f97316" stroke="#fff" strokeWidth="4" />
          <title>Reported train location</title>
        </g>
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-600">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-sky-600" />Station</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />Reported train position</span>
      </div>
    </div>
  );
};

const LiveTrainTracker = () => {
  const [query, setQuery] = useState('');
  const [journeyDate, setJourneyDate] = useState(today);
  const [matches, setMatches] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [status, setStatus] = useState(null);
  const [route, setRoute] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchCompleted, setSearchCompleted] = useState(false);

  const stops = useMemo(() => route?.stops || route?.route || status?.timeline || [], [route, status]);
  const currentIndex = status?.currentStationCode
    ? stops.findIndex((stop) => stop.stationCode === status.currentStationCode)
    : Number.isInteger(status?.currentStationIndex) ? status.currentStationIndex : -1;
  const previousStops = currentIndex >= 0 ? stops.slice(0, currentIndex) : [];
  const upcomingStops = currentIndex >= 0 ? stops.slice(currentIndex + 1) : stops;
  const progress = stops.length > 1 && currentIndex >= 0
    ? Math.round((currentIndex / (stops.length - 1)) * 100)
    : null;

  const loadDetails = async (train, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoadingDetails(true);
    setError('');
    setSelectedTrain(train);
    if (!isRefresh) {
      setStatus(null);
      setRoute(null);
    }
    try {
        const statusData = await getTrackingStatusApi(train.trainNumber, journeyDate);
        let routeData = Array.isArray(statusData.timeline) && statusData.timeline.length
          ? { stops: statusData.timeline }
          : null;
        if (!routeData) {
          try {
            routeData = await getTrackingRouteApi(train.trainNumber);
          } catch (routeError) {
            if (statusData.mode !== 'live') throw routeError;
            setError('Running status loaded, but no route timetable is available for this train.');
          }
        }
        setStatus(statusData);
        setRoute(routeData);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Train status is temporarily unavailable.');
    } finally {
      setLoadingDetails(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setError('Enter a train number or train name to search.');
      setMatches([]);
      setSelectedTrain(null);
      setStatus(null);
      setRoute(null);
      setSearchCompleted(false);
      return;
    }

    setSearching(true);
    setError('');
    setSearchCompleted(false);
    setMatches([]);
    setSelectedTrain(null);
    setStatus(null);
    setRoute(null);
    try {
      const results = await searchTrackingTrainsApi(normalizedQuery);
      setMatches(results);
      setSearchCompleted(true);
      if (results.length === 1) await loadDetails(results[0]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Train search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const refreshAfterSeconds = status?.refreshAfterSeconds;
    if (!selectedTrain || !status || !Number.isFinite(refreshAfterSeconds) || refreshAfterSeconds < 15) return undefined;
    const timer = window.setTimeout(() => loadDetails(selectedTrain, true), refreshAfterSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [selectedTrain, status, journeyDate]);

  return (
    <section aria-labelledby="live-status-heading" className="mx-auto max-w-5xl space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Train running information</p>
          <h2 id="live-status-heading" className="mt-1 text-2xl font-black text-slate-900">Live Train Tracking</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Search by train number or name to view reported running status, route stops, and estimated timings.
          </p>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-600">Train number or name</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. 22436 or Vande Bharat"
              maxLength={80}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-600">Journey date</span>
            <input
              type="date"
              value={journeyDate}
              max="2999-12-31"
              onChange={(event) => setJourneyDate(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={searching}
              className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:from-sky-700 hover:to-indigo-700 disabled:opacity-60 sm:w-auto"
            >
              {searching ? 'Searching…' : 'Search trains'}
            </button>
          </div>
        </form>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {searching && <p role="status" className="mt-4 text-sm font-medium text-slate-500">Searching train catalog…</p>}

        {matches.length > 1 && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-bold text-slate-800">Search results ({matches.length})</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {matches.map((train) => (
                <button
                  type="button"
                  key={train.trainNumber}
                  onClick={() => loadDetails(train)}
                  className={`rounded-xl border p-4 text-left transition hover:border-sky-400 hover:bg-sky-50 ${
                    selectedTrain?.trainNumber === train.trainNumber ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-sky-800">{train.trainNumber}</span>
                  <span className="ml-2 font-bold text-slate-900">{train.trainName}</span>
                  {train.sourceStation?.name && train.destinationStation?.name && (
                    <span className="mt-1 block text-xs text-slate-500">{train.sourceStation.name} → {train.destinationStation.name}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {searchCompleted && matches.length === 0 && !error && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <p className="font-bold text-slate-800">No matching trains found</p>
            <p className="mt-1 text-sm text-slate-500">Try a different number or name. Search coverage depends on the local train catalog or configured data provider.</p>
          </div>
        )}
      </div>

      {loadingDetails && (
        <div role="status" className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm font-semibold text-slate-500">
          Loading running status and route…
        </div>
      )}

      {!loadingDetails && status && selectedTrain && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">{status.trainName || selectedTrain.trainName}</h3>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
                    {status.trainNumber || selectedTrain.trainNumber}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    status.mode === 'live' ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {status.mode === 'live' ? `${status.provider || 'THIRD-PARTY'} • NOT OFFICIAL` : 'DEMO DATA — NOT LIVE'}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700">{status.runningStatus || 'Running status unavailable'}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {status.currentStation ? `Last reported at ${status.currentStation}` : 'Current / last station not reported'}
                  {status.nextStation ? ` • Next: ${status.nextStation}` : ''}
                </p>
                {status.mode === 'live' ? (
                  <p className="mt-2 text-xs font-medium text-amber-800">
                    Independent third-party crowd-sourced information; not an official Indian Railways, IRCTC, or NTES feed. Check the provider's terms before using it publicly.
                  </p>
                ) : (
                  <p className="mt-2 text-xs font-medium text-amber-800">
                    This is sample route information only. It is not current train location or verified running information.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => loadDetails(selectedTrain, true)}
                disabled={refreshing}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {refreshing ? 'Refreshing…' : '↻ Refresh status'}
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Delay', status.delayText || (Number.isFinite(status.delayMinutes) ? `${status.delayMinutes} min` : 'Not reported')],
                ['Previous station', status.previousStation || previousStops.at(-1)?.stationName || 'Not reported'],
                ['Next station', status.nextStation || (currentIndex >= 0 ? upcomingStops[0]?.stationName : null) || 'Not reported'],
                ['Last data update', formatUpdatedAt(status.lastUpdated)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            {Number.isFinite(progress) && (
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs font-semibold text-slate-600">
                  <span>Journey progress</span>
                  <span>{progress}% • {currentIndex + 1} of {stops.length} stations</span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Journey progress"
                  aria-valuenow={progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  className="h-2.5 overflow-hidden rounded-full bg-slate-200"
                >
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-black text-slate-900">Route progress & timetable</h3>
              {stops.length ? (
                <ol className="space-y-3">
                  {stops.map((stop, index) => {
                    const passed = currentIndex >= 0 && index < currentIndex;
                    const current = index === currentIndex;
                    return (
                      <li key={`${stop.stationCode || stop.stationName}-${index}`} className="flex gap-3">
                        <div className="flex w-7 shrink-0 flex-col items-center">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            current ? 'bg-sky-600 text-white' : passed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {passed ? '✓' : current ? '●' : index + 1}
                          </span>
                          {index < stops.length - 1 && <span className="mt-1 min-h-5 w-px flex-1 bg-slate-200" />}
                        </div>
                        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-900">
                                {stop.stationName || stop.name || stop.stationCode}
                                {stop.stationCode && <span className="ml-1 font-mono text-xs text-slate-500">({stop.stationCode})</span>}
                              </p>
                              {stop.status && <p className="mt-1 text-xs text-slate-500">{stop.status}</p>}
                            </div>
                            {current && <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-bold text-sky-800">Last reported</span>}
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <p className="text-slate-500">Scheduled arrival <strong className="block text-slate-800">{stop.scheduledArrival || stop.arrivalTime || '—'}</strong></p>
                            <p className="text-slate-500">Estimated arrival <strong className="block text-sky-800">{stop.estimatedArrival || stop.expectedArrival || '—'}</strong></p>
                            <p className="text-slate-500">Scheduled departure <strong className="block text-slate-800">{stop.scheduledDeparture || stop.departureTime || '—'}</strong></p>
                            <p className="text-slate-500">Delay <strong className="block text-slate-800">{stop.delayText || (Number.isFinite(stop.delayMinutes) ? `${stop.delayMinutes} min` : '—')}</strong></p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No route timetable is available.</p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-base font-black text-slate-900">Reported route map</h3>
              <RouteMap status={status} route={route} />
              <p className="mt-3 text-[11px] text-slate-500">
                Map markers are displayed only when the configured source supplies train coordinates and route-stop coordinates.
              </p>
            </section>
          </div>
        </div>
      )}
    </section>
  );
};

export default LiveTrainTracker;
