import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, Delivery } from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  failed: '#ef4444',
};

const STATUS_ICONS: Record<string, string> = {
  pending: 'time-outline',
  in_progress: 'navigate',
  completed: 'checkmark-circle',
  failed: 'close-circle',
};

export default function DeliveriesScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      const stored = await AsyncStorage.getItem('driver');
      if (stored) {
        const driver = JSON.parse(stored);
        const data = await api.getDeliveries(driver.id);
        setDeliveries(data);
      }
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDeliveries();
    setRefreshing(false);
  }, []);

  const renderDelivery = ({ item }: { item: Delivery }) => {
    const statusColor = STATUS_COLORS[item.status] || '#9ca3af';
    const statusIcon = STATUS_ICONS[item.status] || 'help-circle';

    return (
      <TouchableOpacity
        style={styles.deliveryCard}
        onPress={() => router.push('/delivery/' + item.id)}
      >
        <View style={styles.deliveryHeader}>
          <View style={styles.deliveryIconContainer}>
            <Ionicons name={statusIcon as any} size={24} color={statusColor} />
          </View>
          <View style={styles.deliveryInfo}>
            <Text style={styles.customerName}>{item.customer_name}</Text>
            <Text style={styles.address}>{item.address}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        
        <View style={styles.deliveryFooter}>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    );
  };

  const activeDeliveries = deliveries.filter(d => d.status === 'in_progress' || d.status === 'pending');
  const completedDeliveries = deliveries.filter(d => d.status === 'completed' || d.status === 'failed');

  return (
    <View style={styles.container}>
      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderDelivery}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{activeDeliveries.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: '#22c55e' }]}>
                  {completedDeliveries.filter(d => d.status === 'completed').length}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: '#ef4444' }]}>
                  {completedDeliveries.filter(d => d.status === 'failed').length}
                </Text>
                <Text style={styles.statLabel}>Failed</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No deliveries assigned</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  deliveryFooter: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});
