import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import driversRouter from './routes/drivers';
import deliveriesRouter from './routes/deliveries';
import { setupSocketHandlers } from './socket/handlers';

const app = express();
const httpServer = createServer(app);

// Socket.IO setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:19006', 'http://localhost:8081', '*'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/drivers', driversRouter);
app.use('/api/deliveries', deliveriesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
  ==========================================
  🚚 Driver Tracking Backend Running!
  ==========================================
  
  REST API:    http://localhost:${PORT}/api
  Socket.IO:   http://localhost:${PORT}
  
  Endpoints:
  - GET    /api/drivers          - List all drivers
  - GET    /api/drivers/:id      - Get driver details
  - POST   /api/drivers/login    - Driver login
  - PATCH  /api/drivers/:id/status - Update driver status
  - POST   /api/drivers/:id/location - Update location
  
  - GET    /api/deliveries       - List deliveries
  - GET    /api/deliveries/driver/:id - Driver's deliveries
  - PATCH  /api/deliveries/:id/status - Update delivery
  
  Socket Events:
  - driver:join, driver:location, driver:status
  - dashboard:join, drivers:update
  ==========================================
  `);
});

export { io };
