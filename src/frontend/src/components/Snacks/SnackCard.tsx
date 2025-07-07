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
              <StarIconSolid key={index} className="h-5 w-5 text-yellow-400 drop-shadow-sm" />
            );
          } else if (index === fullStars && hasHalfStar) {
            return (
              <div key={index} className="relative">
                <StarIcon className="h-5 w-5 text-gray-300" />
                <StarIconSolid className="absolute inset-0 h-5 w-5 text-yellow-400 clip-half" />
              </div>
            );
          } else {
            return (
              <StarIcon key={index} className="h-5 w-5 text-gray-300" />
            );
          }
        })}
        <span className="ml-2 text-sm font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
          {rating.toFixed(1)} ⭐ ({snack.reviewCount})
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
      <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-xl border-4 border-purple-200 overflow-hidden hover:shadow-2xl hover:border-purple-400 transition-all duration-300 transform hover:-translate-y-2">
        {/* Image */}
        <div className="relative">
          {snack.imageUrl ? (
            <img
              src={snack.imageUrl}
              alt={snack.name}
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-48 bg-gradient-to-br from-yellow-200 to-orange-300">
              <div className="text-center">
                <span className="text-6xl mb-2 block">🍿</span>
                <span className="text-orange-600 font-bold">No image</span>
              </div>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 border-2 border-purple-300">
            <span className="text-xl font-bold text-green-600">
              💰 ${snack.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-purple-800 group-hover:text-pink-600 transition-colors line-clamp-2">
              🍽️ {snack.name}
            </h3>

            {snack.description && (
              <p className="text-purple-600 text-sm font-medium line-clamp-2 bg-purple-50 rounded-2xl px-3 py-2">
                {snack.description}
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="flex justify-center">
            {renderStars(snack.averageRating)}
          </div>

          {/* Location and date */}
          <div className="space-y-2">
            <div className="flex items-center justify-center bg-blue-100 rounded-full px-3 py-2">
              <MapPinIcon className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-blue-700 font-medium text-sm">📍 {snack.location}</span>
            </div>
            <div className="flex items-center justify-center bg-green-100 rounded-full px-3 py-2">
              <ClockIcon className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-green-700 font-medium text-sm">🕒 {formatDate(snack.createdAt)}</span>
            </div>
          </div>

          {/* Category */}
          {snack.category && (
            <div className="flex justify-center">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-lg border-2 border-white transform hover:scale-105 transition-transform duration-200">
                🏷️ {snack.category.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
