import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { apiService } from '../../services/api';
import type { Snack } from '../../types/api';

interface SnackCardProps {
  snack: Snack;
}

export const SnackCard: React.FC<SnackCardProps> = ({ snack }) => {
  const navigate = useNavigate();
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const ratingText = `${rating.toFixed(1)} out of 5 stars, based on ${snack.totalRatings} reviews`;

    return (
      <div className="snack-card__rating" aria-label={ratingText}>
        <div className="snack-card__rating-stars" aria-hidden="true">
          {[...Array(5)].map((_, index) => {
            if (index < fullStars) {
              return (
                <StarIconSolid key={index} className="star-icon star-icon--filled" />
              );
            } else if (index === fullStars && hasHalfStar) {
              return (
                <div key={index} className="star-half-container">
                  <StarIcon className="star-icon star-icon--empty" />
                  <StarIconSolid className="star-icon star-icon--filled star-half" />
                </div>
              );
            } else {
              return (
                <StarIcon key={index} className="star-icon star-icon--empty" />
              );
            }
          })}
        </div>
        <div className="snack-card__rating-text">
          <span className="snack-card__rating-value">
            {rating.toFixed(1)}
          </span>
          <span className="snack-card__rating-count">
            ({snack.totalRatings})
          </span>
        </div>
      </div>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const username = snack.user?.username || 'Unknown';
  const userId = snack.user?.id;

  return (
    <Link
      to={`/snacks/${snack.id}`}
      className="snack-card-link"
      aria-label={`View details for ${snack.name} - ${snack.averageRating.toFixed(1)} stars`}
    >
      <div className="snack-card" data-testid="snack-card">
        {/* Image Container */}
        <div className="snack-card__image-container">
          {snack.hasImage ? (
            <img
              src={apiService.getImageUrl(snack.id)}
              alt={`Photo of ${snack.name}`}
              className="snack-card__image"
              loading="lazy"
            />
          ) : (
            <div className="snack-card__image-placeholder" aria-label="No image available">
              🍪
            </div>
          )}

          {/* Category Badge */}
          <div className="snack-card__badge">
            {snack.category}
          </div>
        </div>

        {/* Content */}
        <div className="snack-card__content">
          <h3 className="snack-card__title">
            {snack.name}
          </h3>

          {snack.description && (
            <p className="snack-card__description">
              {snack.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="snack-card__meta">
            <div className="snack-card__category">
              {snack.category}
            </div>
            {renderStars(snack.averageRating)}
          </div>

          {/* Store Info */}
          <div className="snack-card__store">
            <MapPinIcon className="snack-card__store-icon" aria-hidden="true" />
            <div>
              <div className="snack-card__store-name">
                {snack.store.name}
              </div>
              {snack.store.address && (
                <div className="snack-card__store-address">
                  {snack.store.address}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="snack-card__footer">
            <button
              type="button"
              className="snack-card__user snack-card__user--button"
              aria-label={`View ${username}'s profile`}
              onClick={() => {
                if (userId) navigate(`/users/${userId}`);
              }}
            >
              <div className="snack-card__user-avatar">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="snack-card__user-name">
                {username}
              </span>
            </button>

            <div className="snack-card__date">
              {formatTimeAgo(snack.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};