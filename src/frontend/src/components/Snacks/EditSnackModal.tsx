import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import apiService from '../../services/api';
import type { Snack, Store, Category, UpdateSnackRequest } from '../../types/api';

interface EditSnackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnackUpdated: (snack: Snack) => void;
  snack: Snack;
}

export const EditSnackModal: React.FC<EditSnackModalProps> = ({
  isOpen,
  onClose,
  onSnackUpdated,
  snack,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<UpdateSnackRequest>({
    name: '',
    description: '',
    categoryId: '',
    storeId: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Check if current user is the owner
  const isOwner = user?.id === snack.user.id;

  useEffect(() => {
    if (isOpen && isOwner) {
      // Initialize form data with snack values
      setFormData({
        name: snack.name,
        description: snack.description || '',
        categoryId: snack.category || '',
        storeId: snack.store.id,
      });

      // Fetch categories and stores
      const fetchData = async () => {
        try {
          const [categoriesData, storesData] = await Promise.all([
            apiService.getCategories(),
            apiService.getStores()
          ]);
          setCategories(categoriesData);
          setStores(storesData.stores);
        } catch (err) {
          console.error('Error fetching data:', err);
          setError('Failed to load form data');
        }
      };

      fetchData();
      setError(null);
    }
  }, [isOpen, isOwner, snack]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError('Only PNG, JPG/JPEG, and WebP images are allowed');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOwner) {
      setError('You do not have permission to edit this snack');
      return;
    }

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
      const updatedSnack = await apiService.updateSnack(snack.id, {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        categoryId: formData.categoryId,
        storeId: formData.storeId,
      });

      // Upload new image if provided
      if (imageFile) {
        try {
          await apiService.uploadImage(snack.id, imageFile);
          updatedSnack.hasImage = true;
        } catch (imageErr) {
          console.error('Error uploading image:', imageErr);
          // Don't fail the whole operation if image upload fails
        }
      }

      onSnackUpdated(updatedSnack);
      handleClose();
    } catch (err: unknown) {
      console.error('Error updating snack:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update snack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      storeId: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  if (!isOwner) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal__header">
            <h2 className="modal__title">Edit Snack</h2>
            <button className="modal__close" onClick={handleClose} type="button">
              ×
            </button>
          </div>
          <div className="modal__body">
            <div className="error-message">
              You do not have permission to edit this snack.
            </div>
            <div className="modal__footer">
              <button onClick={handleClose} className="btn btn--secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal modal--large" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Edit Snack</h2>
          <button className="modal__close" onClick={handleClose} type="button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__body">
          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}

          {/* Image Upload */}
          <div className="form__group">
            <label className="form__label">Image</label>
            <div className="image-upload">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageChange}
                className="image-upload__input"
                id="image-upload-edit"
              />
              <label htmlFor="image-upload-edit" className="image-upload__label">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="image-upload__preview"
                  />
                ) : snack.hasImage ? (
                  <img
                    src={`/api/v1/images/${snack.id}`}
                    alt={snack.name}
                    className="image-upload__preview"
                  />
                ) : (
                  <div className="image-upload__placeholder">
                    <span>📷</span>
                    <span>Click to change photo</span>
                  </div>
                )}
              </label>
            </div>
            <div className="form__help">
              PNG, JPG/JPEG, or WebP. Max 5MB.
            </div>
          </div>

          {/* Name */}
          <div className="form__group">
            <label htmlFor="edit-name" className="form__label">
              Name *
            </label>
            <input
              id="edit-name"
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData((prev: UpdateSnackRequest) => ({
                ...prev,
                name: e.target.value
              }))}
              placeholder="What's this snack called?"
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div className="form__group">
            <label htmlFor="edit-description" className="form__label">
              Description
            </label>
            <textarea
              id="edit-description"
              className="textarea"
              value={formData.description}
              onChange={(e) => setFormData((prev: UpdateSnackRequest) => ({
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
            <label htmlFor="edit-category" className="form__label">
              Category *
            </label>
            <select
              id="edit-category"
              className="select"
              value={formData.categoryId}
              onChange={(e) => setFormData((prev: UpdateSnackRequest) => ({
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

          {/* Store */}
          <div className="form__group">
            <label htmlFor="edit-store" className="form__label">
              Store *
            </label>
            <select
              id="edit-store"
              className="select"
              value={formData.storeId}
              onChange={(e) => setFormData((prev: UpdateSnackRequest) => ({
                ...prev,
                storeId: e.target.value
              }))}
              required
            >
              <option value="">Select a store</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name} {store.address && `- ${store.address}`}
                </option>
              ))}
            </select>
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
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Update Snack'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};