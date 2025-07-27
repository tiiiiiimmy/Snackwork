import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import apiService from '../../services/api';
import type { Category, CreateCategoryRequest } from '../../types/api';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (category: Category) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to create a category');
      return;
    }

    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const category = await apiService.createCategory({
        name: formData.name.trim(),
      });

      onCategoryCreated(category);
      handleClose();
    } catch (err: unknown) {
      console.error('Error creating category:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '' });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal__header">
            <h2 className="modal__title">Add Category</h2>
            <button className="modal__close" onClick={handleClose} type="button">
              ×
            </button>
          </div>
          <div className="modal__body">
            <div className="error-message">
              You must be logged in to create a category.
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
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Add New Category</h2>
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

          <div className="form__group">
            <label htmlFor="category-name" className="form__label">
              Category Name *
            </label>
            <input
              id="category-name"
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              placeholder="e.g., Sweet Snacks, Healthy Options..."
              maxLength={50}
              required
            />
            <div className="form__help">
              {formData.name.length}/50 characters. Categories are automatically normalized (trimmed and lowercase).
            </div>
          </div>

          <div className="category-examples">
            <h4 className="category-examples__title">Popular Categories:</h4>
            <div className="category-examples__list">
              <span className="category-example">Sweet Snacks</span>
              <span className="category-example">Salty Snacks</span>
              <span className="category-example">Healthy Options</span>
              <span className="category-example">Beverages</span>
              <span className="category-example">Local Favorites</span>
              <span className="category-example">International</span>
            </div>
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
              {loading ? <LoadingSpinner size="sm" /> : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};