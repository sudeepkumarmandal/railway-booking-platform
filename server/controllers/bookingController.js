const Booking = require('../models/Booking');
const Train = require('../models/Train');
const User = require('../models/User');

// Generate 10-Digit Indian Railways PNR
const generatePNR = () => {
  const p1 = Math.floor(100 + Math.random() * 900);
  const p2 = Math.floor(1000000 + Math.random() * 9000000);
  return `${p1}${p2}`;
};

// @desc    Create a new train ticket booking
// @route   POST /api/bookings/create
exports.createBooking = async (req, res) => {
  try {
    const {
      userId,
      trainNumber,
      fromStation,
      toStation,
      travelClass,
      quota,
      journeyDate,
      passengers,
      selectedSeats,
      paymentMethod,
      appliedCoupon
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const train = await Train.findOne({ trainNumber });
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' });
    }

    const originCode = (fromStation || train.sourceStation.code).toUpperCase();
    const destinationCode = (toStation || train.destinationStation.code).toUpperCase();
    const originIndex = train.route.findIndex(stop => stop.stationCode === originCode);
    const destinationIndex = train.route.findIndex(stop => stop.stationCode === destinationCode);
    if (originIndex < 0 || destinationIndex <= originIndex) {
      return res.status(400).json({ success: false, message: 'Selected stations are not a valid segment of this train route' });
    }

    const classInfo = train.classes[travelClass];
    if (!classInfo) {
      return res.status(400).json({ success: false, message: 'Invalid travel class' });
    }

    // Fare calculation
    const count = passengers.length;
    const baseFare = classInfo.fare * count;
    const catering = ['1A', '2A', '3A', 'CC', 'EC'].includes(travelClass) ? (count * 250) : 0;
    const reservationCharge = count * 40;
    const superfastCharge = count * 45;
    const gst = Math.round(baseFare * 0.05);
    const insurance = count * 0.35;

    let discount = 0;
    if (appliedCoupon === 'FIRSTRAIL') discount = 150;
    else if (appliedCoupon === 'VANDEBHARAT') discount = Math.round(baseFare * 0.10);

    const totalFare = Math.max(0, baseFare + catering + reservationCharge + superfastCharge + gst + insurance - discount);

    // If paying via wallet, check balance
    if (paymentMethod === 'WALLET') {
      if (user.walletBalance < totalFare) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }
      user.walletBalance -= totalFare;
      await user.save();
    }

    // Assign Coach & Berths
    const coachCode = ['CC', 'EC'].includes(travelClass) ? 'C3' : (travelClass === '1A' ? 'H1' : (travelClass === '2A' ? 'A2' : 'B3'));
    const originStop = train.route[originIndex];
    const destinationStop = train.route[destinationIndex];
    const passengersWithBerths = passengers.map((p, idx) => {
      const seat = (selectedSeats && selectedSeats[idx]) || (14 + idx * 2);
      return {
        name: p.name,
        age: p.age,
        gender: p.gender,
        berthPreference: p.berthPreference || 'Lower',
        mealPreference: p.mealPreference || 'Veg',
        allocatedCoach: coachCode,
        allocatedBerth: seat,
        berthType: p.berthPreference || 'LB',
        bookingStatus: 'CNF',
        currentStatus: 'CNF'
      };
    });

    const booking = new Booking({
      pnr: generatePNR(),
      userId: user._id,
      trainId: train._id,
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      fromStation: originCode,
      fromStationName: originStop.stationName,
      toStation: destinationCode,
      toStationName: destinationStop.stationName,
      departureTime: originStop.departureTime,
      arrivalTime: destinationStop.arrivalTime,
      journeyDate,
      travelClass,
      quota: quota || 'General (GN)',
      passengers: passengersWithBerths,
      fareBreakdown: {
        baseFare,
        catering,
        reservationCharge,
        superfastCharge,
        gst,
        insurance,
        discount,
        totalFare
      },
      paymentMethod: paymentMethod || 'WALLET',
      status: 'CONFIRMED',
      chartStatus: 'CHART NOT PREPARED'
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Ticket booked successfully! PNR generated.',
      data: booking,
      walletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get PNR status and live charting
// @route   GET /api/bookings/pnr/:pnr
exports.getPnrStatus = async (req, res) => {
  try {
    const booking = await Booking.findOne({ pnr: req.params.pnr }).populate('userId', 'name email phone');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'PNR not found in PRS database' });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all bookings for a user
// @route   GET /api/bookings/user/:userId
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel ticket and calculate IRCTC refund
// @route   POST /api/bookings/cancel/:pnr
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ pnr: req.params.pnr });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Ticket is already cancelled' });
    }

    // IRCTC Cancellation Logic Simulation
    const baseFare = booking.fareBreakdown.baseFare;
    const clerkage = booking.passengers.length * (booking.travelClass === '1A' ? 240 : (['2A', '3A', 'CC'].includes(booking.travelClass) ? 180 : 120));
    const deduction = Math.max(clerkage, Math.round(baseFare * 0.25));
    const refundAmount = Math.max(0, booking.fareBreakdown.totalFare - deduction);

    booking.status = 'CANCELLED';
    booking.cancellationDetails = {
      cancelledAt: new Date(),
      cancellationFee: deduction,
      refundAmount: refundAmount,
      refundStatus: 'CREDITED_TO_WALLET'
    };

    await booking.save();

    // Refund back to user's wallet
    const user = await User.findById(booking.userId);
    if (user) {
      user.walletBalance += refundAmount;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: `Ticket ${booking.pnr} cancelled. ₹${refundAmount} refunded to wallet.`,
      data: booking,
      walletBalance: user ? user.walletBalance : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
