import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Driver } from '../../services/api';
import { socketService } from '../../services/socket';
import { locationService } from '../../services/location';

export default function ProfileScreen() {
  const [driver, setDriver] = useState<Driver | null>(null);

  useEffect(() => {
    loadDriver();
  }, []);

  const loadDriver = async () => {
    try {
      const stored = await AsyncStorage.getItem('driver');
      if (stored) {
        setDriver(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load driver:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Stop tracking
            locationService.stopTracking();
            socketService.disconnect();
            
            // Clear storage
            await AsyncStorage.removeItem('driver');
            
            // Navigate to login
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {driver?.name?.charAt(0)?.toUpperCase() || 'D'}
          </Text>
        </View>
        <Text style={styles.name}>{driver?.name || 'Driver'}</Text>
        <Text style={styles.email}>{driver?.email || ''}</Text>
      </View>

      {/* Info Cards */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="call-outline" size={24} color="#3b82f6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{driver?.phone || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="id-card-outline" size={24} color="#3b82f6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Driver ID</Text>
            <Text style={styles.infoValue}>{driver?.id || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="pulse-outline" size={24} color="#22c55e" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
              {driver?.status?.replace('_', ' ') || 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Driver Tracker v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#64748b',
  },
  infoSection: {
    padding: 16,
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoContent: {
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 32,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  version: {
    textAlign: 'center',
    marginTop: 16,
    color: '#9ca3af',
    fontSize: 12,
  },
});
