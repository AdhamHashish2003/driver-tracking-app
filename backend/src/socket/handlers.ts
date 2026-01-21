import { Server, Socket } from 'socket.io';
import db from '../db/sqlite';

interface LocationUpdate {
  driverId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
}

interface StatusUpdate {
  driverId: string;
  status: 'offline' | 'available' | 'on_route' | 'on_break';
}

interface DeliveryUpdate {
  deliveryId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  notes?: string;
}

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Driver joins their room
    socket.on('driver:join', (driverId: string) => {
      socket.join(`driver:${driverId}`);
      console.log(`Driver ${driverId} joined`);
    });

    // Dashboard joins to receive all updates
    socket.on('dashboard:join', () => {
      socket.join('dashboard');
      console.log('Dashboard client joined');

      // Send current state of all drivers
      const drivers = db.getAllDrivers();
      socket.emit('drivers:update', drivers);
    });

    // Handle location updates from drivers
    socket.on('driver:location', (data: LocationUpdate) => {
      const { driverId, lat, lng, speed, heading } = data;
      const now = new Date().toISOString();

      // Update driver's current location
      db.updateDriver(driverId, {
        current_lat: lat,
        current_lng: lng,
        speed: speed || 0,
        heading: heading || 0,
        last_seen: now,
      });

      // Save to location history
      db.addLocation({
        driver_id: driverId,
        lat,
        lng,
        speed: speed || 0,
        heading: heading || 0,
      });

      // Broadcast to dashboard
      const drivers = db.getAllDrivers();
      io.to('dashboard').emit('drivers:update', drivers);

      // Also emit individual driver update
      io.to('dashboard').emit('driver:location:update', {
        driverId,
        lat,
        lng,
        speed,
        heading,
        timestamp: now,
      });
    });

    // Handle status updates
    socket.on('driver:status', (data: StatusUpdate) => {
      const { driverId, status } = data;

      db.updateDriver(driverId, {
        status,
        last_seen: new Date().toISOString(),
      });

      // Broadcast to dashboard
      const drivers = db.getAllDrivers();
      io.to('dashboard').emit('drivers:update', drivers);
    });

    // Handle delivery updates
    socket.on('delivery:update', (data: DeliveryUpdate) => {
      const { deliveryId, status, notes } = data;
      const completedAt = (status === 'completed' || status === 'failed')
        ? new Date().toISOString()
        : null;

      const delivery = db.updateDelivery(deliveryId, {
        status,
        notes: notes || undefined,
        completed_at: completedAt,
      });

      // Notify dashboard
      io.to('dashboard').emit('delivery:updated', delivery);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
