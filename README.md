# Driver Tracking App

A real-time GPS driver tracking system for logistics, inspired by Samsara and Onfleet.

## Components

1. **Backend** - Node.js + Express + SQLite + Socket.IO
2. **Dashboard** - React + Vite + Google Maps (Fleet Manager View)
3. **Mobile App** - React Native + Expo (Driver App)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Android Studio (for mobile app emulator)
- Google Maps API Key

### 1. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at http://localhost:3000

### 2. Start Dashboard

```bash
cd dashboard
npm install

# Create .env file with your Google Maps API key
echo "VITE_GOOGLE_MAPS_API_KEY=your_api_key_here" > .env

npm run dev
```

Dashboard runs at http://localhost:5173

### 3. Start Mobile App

```bash
cd mobile
npm install
npx expo start
```

Press `a` for Android emulator or scan QR code with Expo Go app.

## Demo Accounts

For testing, use these pre-seeded driver accounts:
- ahmed@fleet.com
- mohamed@fleet.com
- sara@fleet.com

## Features

### Driver App
- Real-time GPS tracking
- Status management (Available/On Route/On Break/Offline)
- View assigned deliveries
- Mark deliveries as complete/failed
- Turn-by-turn navigation integration

### Fleet Dashboard
- Live map showing all drivers
- Real-time location updates via WebSocket
- Driver status indicators
- Click to focus on specific driver

## API Endpoints

### Drivers
- `GET /api/drivers` - List all drivers
- `GET /api/drivers/:id` - Get driver details
- `POST /api/drivers/login` - Driver login
- `PATCH /api/drivers/:id/status` - Update status
- `POST /api/drivers/:id/location` - Update location

### Deliveries
- `GET /api/deliveries` - List deliveries
- `GET /api/deliveries/driver/:id` - Driver's deliveries
- `PATCH /api/deliveries/:id/status` - Update delivery status

## Socket Events

### Client to Server
- `driver:join` - Driver connects
- `driver:location` - Location update
- `driver:status` - Status change
- `delivery:update` - Delivery status update

### Server to Client
- `drivers:update` - Broadcast all driver positions
- `delivery:updated` - Delivery status changed

## Tech Stack

- **Backend**: Node.js, Express, Socket.IO, SQLite, TypeScript
- **Dashboard**: React, Vite, Google Maps JavaScript API, Socket.IO Client
- **Mobile**: React Native, Expo, expo-location, react-native-maps

## Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API (for dashboard)
   - Maps SDK for Android (for mobile app)
4. Create credentials (API Key)
5. Add the key to:
   - Dashboard: `dashboard/.env` as `VITE_GOOGLE_MAPS_API_KEY`
   - Mobile: `mobile/app.json` under `android.config.googleMaps.apiKey`

## License

MIT
