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

  // Load Google Maps API using the global loader
  useEffect(() => {
    const loadMaps = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        await googleMapsLoader.loadGoogleMaps(apiKey);
        setIsGoogleMapsLoaded(true);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
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
  }, [initialLocation, isGoogleMapsLoaded, map]);

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
      <div className="location-picker-modal">
        <div className="modal-unavailable">
          <h3 className="unavailable-title">
            Map Unavailable
          </h3>
          <p className="unavailable-text">
            Google Maps API is not available. Please ensure you have a valid API key configured.
          </p>
          <button
            onClick={onClose}
            className="cancel-button unavailable-button"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="location-picker-modal">
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">Choose Snack Location</h3>
          <button
            onClick={onClose}
            className="close-button"
          >
            <XMarkIcon />
          </button>
        </div>

        {/* Map Container */}
        <div className="modal-body">
          {loading && (
            <div className="map-loading-overlay">
              <div className="loading-content">
                <LoadingSpinner size="lg" />
                <p className="loading-text">
                  Loading map...
                </p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="map-container" />

          {/* Location Info */}
          {selectedLocation && (
            <div className="location-info">
              <div className="info-title">Selected Location</div>
              <div className="info-address">
                {address || 'Click or drag marker to select location'}
              </div>
              <div className="info-coordinates">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={handleCurrentLocation}
            className="current-location-button"
          >
            Use Current Location
          </button>
          <button
            onClick={onClose}
            className="cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="confirm-button"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};
