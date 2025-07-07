import React from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
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
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => {
          if (index < fullStars) {
            return (
              <StarIconSolid key={index} className="h-4 w-4 text-yellow-400" />
            );
          } else if (index === fullStars && hasHalfStar) {
            return (
              <div key={index} className="relative">
                <StarIcon className="h-4 w-4 text-gray-300" />
                <StarIconSolid className="absolute inset-0 h-4 w-4 text-yellow-400 clip-half" />
              </div>
            );
          } else {
            return (
              <StarIcon key={index} className="h-4 w-4 text-gray-300" />
            );
          }
        })}
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)} ({snack.reviewCount})
        </span>
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
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Link to={`/snacks/${snack.id}`} className="block group">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Image */}
        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
          {snack.imageUrl ? (
            <img
              src={snack.imageUrl}
              alt={snack.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-100">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {snack.name}
            </h3>
            <span className="text-lg font-bold text-green-600">
              ${snack.price.toFixed(2)}
            </span>
          </div>

          {snack.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {snack.description}
            </p>
          )}

          {/* Rating */}
          <div className="mb-3">
            {renderStars(snack.averageRating)}
          </div>

          {/* Location and date */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{snack.location}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{formatDate(snack.createdAt)}</span>
            </div>
          </div>

          {/* Category */}
          {snack.category && (
            <div className="mt-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {snack.category.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
