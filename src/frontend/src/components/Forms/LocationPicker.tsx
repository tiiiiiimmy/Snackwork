import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import type { Location } from '../../types/api';
import { googleMapsLoader } from '../../utils/googleMaps';
import { FocusTrap, announceToScreenReader } from '../../utils/accessibility';

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
  const modalRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<FocusTrap | null>(null);

  // Set up focus trap and escape key handling
  useEffect(() => {
    if (modalRef.current) {
      focusTrapRef.current = new FocusTrap(modalRef.current);
      focusTrapRef.current.activate();
      
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      return () => {
        focusTrapRef.current?.deactivate();
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [onClose]);

  // Load Google Maps API using the global loader
  useEffect(() => {
    const loadMaps = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        await googleMapsLoader.loadGoogleMaps(apiKey);
        setIsGoogleMapsLoaded(true);
        announceToScreenReader('Map loaded successfully');
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        announceToScreenReader('Failed to load map. Please try again.');
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
      announceToScreenReader('Location confirmed');
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
          announceToScreenReader('Current location found and selected');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        announceToScreenReader('Failed to get current location. Please select manually on the map.');
      }
    );
  };

  if (!window.google || !window.google.maps) {
    return (
      <div 
        className="location-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unavailable-title"
      >
        <div className="modal-unavailable" ref={modalRef}>
          <h3 className="unavailable-title" id="unavailable-title">
            Map Unavailable
          </h3>
          <p className="unavailable-text">
            Google Maps API is not available. Please ensure you have a valid API key configured.
          </p>
          <button
            onClick={onClose}
            className="cancel-button unavailable-button"
            aria-label="Close modal"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="location-picker-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content" ref={modalRef}>
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title" id="modal-title">Choose Snack Location</h3>
          <button
            onClick={onClose}
            className="close-button"
            aria-label="Close location picker"
          >
            <XMarkIcon aria-hidden="true" />
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
          <div 
            ref={mapRef} 
            className="map-container"
            role="application"
            aria-label="Interactive map for selecting snack location. Click or drag marker to set location."
            data-testid="map-container"
          />

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
            aria-label="Use current device location"
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
            aria-label={selectedLocation ? 'Confirm selected location' : 'Please select a location first'}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};
