const express = require('express');
const router = express.Router();
const {
  searchTrains,
  getTrainByNumber,
  getAllStations,
  getLiveRunningStatus,
  searchTrackingTrains,
  getTrainTrackingRoute,
  getTrainTrackingStatus
} = require('../controllers/trainController');

router.get('/tracking/search', searchTrackingTrains);
router.get('/search', searchTrains);
router.get('/stations/all', getAllStations);
router.get('/:trainNumber/live-status', getLiveRunningStatus);
router.get('/:trainNumber/status', getTrainTrackingStatus);
router.get('/:trainNumber/route', getTrainTrackingRoute);
router.get('/:trainNumber', getTrainByNumber);

module.exports = router;
