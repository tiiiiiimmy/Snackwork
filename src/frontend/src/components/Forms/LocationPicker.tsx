import React, { useRef, useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import type { Location } from '../../types/api';

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

  useEffect(() => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      setLoading(false);
      return;
    }

    if (!mapRef.current) return;

    const defaultCenter = initialLocation || { lat: -36.8485, lng: 174.7633 }; // Auckland
    
    const newMap = new google.maps.Map(mapRef.current, {
      zoom: 15,
      center: defaultCenter,
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
  }, [initialLocation]);

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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Map Unavailable</h3>
          <p className="text-gray-600 mb-4">
            Google Maps API is not available. Please ensure you have a valid API key configured.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Choose Snack Location</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <LoadingSpinner size="lg" className="mb-4" />
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Selected location:</p>
              <p className="text-sm font-medium text-gray-900">
                {address || 'Click or drag marker to select location'}
              </p>
              {selectedLocation && (
                <p className="text-xs text-gray-500">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </p>
              )}
            </div>
            <button
              onClick={handleCurrentLocation}
              className="ml-4 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
            >
              Use Current Location
            </button>
          </div>
          
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedLocation}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
