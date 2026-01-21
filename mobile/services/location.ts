import * as Location from 'expo-location';
import { socketService } from './socket';
import { api } from './api';

class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private driverId: string | null = null;
  private isTracking = false;

  async requestPermissions(): Promise<boolean> {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.log('Foreground location permission denied');
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.log('Background location permission denied (optional)');
    }

    return true;
  }

  async startTracking(driverId: string): Promise<void> {
    if (this.isTracking) return;

    this.driverId = driverId;
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    this.isTracking = true;

    // Get initial location
    const initialLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    this.handleLocationUpdate(initialLocation);

    // Start watching location
    this.watchId = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Or when moved 10 meters
      },
      (location) => {
        this.handleLocationUpdate(location);
      }
    );
  }

  private handleLocationUpdate(location: Location.LocationObject): void {
    if (!this.driverId) return;

    const { latitude, longitude, speed, heading } = location.coords;

    // Send via socket for real-time updates
    socketService.sendLocation(
      latitude,
      longitude,
      speed ? speed * 3.6 : 0, // Convert m/s to km/h
      heading || 0
    );

    // Also update via API as backup
    api.updateLocation(
      this.driverId,
      latitude,
      longitude,
      speed ? speed * 3.6 : 0,
      heading || 0
    ).catch(console.error);
  }

  stopTracking(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
    this.isTracking = false;
    this.driverId = null;
  }

  async getCurrentLocation(): Promise<Location.LocationObject> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    return Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  }
}

export const locationService = new LocationService();
