import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface Driver {
  id: string;
  name: string;
  status: string;
  current_lat: number | null;
  current_lng: number | null;
}

interface LiveMapProps {
  drivers: Driver[];
  selectedDriver: string | null;
  onSelectDriver: (id: string | null) => void;
  apiKey: string;
}

const STATUS_COLORS: Record<string, string> = {
  available: '#22c55e',
  on_route: '#3b82f6',
  on_break: '#f59e0b',
  offline: '#9ca3af',
};

export function LiveMap({ drivers, selectedDriver, onSelectDriver, apiKey }: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (!apiKey) return;

      const loader = new Loader({
        apiKey,
        version: 'weekly',
      });

      try {
        await loader.load();

        if (mapRef.current && !googleMapRef.current) {
          googleMapRef.current = new google.maps.Map(mapRef.current, {
            center: { lat: 30.0444, lng: 31.2357 },
            zoom: 12,
            styles: [
              { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
        }
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
      }
    };

    initMap();
  }, [apiKey]);

  // Update markers
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;

    drivers.forEach((driver) => {
      if (driver.current_lat && driver.current_lng) {
        const position = { lat: driver.current_lat, lng: driver.current_lng };
        const color = STATUS_COLORS[driver.status] || STATUS_COLORS.offline;
        const isSelected = driver.id === selectedDriver;
        const size = isSelected ? 20 : 14;

        const svgIcon = '<svg width="' + (size * 2) + '" height="' + (size * 2) + '" viewBox="0 0 ' + (size * 2) + ' ' + (size * 2) + '" xmlns="http://www.w3.org/2000/svg"><circle cx="' + size + '" cy="' + size + '" r="' + (size - 2) + '" fill="' + color + '" stroke="white" stroke-width="3"/>' + (isSelected ? '<circle cx="' + size + '" cy="' + size + '" r="' + (size - 6) + '" fill="white"/>' : '') + '</svg>';

        const icon: google.maps.Icon = {
          url: 'data:image/svg+xml,' + encodeURIComponent(svgIcon),
          scaledSize: new google.maps.Size(size * 2, size * 2),
          anchor: new google.maps.Point(size, size),
        };

        if (markersRef.current.has(driver.id)) {
          const marker = markersRef.current.get(driver.id)!;
          marker.setPosition(position);
          marker.setIcon(icon);
        } else {
          const marker = new google.maps.Marker({
            position,
            map: googleMapRef.current,
            icon,
            title: driver.name,
          });

          marker.addListener('click', () => {
            onSelectDriver(driver.id);
          });

          markersRef.current.set(driver.id, marker);
        }
      }
    });

    // Remove old markers
    markersRef.current.forEach((marker, driverId) => {
      if (!drivers.find((d) => d.id === driverId)) {
        marker.setMap(null);
        markersRef.current.delete(driverId);
      }
    });
  }, [drivers, selectedDriver, onSelectDriver]);

  // Center on selected driver
  useEffect(() => {
    if (selectedDriver && googleMapRef.current) {
      const driver = drivers.find((d) => d.id === selectedDriver);
      if (driver && driver.current_lat && driver.current_lng) {
        googleMapRef.current.panTo({ lat: driver.current_lat, lng: driver.current_lng });
        googleMapRef.current.setZoom(15);
      }
    }
  }, [selectedDriver, drivers]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: STATUS_COLORS.available }}></span>
          Available
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: STATUS_COLORS.on_route }}></span>
          On Route
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: STATUS_COLORS.on_break }}></span>
          On Break
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: STATUS_COLORS.offline }}></span>
          Offline
        </div>
      </div>
    </div>
  );
}
