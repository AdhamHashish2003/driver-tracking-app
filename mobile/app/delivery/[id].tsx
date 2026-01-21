import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, Delivery } from '../../services/api';
import { socketService } from '../../services/socket';

const STATUS_OPTIONS = [
  { key: 'in_progress', label: 'Start Delivery', color: '#3b82f6', icon: 'navigate' },
  { key: 'completed', label: 'Mark Completed', color: '#22c55e', icon: 'checkmark-circle' },
  { key: 'failed', label: 'Mark Failed', color: '#ef4444', icon: 'close-circle' },
];

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDelivery();
  }, [id]);

  const loadDelivery = async () => {
    if (!id) return;
    
    try {
      const res = await fetch('http://localhost:3000/api/deliveries/' + id);
      const data = await res.json();
      setDelivery(data);
    } catch (error) {
      console.error('Failed to load delivery:', error);
      Alert.alert('Error', 'Failed to load delivery details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!delivery) return;

    const action = newStatus === 'completed' ? 'complete' : newStatus === 'failed' ? 'mark as failed' : 'start';
    
    Alert.alert(
      'Confirm',
      'Are you sure you want to ' + action + ' this delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const updated = await api.updateDeliveryStatus(delivery.id, newStatus);
              setDelivery(updated);
              socketService.updateDelivery(delivery.id, newStatus);
              
              if (newStatus === 'completed' || newStatus === 'failed') {
                Alert.alert('Success', 'Delivery updated!', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to update delivery');
            }
          },
        },
      ]
    );
  };

  const openNavigation = () => {
    if (!delivery?.lat || !delivery?.lng) {
      Alert.alert('Error', 'No coordinates available for this delivery');
      return;
    }
    
    const url = 'https://www.google.com/maps/dir/?api=1&destination=' + delivery.lat + ',' + delivery.lng;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Delivery not found</Text>
      </View>
    );
  }

  const isActive = delivery.status === 'pending' || delivery.status === 'in_progress';

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <Text style={styles.customerName}>{delivery.customer_name}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{delivery.status.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Address Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location" size={24} color="#3b82f6" />
          <Text style={styles.cardTitle}>Delivery Address</Text>
        </View>
        <Text style={styles.address}>{delivery.address}</Text>
        
        <TouchableOpacity style={styles.navigateButton} onPress={openNavigation}>
          <Ionicons name="navigate" size={20} color="#fff" />
          <Text style={styles.navigateButtonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Notes Card */}
      {delivery.notes && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={24} color="#3b82f6" />
            <Text style={styles.cardTitle}>Notes</Text>
          </View>
          <Text style={styles.notes}>{delivery.notes}</Text>
        </View>
      )}

      {/* Action Buttons */}
      {isActive && (
        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>Update Status</Text>
          
          {STATUS_OPTIONS.filter(opt => {
            if (delivery.status === 'pending') return opt.key === 'in_progress';
            if (delivery.status === 'in_progress') return opt.key === 'completed' || opt.key === 'failed';
            return false;
          }).map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.actionButton, { backgroundColor: opt.color }]}
              onPress={() => handleStatusUpdate(opt.key)}
            >
              <Ionicons name={opt.icon as any} size={24} color="#fff" />
              <Text style={styles.actionButtonText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Completed Info */}
      {delivery.completed_at && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={24} color="#22c55e" />
            <Text style={styles.cardTitle}>Completed</Text>
          </View>
          <Text style={styles.completedTime}>
            {new Date(delivery.completed_at).toLocaleString()}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    backgroundColor: '#3b82f6',
    padding: 24,
    alignItems: 'center',
  },
  customerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  address: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 16,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notes: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  actionsSection: {
    padding: 16,
    gap: 12,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 18,
    gap: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  completedTime: {
    fontSize: 16,
    color: '#475569',
  },
});
