import { Router } from 'express';
import db from '../db/sqlite';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all deliveries
router.get('/', (req, res) => {
  const { driver_id, status } = req.query;

  let deliveries = db.getAllDeliveries();

  if (driver_id) {
    deliveries = deliveries.filter(d => d.driver_id === driver_id);
  }

  if (status) {
    deliveries = deliveries.filter(d => d.status === status);
  }

  res.json(deliveries);
});

// Get single delivery
router.get('/:id', (req, res) => {
  const delivery = db.getDelivery(req.params.id);
  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found' });
  }
  res.json(delivery);
});

// Create new delivery
router.post('/', (req, res) => {
  const { driver_id, customer_name, address, lat, lng, notes } = req.body;
  const id = uuidv4();

  const delivery = db.createDelivery({
    id,
    driver_id,
    customer_name,
    address,
    lat,
    lng,
    status: 'pending',
    notes: notes || null,
    completed_at: null,
  });

  res.status(201).json(delivery);
});

// Update delivery status
router.patch('/:id/status', (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['pending', 'in_progress', 'completed', 'failed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const completedAt = (status === 'completed' || status === 'failed')
    ? new Date().toISOString()
    : null;

  const delivery = db.updateDelivery(req.params.id, {
    status,
    notes: notes || undefined,
    completed_at: completedAt,
  });

  if (!delivery) {
    return res.status(404).json({ error: 'Delivery not found' });
  }

  res.json(delivery);
});

// Get deliveries for a specific driver
router.get('/driver/:driverId', (req, res) => {
  const deliveries = db.getDeliveriesByDriver(req.params.driverId);
  res.json(deliveries);
});

export default router;
