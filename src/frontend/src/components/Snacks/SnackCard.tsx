import React from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import type { Snack } from '../../types/api';

interface SnackCardProps {
  snack: Snack;
}

export const SnackCard: React.FC<SnackCardProps> = ({ snack }) => {
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const ratingText = `${rating.toFixed(1)} out of 5 stars, based on ${snack.totalRatings} reviews`;

    return (
      <div className="snack-rating" aria-label={ratingText}>
        <div className="rating-stars" aria-hidden="true">
          {[...Array(5)].map((_, index) => {
            if (index < fullStars) {
              return (
                <StarIconSolid key={index} className="filled" />
              );
            } else if (index === fullStars && hasHalfStar) {
              return (
                <div key={index} className="star-half-container">
                  <StarIcon className="empty" />
                  <StarIconSolid className="filled star-half" />
                </div>
              );
            } else {
              return (
                <StarIcon key={index} className="empty" />
              );
            }
          })}
        </div>
        <span className="rating-value" aria-hidden="true">
          {rating.toFixed(1)} ({snack.totalRatings})
        </span>
      </div>
    );
  };

  return (
    <Link 
      to={`/snacks/${snack.id}`} 
      className="snack-card-link"
      aria-label={`View details for ${snack.name} - ${snack.averageRating.toFixed(1)} stars`}
    >
      <div className="snack-card" data-testid="snack-card">
        {/* Image */}
        {snack.imageUrl ? (
          <img
            src={snack.imageUrl}
            alt={`Photo of ${snack.name}`}
            className="snack-image"
            loading="lazy"
          />
        ) : (
          <div className="snack-image-placeholder" aria-label="No image available">
            <span aria-hidden="true">No image available</span>
          </div>
        )}

        {/* Content */}
        <div className="snack-content">
          <div className="snack-header">
            <h3 className="snack-title">
              {snack.name}
            </h3>

            {snack.shopName && (
              <div className="snack-location">
                <MapPinIcon aria-hidden="true" />
                <span>{snack.shopName}</span>
              </div>
            )}
          </div>

          {snack.description && (
            <p className="snack-description">
              {snack.description}
            </p>
          )}

          <div className="snack-meta">
            {renderStars(snack.averageRating)}
            {snack.shopName && (
              <span className="snack-shop">
                {snack.shopName}
              </span>
            )}
          </div>

          {snack.category && (
            <div className="snack-category">
              <span className="category-badge" data-testid="category-badge">
                {typeof snack.category === 'string' ? snack.category : snack.category.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};