import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { LocationPicker } from '../components/Forms/LocationPicker';
import apiService from '../services/api';
import type { Category, CreateSnackRequest, Location } from '../types/api';

export const AddSnack: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location: userLocation } = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    categoryId: string;
    price: string;
    location: string;
    coordinates: Location | null;
    imageUrl: string;
  }>({
    name: '',
    description: '',
    categoryId: '',
    price: '',
    location: '',
    coordinates: userLocation,
    imageUrl: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await apiService.getCategories();
        setCategories(fetchedCategories);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Update coordinates when user location changes
  useEffect(() => {
    if (userLocation && !formData.coordinates) {
      setFormData(prev => ({ ...prev, coordinates: userLocation }));
    }
  }, [userLocation, formData.coordinates]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelected = (location: Location, address: string) => {
    setFormData(prev => ({
      ...prev,
      coordinates: location,
      location: address,
    }));
    setShowLocationPicker(false);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Snack name is required');
      return false;
    }
    if (!formData.categoryId) {
      setError('Please select a category');
      return false;
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      setError('Please enter a valid price');
      return false;
    }
    if (!formData.location.trim()) {
      setError('Location/shop name is required');
      return false;
    }
    if (!formData.coordinates) {
      setError('Please set the snack location on the map');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const snackData: CreateSnackRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId,
        location: {
          lat: formData.coordinates!.lat,
          lng: formData.coordinates!.lng,
        },
        shopName: formData.location.trim(),
        imageUrl: formData.imageUrl.trim() || undefined,
      };

      const newSnack = await apiService.createSnack(snackData);
      navigate(`/snacks/${newSnack.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create snack');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="add-snack-container">
      <div className="add-snack-content">
        <div className="add-snack-card">
          <h1 className="page-title">Add New Snack</h1>

          <form onSubmit={handleSubmit} className="add-snack-form">
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {/* Snack Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Snack Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                maxLength={100}
                className="form-input"
                placeholder="Enter the snack name"
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                className="form-textarea"
                placeholder="Describe the snack (optional)"
              />
              <div className="character-count">
                {formData.description.length}/500 characters
              </div>
            </div>

            {/* Category and Price */}
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="categoryId" className="form-label">
                  Category *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price" className="form-label">
                  Price (NZD) *
                </label>
                <div className="input-group">
                  <span className="input-icon">$</span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="form-input input-with-icon"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label htmlFor="location" className="form-label">
                Shop/Location Name *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                maxLength={200}
                className="form-input"
                placeholder="e.g., Corner Store, Central Library, etc."
              />
            </div>

            {/* Map Location */}
            <div className="form-group">
              <label className="form-label">
                Map Location *
              </label>
              <div className="map-location-picker">
                <div className="location-info">
                  <div className="location-text">
                    <MapPinIcon />
                    {formData.coordinates ? (
                      <span>
                        {formData.coordinates.lat.toFixed(4)}, {formData.coordinates.lng.toFixed(4)}
                      </span>
                    ) : (
                      <span>No location selected</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    className="location-button"
                  >
                    {formData.coordinates ? 'Change Location' : 'Set Location'}
                  </button>
                </div>
              </div>
            </div>

            {/* Image URL */}
            <div className="form-group">
              <label htmlFor="imageUrl" className="form-label">
                Image URL (optional)
              </label>
              <div className="input-group">
                <PhotoIcon className="input-icon" />
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="form-input input-with-icon"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <p className="field-help-text">
                Provide a direct link to an image of the snack
              </p>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading && <LoadingSpinner size="sm" />}
                <span>Add Snack</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          initialLocation={formData.coordinates || userLocation}
          onLocationSelected={handleLocationSelected}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
};
