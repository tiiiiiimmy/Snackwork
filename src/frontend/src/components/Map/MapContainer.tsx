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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
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
  }, [isGoogleMapsLoaded, center, onLocationChange, map]);

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
    markers.forEach(marker => marker.setMap(null));

    // Create new markers
    const newMarkers = snacks.map(snack => {
      const marker = new google.maps.Marker({
        position: { lat: snack.latitude, lng: snack.longitude },
        map,
        title: snack.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="16" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        },
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2 max-w-xs">
            <h3 class="font-semibold text-gray-900 mb-1">${snack.name}</h3>
            <p class="text-sm text-gray-600 mb-2">$${snack.price.toFixed(2)}</p>
            <p class="text-xs text-gray-500">${snack.location}</p>
            <div class="mt-2">
              <a href="/snacks/${snack.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">View Details</a>
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [map, snacks]);

  // Handle map error
  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-red-100 via-pink-100 to-purple-100">
        <div className="text-center max-w-md px-6 py-8 bg-white rounded-3xl border-4 border-red-300 shadow-2xl transform hover:scale-105 transition-transform duration-300">
          <div className="text-6xl mb-4">😵</div>
          <h3 className="text-2xl font-bold text-red-600 mb-4">Oops! Map Unavailable</h3>
          <p className="text-red-500 font-medium">{mapError}</p>
        </div>
      </div>
    );
  }

  if (!isGoogleMapsLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="text-center px-6 py-8 bg-white rounded-3xl border-4 border-blue-300 shadow-2xl">
          <div className="text-6xl mb-4 animate-bounce">🗺️</div>
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-blue-600 font-bold text-lg">Loading magical map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full rounded-3xl overflow-hidden border-4 border-purple-300 shadow-2xl">
      <div ref={mapRef} className="w-full h-full" />

      {loading && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-xl px-6 py-3 flex items-center space-x-3 border-3 border-white animate-pulse">
          <LoadingSpinner size="sm" />
          <span className="text-white font-bold">🍿 Loading tasty snacks...</span>
        </div>
      )}

      {snacks.length > 0 && (
        <div className="absolute top-6 right-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-xl px-4 py-3 border-3 border-white transform hover:scale-110 transition-transform duration-200">
          <span className="text-white font-bold flex items-center space-x-2">
            <span className="text-xl">🎯</span>
            <span>{snacks.length} snack{snacks.length !== 1 ? 's' : ''} found!</span>
          </span>
        </div>
      )}
    </div>
  );
};
