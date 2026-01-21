// Use environment variable or fallback to production URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://driver-tracking-app-2.onrender.com/api';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  current_lat: number | null;
  current_lng: number | null;
  last_seen: string | null;
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

export const api = {
  async login(email: string): Promise<Driver> {
    const res = await fetch(API_URL + '/drivers/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async getDriver(id: string): Promise<Driver> {
    const res = await fetch(API_URL + '/drivers/' + id);
    if (!res.ok) throw new Error('Failed to fetch driver');
    return res.json();
  },

  async updateStatus(driverId: string, status: string): Promise<Driver> {
    const res = await fetch(API_URL + '/drivers/' + driverId + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async updateLocation(driverId: string, lat: number, lng: number, speed?: number, heading?: number): Promise<void> {
    await fetch(API_URL + '/drivers/' + driverId + '/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng, speed, heading }),
    });
  },

  async getDeliveries(driverId: string): Promise<Delivery[]> {
    const res = await fetch(API_URL + '/deliveries/driver/' + driverId);
    if (!res.ok) throw new Error('Failed to fetch deliveries');
    return res.json();
  },

  async updateDeliveryStatus(deliveryId: string, status: string, notes?: string): Promise<Delivery> {
    const res = await fetch(API_URL + '/deliveries/' + deliveryId + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    if (!res.ok) throw new Error('Failed to update delivery');
    return res.json();
  },
};
