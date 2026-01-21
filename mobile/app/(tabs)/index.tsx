import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, Driver } from '../../services/api';
import { socketService } from '../../services/socket';
import { locationService } from '../../services/location';

const STATUS_OPTIONS = [
  { key: 'available', label: 'Available', color: '#22c55e', icon: 'checkmark-circle' },
  { key: 'on_route', label: 'On Route', color: '#3b82f6', icon: 'navigate' },
  { key: 'on_break', label: 'On Break', color: '#f59e0b', icon: 'cafe' },
  { key: 'offline', label: 'Offline', color: '#9ca3af', icon: 'power' },
];

export default function HomeScreen() {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState('available');

  useEffect(() => {
    loadDriver();
    getCurrentLocation();
  }, []);

  const loadDriver = async () => {
    try {
      const stored = await AsyncStorage.getItem('driver');
      if (stored) {
        const d = JSON.parse(stored);
        setDriver(d);
        setStatus(d.status || 'available');
      }
    } catch (error) {
      console.error('Failed to load driver:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const loc = await locationService.getCurrentLocation();
      setCurrentLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!driver) return;

    setStatus(newStatus);
    
    // Update via API
    try {
      const updated = await api.updateStatus(driver.id, newStatus);
      setDriver(updated);
      await AsyncStorage.setItem('driver', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update status:', error);
    }

    // Also update via socket
    socketService.updateStatus(newStatus);
  };

  const currentStatusOption = STATUS_OPTIONS.find(s => s.key === status) || STATUS_OPTIONS[0];

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            <Marker
              coordinate={{
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
              }}
              title="You are here"
            />
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Loading map...</Text>
          </View>
        )}
      </View>

      {/* Current Status */}
      <View style={styles.statusBanner}>
        <Ionicons name={currentStatusOption.icon as any} size={24} color={currentStatusOption.color} />
        <Text style={[styles.statusText, { color: currentStatusOption.color }]}>
          {currentStatusOption.label}
        </Text>
      </View>

      {/* Status Buttons */}
      <View style={styles.statusGrid}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.statusButton,
              status === opt.key && { backgroundColor: opt.color + '20', borderColor: opt.color },
            ]}
            onPress={() => handleStatusChange(opt.key)}
          >
            <Ionicons
              name={opt.icon as any}
              size={28}
              color={status === opt.key ? opt.color : '#9ca3af'}
            />
            <Text
              style={[
                styles.statusButtonText,
                status === opt.key && { color: opt.color },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Hello, {driver?.name || 'Driver'}</Text>
        <Text style={styles.infoText}>
          Your location is being tracked and shared with fleet managers.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mapContainer: {
    height: Dimensions.get('window').height * 0.35,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    color: '#6b7280',
    fontSize: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statusButton: {
    width: '47%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  infoCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});
