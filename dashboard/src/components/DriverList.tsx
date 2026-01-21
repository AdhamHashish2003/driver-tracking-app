import React from 'react';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  current_lat: number | null;
  current_lng: number | null;
  last_seen: string | null;
}

interface DriverListProps {
  drivers: Driver[];
  selectedDriver: string | null;
  onSelectDriver: (id: string | null) => void;
}

const STATUS_COLORS: Record<string, string> = {
  available: '#22c55e',
  on_route: '#3b82f6',
  on_break: '#f59e0b',
  offline: '#9ca3af',
};

export function DriverList({ drivers, selectedDriver, onSelectDriver }: DriverListProps) {
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return diffMins + 'm ago';
    return date.toLocaleTimeString();
  };

  return (
    <div className="driver-list">
      {drivers.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
          No drivers found
        </div>
      ) : (
        drivers.map((driver) => (
          <div
            key={driver.id}
            className={'driver-card ' + (selectedDriver === driver.id ? 'selected' : '')}
            onClick={() => onSelectDriver(selectedDriver === driver.id ? null : driver.id)}
          >
            <div className="driver-header">
              <span className="driver-name">{driver.name}</span>
              <span
                className="driver-status"
                style={{
                  backgroundColor: STATUS_COLORS[driver.status] + '20',
                  color: STATUS_COLORS[driver.status]
                }}
              >
                {driver.status.replace('_', ' ')}
              </span>
            </div>
            <div className="driver-info">
              <p>📱 {driver.phone || 'No phone'}</p>
              {driver.current_lat && driver.current_lng && (
                <p>📍 {driver.current_lat.toFixed(4)}, {driver.current_lng.toFixed(4)}</p>
              )}
              <p className="last-updated">Last seen: {formatTime(driver.last_seen)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
