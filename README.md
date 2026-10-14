# 🚆 BharatRail (भारत रेल) — Full MERN Stack Railway Ticket Booking Platform

A full-fledged, enterprise-grade Railway Ticket Booking Platform built on the **MERN Stack** (MongoDB, Express.js, React.js, Node.js).

---

## 🏗️ Architecture Overview

```
                                  +-----------------------------+
                                  |   React 18 + Vite Client   |
                                  |   - Tailwind CSS UI         |
                                  |   - Interactive Coach Map   |
                                  |   - Printable E-Ticket Slip |
                                  +-----------------------------+
                                                 |
                                         REST APIs / Axios
                                                 v
                                  +-----------------------------+
                                  |     Express & Node.js       |
                                  |   - Train Search Engine     |
                                  |   - PNR Allocator & Saga    |
                                  |   - IRCTC Refund Calculator |
                                  |   - Wallet & User Auth      |
                                  +-----------------------------+
                                                 |
                                           Mongoose ODM
                                                 v
                                  +-----------------------------+
                                  |       MongoDB Database      |
                                  |   - trains, stations        |
                                  |   - bookings, users         |
                                  +-----------------------------+
```

---

## 📁 Project Directory Structure

```text
railway-booking-mern/
├── package.json                 # Root script runner (concurrently)
├── README.md                    # Setup & API guide
│
├── server/                      # Node.js + Express Backend
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── models/
│   │   ├── User.js              # User auth, wallet balance
│   │   ├── Train.js             # Train routes, class seats, fares
│   │   ├── Station.js           # Station database (NDLS, BSB, MMCT)
│   │   └── Booking.js           # PNR records, passengers, cancellation
│   ├── controllers/
│   │   ├── trainController.js   # Route search & provider-gated train status
│   │   ├── bookingController.js # PNR generator, berth allotment, refund
│   │   └── userController.js    # Auth & wallet recharge
│   ├── services/
│   │   └── trainTrackingService.js # Optional free-tier status provider
│   ├── routes/
│   │   ├── trainRoutes.js       # /api/trains endpoints
│   │   ├── bookingRoutes.js     # /api/bookings endpoints
│   │   └── userRoutes.js        # /api/users endpoints
│   ├── seed.js                  # Database seeder (Vande Bharat, Rajdhani, etc.)
│   ├── server.js                # Express app entry point
│   ├── test/
│   │   └── trainTrackingService.test.js
│   ├── package.json
│   └── .env.example
│
└── client/                      # React 18 + Vite Frontend
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx       # Header, navigation & wallet chip
    │   │   ├── TrainSearch.jsx  # Station selector, date, swap
    │   │   ├── TrainCard.jsx    # Train card with class availability tiles
    │   │   ├── CoachMap.jsx     # Interactive coach berth visual selector
    │   │   ├── BookingModal.jsx # Passenger list, berth preferences, coupon
    │   │   ├── PaymentModal.jsx # 1-Click wallet, UPI QR, 10-min countdown
    │   │   ├── ETicketModal.jsx # Printable ERS slip with barcode
    │   │   ├── PnrEnquiry.jsx   # Live PNR & chart lookup
    │   │   ├── LiveTrainTracker.jsx # Provider-gated tracking UI
    │   │   ├── MyBookings.jsx   # Booking history & refund calculator
    │   │   └── Dashboard.jsx    # User statistics & quick re-book
    │   ├── services/
    │   │   └── api.js           # Axios API client with resilient fallbacks
    │   ├── App.jsx              # Main React state & modal controller
    │   ├── main.jsx             # React DOM entry
    │   └── index.css            # Tailwind & print styles
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Step-by-Step Installation & Running Guide

### Step 1: Clone / Navigate to Project Directory
```bash
cd "C:\Users\HP\Downloads\railway-booking-mern\railway-booking-mern"
```

### Step 2: Setup Backend (`server`)
```bash
cd server
npm install
```

Configure `.env` file (or copy from `.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/bharatrail
JWT_SECRET=replace_with_a_long_random_secret
```

For new installations, replace the JWT secret with a long random value. The `.env.example` file also includes optional train-tracking provider settings.

Seed the Database with realistic Indian Railway trains & stations:
```bash
npm run seed
```
> **Note:** `seed.js` clears and recreates the `stations`, `trains`, and `users` collections in the configured database. Back up any data you need before running it. Without seeded train data, the frontend uses a limited set of demo routes; demo bookings and payments are simulated in the browser.

Train search loads stations from the local station/train catalog and finds trains whose route contains the selected origin and destination in that order, including journeys between intermediate stops. Search coverage is limited to routes present in the database (or the bundled demo routes when the train database is empty); train schedules, availability, and fares are not live railway data.

### Live Train Tracking and provider configuration

The tracker is available from the **Live Train Tracking** navigation option. It searches by train number or name in the local catalog and, when configured, an optional provider autocomplete. With the default `TRAIN_TRACKING_PROVIDER=demo` (or without an API key), status is **timetable/demo only**: the app does not invent a current station, delay, ETA, GPS location, or update time.

An optional RailRadar adapter is included for its documented **free sandbox (100 requests/month)**. RailRadar describes itself as an independent, crowd-powered service and explicitly says it is not affiliated with Indian Railways, IRCTC, or NTES. Its public documentation does not establish official railway authorization, a live-coverage guarantee, or a production price. Use the adapter only if you have a provider account and have confirmed its current terms allow your intended use. Searches and manual status refreshes consume the free quota; the app does not automatically refresh. Paid tiers are not configured or required.

1. Register with RailRadar and obtain an API key from its developer console.
2. In `server/.env`, set:

   ```env
   TRAIN_TRACKING_PROVIDER=railradar
   RAILRADAR_API_KEY=your_provider_api_key
   ```

3. Restart the backend. Leave `TRAIN_TRACKING_PROVIDER=demo` and the key blank to use timetable/demo mode.

Provider documentation: [live status](https://railradar.in/docs/live-train-status), [train search](https://railradar.in/docs/search-trains), [API limits](https://railradar.in/docs), and [provider terms](https://railradar.in/terms). The free tier is limited to 100 requests/month; the public production pricing page does not publish a price. Results are labelled as third-party and not official. Provider `429` responses, invalid credentials, timeouts, and unavailable data are surfaced rather than hidden with demo data. The documented status response does not supply an exact train latitude/longitude, so the UI does not plot an assumed train GPS marker.

Keep the API key in the backend environment only. Never put it in `client/.env` or frontend code, commit `server/.env`, or enable the provider unless its account terms permit your intended use.

Start the Backend Server:
```bash
npm run dev
# Server will run on: http://localhost:5000
```

### Step 3: Setup Frontend (`client`)
Open a new terminal tab/window:
```bash
cd "C:\Users\HP\Downloads\railway-booking-mern\railway-booking-mern\client"
npm install
npm run dev
# Client will run on: http://localhost:5173
```

---

## 📡 REST API Reference

### 1. Train APIs (`/api/trains`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/trains/search?from=NDLS&to=BSB&date=2026-10-18` | Search direct trains between stations |
| `GET` | `/api/trains/tracking/search?query=Vande%20Bharat` | Search train number/name in the local catalog and optional provider |
| `GET` | `/api/trains/:trainNumber/status?date=2026-10-18` | Provider status when configured; otherwise timetable-only demo status |
| `GET` | `/api/trains/:trainNumber/route` | Local train route and scheduled timetable |
| `GET` | `/api/trains/:trainNumber` | Get full timetable & halt schedule |
| `GET` | `/api/trains/:trainNumber/live-status` | Backward-compatible status alias; never fabricates GPS data |
| `GET` | `/api/trains/stations/all` | List all railway junction stations |

