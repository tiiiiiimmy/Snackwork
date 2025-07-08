import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import apiService from '../../services/api';
import type { Review, CreateReviewRequest } from '../../types/api';

interface AddReviewFormProps {
  snackId: string;
  onReviewAdded: (review: Review) => void;
  onCancel: () => void;
}

export const AddReviewForm: React.FC<AddReviewFormProps> = ({
  snackId,
  onReviewAdded,
  onCancel,
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const reviewData: CreateReviewRequest = {
        snackId,
        rating,
        comment: comment.trim() || undefined,
      };

      const newReview = await apiService.createReview(reviewData);
      onReviewAdded(newReview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderStarSelector = () => {
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="star-button"
          >
            {star <= (hoveredRating || rating) ? (
              <StarIconSolid className="filled" />
            ) : (
              <StarIcon className="empty" />
            )}
          </button>
        ))}
        <span style={{
          marginLeft: '0.75rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
        </span>
      </div>
    );
  };

  return (
    <div className="add-review-form">
      <h3 className="form-title">Write a Review</h3>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        {/* Rating Selector */}
        <div className="rating-input">
          <label className="rating-label">
            Rating *
          </label>
          {renderStarSelector()}
        </div>

        {/* Comment */}
        <div className="comment-input">
          <label htmlFor="comment" className="comment-label">
            Comment (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={500}
            className="comment-textarea"
            placeholder="Share your thoughts about this snack..."
          />
          <div className="character-count">
            {comment.length}/500 characters
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="submit-button"
          >
            {loading && <LoadingSpinner size="sm" />}
            <span>Submit Review</span>
          </button>
        </div>
      </form>
    </div>
  );
};
