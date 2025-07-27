import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { CreateStoreRequest, Store } from '../../types/api';

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreCreated: (store: Store) => void;
  initialLocation?: { lat: number; lng: number };
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}

export const AddStoreModal: React.FC<AddStoreModalProps> = ({
  isOpen,
  onClose,
  onStoreCreated,
  initialLocation
}) => {
  const [formData, setFormData] = useState<CreateStoreRequest>({
    name: '',
    address: '',
    latitude: initialLocation?.lat || 0,
    longitude: initialLocation?.lng || 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressInput, setAddressInput] = useState('');

  useEffect(() => {
    if (initialLocation) {
      setFormData(prev => ({
        ...prev,
        latitude: initialLocation.lat,
        longitude: initialLocation.lng
      }));
    }
  }, [initialLocation]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!isOpen || !window.google) return;

    const input = document.getElementById('address-input') as HTMLInputElement;
    if (!input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['establishment'],
      componentRestrictions: { country: 'NZ' } // Restrict to New Zealand
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setFormData(prev => ({
          ...prev,
          name: prev.name || place.name || '',
          address: place.formatted_address || '',
          latitude: lat,
          longitude: lng
        }));
        setAddressInput(place.formatted_address || '');
      }
    });

    return () => {
      // Cleanup if needed
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Store name is required');
      return;
    }

    if (formData.latitude === 0 && formData.longitude === 0) {
      setError('Please select a location for the store');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const store = await apiService.createStore({
        name: formData.name.trim(),
        address: formData.address?.trim() || undefined,
        latitude: formData.latitude,
        longitude: formData.longitude
      });

      onStoreCreated(store);
      handleClose();
    } catch (err: unknown) {
      console.error('Error creating store:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      address: '',
      latitude: initialLocation?.lat || 0,
      longitude: initialLocation?.lng || 0
    });
    setAddressInput('');
    setError(null);
    onClose();
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Failed to get your current location');
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Add New Store</h2>
          <button
            className="modal__close"
            onClick={handleClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          {error && (
            <div className="form__error mb-4">
              {error}
            </div>
          )}

          <div className="form__group">
            <label htmlFor="store-name" className="form__label">
              Store Name *
            </label>
            <input
              id="store-name"
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter store name"
              required
            />
          </div>

          <div className="form__group">
            <label htmlFor="address-input" className="form__label">
              Address
            </label>
            <input
              id="address-input"
              type="text"
              className="input"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Search for address..."
            />
            <div className="form__help">
              Start typing to search for the store location
            </div>
          </div>

          <div className="form__row">
            <div className="form__group">
              <label htmlFor="latitude" className="form__label">
                Latitude *
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                className="input"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  latitude: parseFloat(e.target.value) || 0
                }))}
                required
              />
            </div>

            <div className="form__group">
              <label htmlFor="longitude" className="form__label">
                Longitude *
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                className="input"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  longitude: parseFloat(e.target.value) || 0
                }))}
                required
              />
            </div>
          </div>

          <div className="form__group">
            <button
              type="button"
              onClick={getCurrentLocation}
              className="btn btn--ghost btn--small"
            >
              📍 Use Current Location
            </button>
          </div>

          <div className="modal__footer">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn--secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn--primary ${loading ? 'btn--loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};