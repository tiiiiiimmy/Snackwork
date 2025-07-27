import React, { useState, useEffect } from 'react';
import { StoreList } from '../Stores/StoreList';
import { AddStoreModal } from '../Stores/AddStoreModal';
import { apiService } from '../../services/api';
import type { CreateSnackRequest, Category, Store, Snack } from '../../types/api';

interface AddSnackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnackCreated: (snack: Snack) => void;
  userLocation?: { lat: number; lng: number };
}

export const AddSnackModal: React.FC<AddSnackModalProps> = ({
  isOpen,
  onClose,
  onSnackCreated,
  userLocation
}) => {
  const [step, setStep] = useState<'details' | 'store'>('details');
  const [formData, setFormData] = useState<CreateSnackRequest>({
    name: '',
    description: '',
    categoryId: '',
    storeId: ''
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showAddStore, setShowAddStore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const categoriesData = await apiService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit as per spec)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setError('Only PNG, JPEG, and WebP images are supported');
      return;
    }

    setImageFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
    setFormData(prev => ({ ...prev, storeId: store.id }));
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Snack name is required');
      return;
    }

    if (!formData.categoryId) {
      setError('Please select a category');
      return;
    }

    if (!formData.storeId) {
      setError('Please select a store');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the snack first
      const snack = await apiService.createSnack({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        categoryId: formData.categoryId,
        storeId: formData.storeId
      });

      // Upload image if provided
      if (imageFile) {
        try {
          await apiService.uploadImage(snack.id, imageFile);
          // Update snack object to reflect that it now has an image
          snack.hasImage = true;
        } catch (imageErr) {
          console.error('Error uploading image:', imageErr);
          // Don't fail the whole operation if image upload fails
        }
      }

      onSnackCreated(snack);
      handleClose();
    } catch (err: unknown) {
      console.error('Error creating snack:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create snack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('details');
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      storeId: ''
    });
    setSelectedStore(null);
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal modal--large" onClick={e => e.stopPropagation()}>
          <div className="modal__header">
            <h2 className="modal__title">
              {step === 'details' ? 'Add New Snack' : 'Select Store'}
            </h2>
            <button
              className="modal__close"
              onClick={handleClose}
              type="button"
            >
              ×
            </button>
          </div>

          {step === 'details' ? (
            <form onSubmit={handleSubmit} className="modal__body">
              {error && (
                <div className="form__error mb-4">
                  {error}
                </div>
              )}

              {/* Image Upload */}
              <div className="form__group">
                <label className="form__label">
                  Snack Photo (Optional)
                </label>
                <div className="image-upload">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleImageChange}
                    className="image-upload__input"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="image-upload__label">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="image-upload__preview"
                      />
                    ) : (
                      <div className="image-upload__placeholder">
                        <span>📷</span>
                        <span>Click to add photo</span>
                      </div>
                    )}
                  </label>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="image-upload__remove"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="form__help">
                  Maximum 5MB. Supports PNG, JPEG, and WebP formats.
                </div>
              </div>

              {/* Snack Name */}
              <div className="form__group">
                <label htmlFor="snack-name" className="form__label">
                  Snack Name *
                </label>
                <input
                  id="snack-name"
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter snack name"
                  maxLength={200}
                  required
                />
              </div>

              {/* Description */}
              <div className="form__group">
                <label htmlFor="description" className="form__label">
                  Description
                </label>
                <textarea
                  id="description"
                  className="textarea"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="Describe this snack..."
                  maxLength={2000}
                  rows={3}
                />
              </div>

              {/* Category */}
              <div className="form__group">
                <label htmlFor="category" className="form__label">
                  Category *
                </label>
                <select
                  id="category"
                  className="select"
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    categoryId: e.target.value
                  }))}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Store Selection */}
              <div className="form__group">
                <label className="form__label">Store *</label>
                {selectedStore ? (
                  <div className="selected-store">
                    <div className="selected-store__info">
                      <div className="selected-store__name">
                        {selectedStore.name}
                      </div>
                      {selectedStore.address && (
                        <div className="selected-store__address">
                          {selectedStore.address}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('store')}
                      className="btn btn--ghost btn--small"
                    >
                      Change Store
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep('store')}
                    className="btn btn--secondary"
                  >
                    Select Store
                  </button>
                )}
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
                  disabled={loading || !formData.storeId}
                >
                  {loading ? 'Creating...' : 'Create Snack'}
                </button>
              </div>
            </form>
          ) : (
            <div className="modal__body">
              <div className="store-selection">
                <div className="store-selection__header">
                  <button
                    onClick={() => setStep('details')}
                    className="btn btn--ghost btn--small"
                  >
                    ← Back to Details
                  </button>
                  <button
                    onClick={() => setShowAddStore(true)}
                    className="btn btn--primary btn--small"
                  >
                    + Add New Store
                  </button>
                </div>

                <StoreList
                  onStoreSelect={handleStoreSelect}
                  userLocation={userLocation}
                  showCreateButton={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <AddStoreModal
        isOpen={showAddStore}
        onClose={() => setShowAddStore(false)}
        onStoreCreated={(store) => {
          setShowAddStore(false);
          handleStoreSelect(store);
        }}
        initialLocation={userLocation}
      />
    </>
  );
};