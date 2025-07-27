import React, { useEffect, useRef, useState } from 'react';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import type { Snack, Location } from '../../types/api';
import { googleMapsLoader } from '../../utils/googleMaps';

interface MapContainerProps {
  center?: Location;
  snacks: Snack[];
  loading: boolean;
  onLocationChange?: (location: Location) => void;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  center,
  snacks,
  loading,
  onLocationChange,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Load Google Maps API using the global loader
  useEffect(() => {
    const loadMaps = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        await googleMapsLoader.loadGoogleMaps(apiKey);
        setIsGoogleMapsLoaded(true);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        setMapError(error instanceof Error ? error.message : 'Failed to load Google Maps');
      }
    };

    if (googleMapsLoader.isGoogleMapsLoaded()) {
      setIsGoogleMapsLoaded(true);
    } else {
      loadMaps();
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || map) return;

    const defaultCenter = center || { lat: -36.8485, lng: 174.7633 }; // Auckland

    const newMap = new google.maps.Map(mapRef.current, {
      zoom: 14,
      center: defaultCenter,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    // Add click listener for location changes
    if (onLocationChange) {
      newMap.addListener('click', (event: google.maps.MapMouseEvent) => {
        const lat = event.latLng?.lat();
        const lng = event.latLng?.lng();
        if (lat !== undefined && lng !== undefined) {
          onLocationChange({ lat, lng });
        }
      });
    }

    setMap(newMap);
  }, [isGoogleMapsLoaded, center, map, onLocationChange]);

  // Update map center when center prop changes
  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  // Update markers when snacks change
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));

    // Create new markers
    const newMarkers = snacks.map(snack => {
      // Create a properly sized SVG marker
      const svgMarker = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="12" cy="12" r="6" fill="#FFFFFF"/>
            <circle cx="12" cy="12" r="3" fill="#3B82F6"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(24, 32),
        anchor: new google.maps.Point(12, 32),
      };

      const marker = new google.maps.Marker({
        position: { lat: snack.store.latitude, lng: snack.store.longitude },
        map,
        title: snack.name,
        icon: svgMarker,
      });

      // Add info window with clean styling
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 280px; font-family: Inter, sans-serif;">
            <h3 style="font-weight: 700; color: #111827; margin-bottom: 8px; font-size: 16px; line-height: 1.4; margin-top: 0;">${snack.name}</h3>
            ${snack.description ? `<p style="font-size: 14px; color: #4b5563; margin-bottom: 8px; line-height: 1.5; margin-top: 0;">${snack.description}</p>` : ''}
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px; margin-top: 0;">${snack.store.name || 'Location'}</p>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="color: #f59e0b;">⭐</span>
                <span style="font-size: 14px; font-weight: 500; color: #374151;">${snack.averageRating || 'No rating'}</span>
              </div>
              <a href="/snacks/${snack.id}" style="display: inline-flex; align-items: center; padding: 4px 12px; background: #3b82f6; color: white; text-decoration: none; font-size: 12px; font-weight: 500; border-radius: 9999px; transition: background-color 0.2s;">
                View Details
              </a>
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    markersRef.current = newMarkers;
  }, [map, snacks]);

  // Cleanup markers on component unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, []);

  // Handle map error
  if (mapError) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">😵</div>
          <h3 className="error-title">Map Unavailable</h3>
          <p className="error-message">{mapError}</p>
        </div>
      </div>
    );
  }

  if (!isGoogleMapsLoaded) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-icon">🗺️</div>
          <LoadingSpinner size="lg" />
          <p className="loading-text">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div ref={mapRef} className="map-element" />

      {loading && (
        <div className="map-loading-overlay">
          <LoadingSpinner size="sm" />
          <span className="loading-text">Loading snacks...</span>
        </div>
      )}

      {snacks.length > 0 && !loading && (
        <div className="snack-count-badge">
          <span className="count-text">
            <span>🎯</span>
            <span>{snacks.length} snack{snacks.length !== 1 ? 's' : ''}</span>
          </span>
        </div>
      )}

      {snacks.length === 0 && !loading && (
        <div className="no-snacks-message">
          <span className="message-text">
            <span>🔍</span>
            <span>No snacks found in this area</span>
          </span>
        </div>
      )}
    </div>
  );
};
