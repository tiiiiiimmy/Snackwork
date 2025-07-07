import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import type { Location } from '../../types/api';
import { googleMapsLoader } from '../../utils/googleMaps';

interface LocationPickerProps {
  initialLocation?: Location | null;
  onLocationSelected: (location: Location, address: string) => void;
  onClose: () => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationSelected,
  onClose,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
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

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || map) return;

    const defaultCenter = initialLocation || { lat: -36.8485, lng: 174.7633 }; // Auckland

    const newMap = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 15,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    const newGeocoder = new google.maps.Geocoder();
    setGeocoder(newGeocoder);

    const newMarker = new google.maps.Marker({
      position: defaultCenter,
      map: newMap,
      draggable: true,
      title: 'Snack location',
    });

    // Update selected location when marker is dragged
    newMarker.addListener('dragend', () => {
      const position = newMarker.getPosition();
      if (position) {
        const newLocation = {
          lat: position.lat(),
          lng: position.lng(),
        };
        setSelectedLocation(newLocation);
        reverseGeocode(newLocation, newGeocoder);
      }
    });

    // Update marker position when map is clicked
    newMap.addListener('click', (event: google.maps.MapMouseEvent) => {
      const lat = event.latLng?.lat();
      const lng = event.latLng?.lng();
      if (lat !== undefined && lng !== undefined) {
        const newLocation = { lat, lng };
        newMarker.setPosition(newLocation);
        setSelectedLocation(newLocation);
        reverseGeocode(newLocation, newGeocoder);
      }
    });

    setMap(newMap);
    setMarker(newMarker);
    setLoading(false);

    // Get initial address if we have a location
    if (initialLocation) {
      reverseGeocode(initialLocation, newGeocoder);
    }

    return () => {
      newMarker.setMap(null);
    };
  }, [initialLocation, isGoogleMapsLoaded]);

  const reverseGeocode = async (location: Location, geocoderInstance: google.maps.Geocoder) => {
    try {
      const response = await geocoderInstance.geocode({
        location: { lat: location.lat, lng: location.lng },
      });

      if (response.results && response.results.length > 0) {
        setAddress(response.results[0].formatted_address);
      } else {
        setAddress('Unknown location');
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      setAddress('Address not found');
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelected(selectedLocation, address);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (map && marker) {
          map.setCenter(newLocation);
          marker.setPosition(newLocation);
          setSelectedLocation(newLocation);
          if (geocoder) {
            reverseGeocode(newLocation, geocoder);
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Failed to get current location');
      }
    );
  };

  if (!window.google || !window.google.maps) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-red-100 to-pink-200 rounded-3xl p-8 max-w-md mx-4 border-4 border-red-300 shadow-2xl transform animate-pulse">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️❌</div>
            <h3 className="text-2xl font-bold text-red-600 mb-4">Map Magic Unavailable</h3>
            <p className="text-red-500 font-medium mb-6">
              Google Maps API is not available. Please ensure you have a valid API key configured.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white px-6 py-3 rounded-full font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col border-4 border-purple-300 shadow-2xl transform scale-95 animate-[fadeIn_0.3s_ease-out_forwards]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-purple-200 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📍</span>
            <h3 className="text-2xl font-bold text-purple-800">Choose Snack Location</h3>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-white text-purple-600 hover:bg-purple-100 shadow-lg transform hover:scale-110 transition-all duration-200 border-2 border-purple-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative p-4">
          {loading && (
            <div className="absolute inset-4 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl border-3 border-purple-300 z-10">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🗺️</div>
                <LoadingSpinner size="lg" className="mb-4" />
                <p className="text-purple-600 font-bold text-lg">Loading magical map...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full rounded-2xl border-3 border-purple-300 shadow-lg overflow-hidden" />
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-purple-200 bg-gradient-to-r from-green-100 to-blue-100 rounded-b-3xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 space-y-2">
              <p className="text-lg font-bold text-purple-800 flex items-center space-x-2">
                <span>📍</span>
                <span>Selected location:</span>
              </p>
              <p className="text-base font-medium text-purple-700 bg-white/70 rounded-full px-4 py-2 shadow-md">
                {address || '🎯 Click or drag marker to select location'}
              </p>
              {selectedLocation && (
                <p className="text-sm text-purple-600 bg-purple-100 rounded-full px-3 py-1 inline-block shadow-sm">
                  🌐 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              )}
            </div>
            <button
              onClick={handleCurrentLocation}
              className="ml-6 px-6 py-3 text-base font-bold text-white bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full hover:from-blue-500 hover:to-cyan-600 shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-white"
            >
              📱 Use Current Location
            </button>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-base font-bold text-purple-700 bg-white border-3 border-purple-300 rounded-full hover:bg-purple-50 shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedLocation}
              className="px-8 py-3 text-base font-bold text-white bg-gradient-to-r from-green-400 to-emerald-500 rounded-full hover:from-green-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-white"
            >
              ✅ Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
