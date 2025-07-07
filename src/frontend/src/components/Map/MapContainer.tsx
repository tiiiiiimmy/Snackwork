import React, { useEffect, useRef, useState } from 'react';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import type { Snack, Location } from '../../types/api';

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

  // Check if Google Maps is loaded
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsGoogleMapsLoaded(true);
    } else {
      // Load Google Maps API
      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
        console.warn('Google Maps API key not configured. Map will not be available.');
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsGoogleMapsLoaded(true);
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
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

  if (!isGoogleMapsLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center max-w-md px-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map Unavailable</h3>
          <p className="text-gray-600">
            Google Maps API key is not configured. Please set up the API key in your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-md px-4 py-2 flex items-center space-x-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-gray-600">Loading snacks...</span>
        </div>
      )}
      
      {snacks.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2">
          <span className="text-sm font-medium text-gray-900">
            {snacks.length} snack{snacks.length !== 1 ? 's' : ''} found
          </span>
        </div>
      )}
    </div>
  );
};
