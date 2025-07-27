import React from 'react';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { Review } from '../../types/api';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const renderStars = (rating: number) => {
    return (
      <div className="review-rating">
        {[...Array(5)].map((_, index) => (
          index < rating ? (
            <StarIconSolid key={index} className="filled" />
          ) : (
            <StarIcon key={index} className="empty" />
          )
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-NZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getInitials = (username: string) => {
    return username?.charAt(0)?.toUpperCase() || '?';
  };

  // Defensive check for user data
  const username = review.user?.username || 'Anonymous User';
  const userInitials = getInitials(username);

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-author">
          <div className="author-avatar">
            {userInitials}
          </div>
          <div className="author-info">
            <div className="author-name">{username}</div>
            <div className="review-date">{formatDate(review.createdAt)}</div>
          </div>
        </div>
        {renderStars(review.rating)}
      </div>

      {review.comment && (
        <div className="review-content">
          {review.comment}
        </div>
      )}
    </div>
  );
};