### 2. Booking APIs (`/api/bookings`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/bookings/create` | Create reservation, allocate seats, generate 10-digit PNR |
| `GET` | `/api/bookings/pnr/:pnr` | Get real-time PNR charting status & passenger details |
| `GET` | `/api/bookings/user/:userId` | Get all bookings of a user |
| `POST` | `/api/bookings/cancel/:pnr` | Cancel ticket with IRCTC refund deduction rules |

### 3. User & Wallet APIs (`/api/users`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/users/register` | User sign up with welcome wallet balance |
| `POST` | `/api/users/login` | User authentication & JWT generation |
| `POST` | `/api/users/wallet/add` | Add funds to user's BharatRail Wallet |

---

## 💡 Key Highlights

1. **Resilient Frontend Design**:
   The React frontend in `client/` has built-in mock fallbacks. If MongoDB is not yet running locally, the React app gracefully runs in demo mode with full functionality (booking, coach selection, payment simulation, printable ticket, and PNR status). Tracking demo data is explicitly labelled and does not claim to be live.
2. **Official IRCTC Cancellation & Refund Rules**:
   Includes clerkage deduction (>48h), 25% deduction (48h–12h), 50% deduction (12h–4h), and instant wallet refund credit.
3. **Printable E-Ticket**:
   Formatted using `@media print` CSS so users can print or save their ticket directly as a clean PDF without browser clutter.
