import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StarIcon, MapPinIcon, ClockIcon, UserIcon, PlusIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ReviewCard } from '../components/Reviews/ReviewCard';
import { AddReviewForm } from '../components/Reviews/AddReviewForm';
import apiService from '../services/api';
import type { Snack, Review } from '../types/api';

export const SnackDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [snack, setSnack] = useState<Snack | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddReview, setShowAddReview] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const fetchSnackData = async () => {
      try {
        setLoading(true);
        const [snackData, reviewsData] = await Promise.all([
          apiService.getSnack(id),
          apiService.getSnackReviews(id),
        ]);
        setSnack(snackData);
        setReviews(reviewsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load snack details');
      } finally {
        setLoading(false);
      }
    };

    fetchSnackData();
  }, [id, navigate]);

  const handleReviewAdded = async (newReview: Review) => {
    setReviews(prev => [newReview, ...prev]);
    setShowAddReview(false);
    
    // Refresh snack data to get updated rating
    if (id) {
      try {
        const updatedSnack = await apiService.getSnack(id);
        setSnack(updatedSnack);
      } catch (err) {
        console.error('Failed to refresh snack data:', err);
      }
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const starSize = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => {
          if (index < fullStars) {
            return (
              <StarIconSolid key={index} className={`${starSize} text-yellow-400`} />
            );
          } else if (index === fullStars && hasHalfStar) {
            return (
              <div key={index} className="relative">
                <StarIcon className={`${starSize} text-gray-300`} />
                <StarIconSolid className={`absolute inset-0 ${starSize} text-yellow-400 clip-half`} />
              </div>
            );
          } else {
            return (
              <StarIcon key={index} className={`${starSize} text-gray-300`} />
            );
          }
        })}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !snack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Snack Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'The snack you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <Link
            to="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image */}
            <div className="aspect-w-16 aspect-h-12">
              {snack.imageUrl ? (
                <img
                  src={snack.imageUrl}
                  alt={snack.name}
                  className="w-full h-80 object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-lg">No image available</span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{snack.name}</h1>
                  <span className="text-2xl font-bold text-green-600">
                    ${snack.price.toFixed(2)}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-3 mb-4">
                  {renderStars(snack.averageRating, 'lg')}
                  <span className="text-xl font-medium text-gray-900">
                    {snack.averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-600">
                    ({snack.reviewCount} review{snack.reviewCount !== 1 ? 's' : ''})
                  </span>
                </div>

                {/* Category */}
                {snack.category && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {snack.category.name}
                    </span>
                  </div>
                )}

                {/* Description */}
                {snack.description && (
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    {snack.description}
                  </p>
                )}

                {/* Location and Meta */}
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>{snack.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <UserIcon className="h-5 w-5 mr-2" />
                    <span>Added by {snack.user.username}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span>Added {formatDate(snack.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Reviews ({reviews.length})
            </h2>
            {user && (
              <button
                onClick={() => setShowAddReview(!showAddReview)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Review</span>
              </button>
            )}
          </div>

          {/* Add Review Form */}
          {showAddReview && user && snack && (
            <div className="mb-8">
              <AddReviewForm
                snackId={snack.id}
                onReviewAdded={handleReviewAdded}
                onCancel={() => setShowAddReview(false)}
              />
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No reviews yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Be the first to share your thoughts about this snack!
                </p>
                {user && (
                  <button
                    onClick={() => setShowAddReview(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Write First Review
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
