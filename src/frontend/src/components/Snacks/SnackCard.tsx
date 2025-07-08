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

    return (
      <div className="snack-rating">
        <div className="rating-stars">
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
        <span className="rating-value">
          {rating.toFixed(1)} ({snack.reviewCount})
        </span>
      </div>
    );
  };

  return (
    <Link to={`/snacks/${snack.id}`} className="snack-card-link">
      <div className="snack-card">
        {/* Image */}
        {snack.imageUrl ? (
          <img
            src={snack.imageUrl}
            alt={snack.name}
            className="snack-image"
          />
        ) : (
          <div className="snack-image-placeholder">
            <span>No image available</span>
          </div>
        )}

        {/* Content */}
        <div className="snack-content">
          <div className="snack-header">
            <h3 className="snack-title">
              {snack.name}
            </h3>

            <div className="snack-location">
              <MapPinIcon />
              <span>{snack.location}</span>
            </div>
          </div>

          {snack.description && (
            <p className="snack-description">
              {snack.description}
            </p>
          )}

          <div className="snack-meta">
            {renderStars(snack.averageRating)}
            <span className="snack-price">
              ${snack.price.toFixed(2)}
            </span>
          </div>

          {snack.category && (
            <div className="snack-category">
              <span className="category-badge">
                {snack.category.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};