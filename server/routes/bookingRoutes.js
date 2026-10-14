const express = require('express');
const router = express.Router();
const {
  createBooking,
  getPnrStatus,
  getUserBookings,
  cancelBooking
} = require('../controllers/bookingController');

router.post('/create', createBooking);
router.get('/pnr/:pnr', getPnrStatus);
router.get('/user/:userId', getUserBookings);
router.post('/cancel/:pnr', cancelBooking);

module.exports = router;
