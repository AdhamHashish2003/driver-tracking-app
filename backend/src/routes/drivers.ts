import { Router } from 'express';
import db from '../db/sqlite';

const router = Router();

// Get all drivers
router.get('/', (req, res) => {
  const drivers = db.getAllDrivers();
  res.json(drivers);
});

// Get single driver
router.get('/:id', (req, res) => {
  const driver = db.getDriver(req.params.id);
  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }
  res.json(driver);
});

// Update driver status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['offline', 'available', 'on_route', 'on_break'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const driver = db.updateDriver(req.params.id, {
    status,
    last_seen: new Date().toISOString(),
  });

  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  res.json(driver);
});

// Update driver location
router.post('/:id/location', (req, res) => {
  const { lat, lng, speed, heading } = req.body;
  const driverId = req.params.id;

  // Validate coordinates
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Invalid coordinates: lat and lng must be numbers' });
  }

  if (lat < -90 || lat > 90) {
    return res.status(400).json({ error: 'Invalid latitude: must be between -90 and 90' });
  }

  if (lng < -180 || lng > 180) {
    return res.status(400).json({ error: 'Invalid longitude: must be between -180 and 180' });
  }

  // Update current location
  const driver = db.updateDriver(driverId, {
    current_lat: lat,
    current_lng: lng,
    speed: speed || 0,
    heading: heading || 0,
    last_seen: new Date().toISOString(),
  });

  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  // Add to location history
  db.addLocation({
    driver_id: driverId,
    lat,
    lng,
    speed: speed || 0,
    heading: heading || 0,
  });

  res.json({ success: true });
});

// Get driver location history
router.get('/:id/locations', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const locations = db.getLocationsByDriver(req.params.id, limit);
  res.json(locations);
});

// Simple login (for MVP - just checks if driver exists)
router.post('/login', (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const driver = db.getDriverByEmail(email.trim().toLowerCase());

  if (!driver) {
    return res.status(401).json({ error: 'Driver not found' });
  }

  // Update to available status on login
  const updated = db.updateDriver(driver.id, {
    status: 'available',
    last_seen: new Date().toISOString(),
  });

  res.json(updated);
});

export default router;
