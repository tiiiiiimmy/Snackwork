import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import apiService from '../../services/api';
import type { Snack } from '../../types/api';

interface DeleteSnackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnackDeleted: () => void;
  snack: Snack;
}

export const DeleteSnackModal: React.FC<DeleteSnackModalProps> = ({
  isOpen,
  onClose,
  onSnackDeleted,
  snack,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if current user is the owner
  const isOwner = user?.id === snack.user.id;

  const handleDelete = async () => {
    if (!isOwner) {
      setError('You do not have permission to delete this snack');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiService.deleteSnack(snack.id);
      onSnackDeleted();
      onClose();
    } catch (err: unknown) {
      console.error('Error deleting snack:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to delete snack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  if (!isOwner) {
    return (
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal__header">
            <h2 className="modal__title">Delete Snack</h2>
            <button className="modal__close" onClick={handleClose} type="button">
              ×
            </button>
          </div>
          <div className="modal__body">
            <div className="error-message">
              You do not have permission to delete this snack.
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
          <h2 className="modal__title">Delete Snack</h2>
          <button className="modal__close" onClick={handleClose} type="button">
            ×
          </button>
        </div>

        <div className="modal__body">
          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}

          <div className="delete-confirmation">
            <div className="delete-confirmation__icon">
              ⚠️
            </div>
            <div className="delete-confirmation__content">
              <h3 className="delete-confirmation__title">
                Are you sure you want to delete "{snack.name}"?
              </h3>
              <p className="delete-confirmation__message">
                This action cannot be undone. The snack and all its reviews will be permanently deleted.
              </p>
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
              type="button"
              onClick={handleDelete}
              className="btn btn--danger"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Delete Snack'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};