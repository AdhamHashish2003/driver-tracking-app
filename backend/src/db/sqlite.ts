// In-memory database store (no native dependencies needed)

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  current_lat: number | null;
  current_lng: number | null;
  heading: number | null;
  speed: number | null;
  last_seen: string | null;
  created_at: string;
}

export interface Delivery {
  id: string;
  driver_id: string;
  customer_name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  status: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Location {
  id: number;
  driver_id: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  recorded_at: string;
}

// In-memory data store
class Database {
  drivers: Map<string, Driver> = new Map();
  deliveries: Map<string, Delivery> = new Map();
  locations: Location[] = [];
  private locationIdCounter = 1;

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed demo drivers
    const drivers: Driver[] = [
      { id: 'driver-1', name: 'Ahmed Hassan', email: 'ahmed@fleet.com', phone: '+20 100 123 4567', status: 'available', current_lat: 30.0444, current_lng: 31.2357, heading: null, speed: null, last_seen: new Date().toISOString(), created_at: new Date().toISOString() },
      { id: 'driver-2', name: 'Mohamed Ali', email: 'mohamed@fleet.com', phone: '+20 100 234 5678', status: 'on_route', current_lat: 30.0626, current_lng: 31.2497, heading: null, speed: null, last_seen: new Date().toISOString(), created_at: new Date().toISOString() },
      { id: 'driver-3', name: 'Sara Ibrahim', email: 'sara@fleet.com', phone: '+20 100 345 6789', status: 'offline', current_lat: 30.0331, current_lng: 31.2336, heading: null, speed: null, last_seen: null, created_at: new Date().toISOString() },
    ];

    drivers.forEach(d => this.drivers.set(d.id, d));

    // Seed demo deliveries
    const deliveries: Delivery[] = [
      { id: 'del-1', driver_id: 'driver-2', customer_name: 'Carrefour Mall', address: 'City Stars, Nasr City, Cairo', lat: 30.0729, lng: 31.3454, status: 'in_progress', notes: null, completed_at: null, created_at: new Date().toISOString() },
      { id: 'del-2', driver_id: 'driver-2', customer_name: 'Tech Store', address: 'Mall of Arabia, 6th October', lat: 29.9726, lng: 30.9425, status: 'pending', notes: null, completed_at: null, created_at: new Date().toISOString() },
      { id: 'del-3', driver_id: 'driver-1', customer_name: 'Home Delivery', address: 'Maadi, Cairo', lat: 29.9602, lng: 31.2569, status: 'pending', notes: null, completed_at: null, created_at: new Date().toISOString() },
    ];

    deliveries.forEach(d => this.deliveries.set(d.id, d));

    console.log('Database seeded with demo data');
  }

  // Driver methods
  getAllDrivers(): Driver[] {
    return Array.from(this.drivers.values());
  }

  getDriver(id: string): Driver | undefined {
    return this.drivers.get(id);
  }

  getDriverByEmail(email: string): Driver | undefined {
    const normalizedEmail = email.toLowerCase();
    return Array.from(this.drivers.values()).find(d => d.email.toLowerCase() === normalizedEmail);
  }

  updateDriver(id: string, updates: Partial<Driver>): Driver | undefined {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;
    const updated = { ...driver, ...updates };
    this.drivers.set(id, updated);
    return updated;
  }

  // Delivery methods
  getAllDeliveries(): Delivery[] {
    return Array.from(this.deliveries.values());
  }

  getDelivery(id: string): Delivery | undefined {
    return this.deliveries.get(id);
  }

  getDeliveriesByDriver(driverId: string): Delivery[] {
    return Array.from(this.deliveries.values())
      .filter(d => d.driver_id === driverId)
      .sort((a, b) => {
        const statusOrder: Record<string, number> = { in_progress: 1, pending: 2, completed: 3, failed: 4 };
        return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
      });
  }

  createDelivery(delivery: Omit<Delivery, 'created_at'>): Delivery {
    const newDelivery: Delivery = { ...delivery, created_at: new Date().toISOString() };
    this.deliveries.set(delivery.id, newDelivery);
    return newDelivery;
  }

  updateDelivery(id: string, updates: Partial<Delivery>): Delivery | undefined {
    const delivery = this.deliveries.get(id);
    if (!delivery) return undefined;
    const updated = { ...delivery, ...updates };
    this.deliveries.set(id, updated);
    return updated;
  }

  // Location methods
  addLocation(location: Omit<Location, 'id' | 'recorded_at'>): Location {
    const newLocation: Location = {
      ...location,
      id: this.locationIdCounter++,
      recorded_at: new Date().toISOString(),
    };
    this.locations.push(newLocation);
    // Keep only last 1000 locations to prevent memory issues
    if (this.locations.length > 1000) {
      this.locations = this.locations.slice(-1000);
    }
    return newLocation;
  }

  getLocationsByDriver(driverId: string, limit = 100): Location[] {
    return this.locations
      .filter(l => l.driver_id === driverId)
      .slice(-limit)
      .reverse();
  }
}

const db = new Database();
export default db;
