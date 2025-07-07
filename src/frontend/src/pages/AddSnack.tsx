import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
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
        price: Number(formData.price),
        location: formData.location.trim(),
        latitude: formData.coordinates!.lat,
        longitude: formData.coordinates!.lng,
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Snack</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Snack Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter the snack name"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe the snack (optional)"
                />
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {formData.description.length}/500 characters
                </div>
              </div>

              {/* Category and Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price (NZD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Corner Store, Central Library, etc."
                />
              </div>

              {/* Map Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Map Location *
                </label>
                <div className="border border-gray-300 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-5 w-5 mr-2" />
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
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      {formData.coordinates ? 'Change Location' : 'Set Location'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL (optional)
                </label>
                <div className="relative">
                  <PhotoIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Provide a direct link to an image of the snack
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  <span>Add Snack</span>
                </button>
              </div>
            </form>
          </div>
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
