import React, { useEffect, useState } from 'react';
import { socketService } from './services/socket';
import { DriverList } from './components/DriverList';
import { LiveMap } from './components/LiveMap';

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

// Replace with your Google Maps API key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function App() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(!GOOGLE_MAPS_API_KEY);
  const [apiKey, setApiKey] = useState(GOOGLE_MAPS_API_KEY);
  const [tempApiKey, setTempApiKey] = useState('');

  useEffect(() => {
    // Connect to socket
    socketService.connect();

    // Check connection status
    const checkConnection = setInterval(() => {
      setIsConnected(socketService.isConnected());
    }, 1000);

    // Listen for driver updates
    const unsubscribe = socketService.on('drivers:update', (data: Driver[]) => {
      console.log('Drivers updated:', data);
      setDrivers(data);
    });

    // Fetch initial drivers via REST as fallback
    fetch('http://localhost:3000/api/drivers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDrivers(data);
        }
      })
      .catch(console.error);

    return () => {
      clearInterval(checkConnection);
      unsubscribe();
      socketService.disconnect();
    };
  }, []);

  const stats = {
    total: drivers.length,
    available: drivers.filter((d) => d.status === 'available').length,
    onRoute: drivers.filter((d) => d.status === 'on_route').length,
    offline: drivers.filter((d) => d.status === 'offline').length,
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      setShowApiKeyInput(false);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Fleet Dashboard</h1>
          <p>Real-time driver tracking</p>
        </div>

        <DriverList
          drivers={drivers}
          selectedDriver={selectedDriver}
          onSelectDriver={setSelectedDriver}
        />

        <div className="stats-bar">
          <div className="stat">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat">
            <div className="stat-value">{stats.available}</div>
            <div className="stat-label">Available</div>
          </div>
          <div className="stat">
            <div className="stat-value">{stats.onRoute}</div>
            <div className="stat-label">On Route</div>
          </div>
          <div className="stat">
            <div className="stat-value">{stats.offline}</div>
            <div className="stat-label">Offline</div>
          </div>
        </div>
      </aside>

      <main className="map-container">
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </div>

        {showApiKeyInput || !apiKey ? (
          <div className="map-placeholder">
            <h2>Google Maps API Key Required</h2>
            <p style={{ marginBottom: '20px' }}>
              Enter your API key or set VITE_GOOGLE_MAPS_API_KEY in .env
            </p>
            <form onSubmit={handleApiKeySubmit} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Enter Google Maps API Key"
                style={{
                  padding: '10px 15px',
                  fontSize: '1rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  width: '350px',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  fontSize: '1rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Load Map
              </button>
            </form>
            <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#888' }}>
              Get a free API key from{' '}
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank">
                Google Cloud Console
              </a>
            </p>
          </div>
        ) : (
          <LiveMap
            drivers={drivers}
            selectedDriver={selectedDriver}
            onSelectDriver={setSelectedDriver}
            apiKey={apiKey}
          />
        )}
      </main>
    </div>
  );
}

export default App;
