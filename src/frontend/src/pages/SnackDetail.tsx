import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { StarIcon, MapPinIcon, ClockIcon, UserIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ReviewCard } from '../components/Reviews/ReviewCard';
import { AddReviewForm } from '../components/Reviews/AddReviewForm';
import { EditSnackModal } from '../components/Snacks/EditSnackModal';
import { DeleteSnackModal } from '../components/Snacks/DeleteSnackModal';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const fetchSnackData = async () => {
      try {
        setLoading(true);
        const snackData = await apiService.getSnack(id);
        setSnack(snackData);
        // Use reviews from snack data if available, otherwise fetch separately
        if (snackData.reviews) {
          setReviews(snackData.reviews);
        } else {
          const reviewsData = await apiService.getSnackReviews(id);
          setReviews(reviewsData);
        }
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

  // Check if current user has already reviewed this snack
  const hasUserReviewed = () => {
    if (!user) {
      console.log('No user logged in');
      return false;
    }
    if (!reviews || reviews.length === 0) {
      console.log('No reviews found');
      return false;
    }

    const userReview = reviews.find(review => review.user?.id === user.id);
    console.log('User ID:', user.id);
    console.log('Reviews:', reviews.map(r => ({ id: r.id, userId: r.user?.id, username: r.user?.username })));
    console.log('Has user reviewed:', !!userReview);

    return !!userReview;
  };

  // Check if current user is the owner of the snack
  const isOwner = user?.id === snack?.user.id;

  const handleSnackUpdated = (updatedSnack: Snack) => {
    setSnack(updatedSnack);
    setShowEditModal(false);
  };

  const handleSnackDeleted = () => {
    navigate('/');
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <div className="stars">
        {[...Array(5)].map((_, index) => {
          if (index < fullStars) {
            return (
              <StarIconSolid key={index} className={`filled ${size === 'lg' ? 'large' : ''}`} />
            );
          } else if (index === fullStars && hasHalfStar) {
            return (
              <div key={index} className="star-half">
                <StarIcon className={`empty ${size === 'lg' ? 'large' : ''}`} />
                <StarIconSolid className={`filled ${size === 'lg' ? 'large' : ''}`} />
              </div>
            );
          } else {
            return (
              <StarIcon key={index} className={`empty ${size === 'lg' ? 'large' : ''}`} />
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
      <div className="loading-container">
        <div className="loading-content">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !snack) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2 className="error-title">Snack Not Found</h2>
          <p className="error-message">
            {error || 'The snack you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <Link to="/" className="submit-button">
            Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="snack-detail-container">
      <div className="snack-detail-content">
        <div className="detail-grid">
          {/* Main Info */}
          <div className="snack-info-card">
            {/* Image */}
            {snack.hasImage ? (
              <img
                src={`/api/v1/snacks/${snack.id}/image`}
                alt={snack.name}
                className="snack-image"
              />
            ) : (
              <div className="snack-image snack-image-placeholder">
                <span>No image available</span>
              </div>
            )}

            {/* Header */}
            <div className="snack-header">
              <div className="snack-header-top">
                <div className="snack-title-section">
                  <h1 className="snack-name">{snack.name}</h1>
                  {snack.store && (
                    <span className="shop-name">
                      {snack.store.name}
                    </span>
                  )}
                </div>
                {isOwner && (
                  <div className="snack-actions">
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="btn btn--secondary btn--small"
                      title="Edit snack"
                    >
                      <PencilIcon />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="btn btn--danger btn--small"
                      title="Delete snack"
                    >
                      <TrashIcon />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="snack-meta">
                <div className="rating-display">
                  {renderStars(snack.averageRating, 'lg')}
                  <span className="rating-score">
                    {snack.averageRating.toFixed(1)}
                  </span>
                  <span className="rating-text">
                    ({snack.totalRatings} review{snack.totalRatings !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>

              {/* Category */}
              {snack.category && (
                <div className="category-section">
                  <span className="status-badge status-info">
                    {snack.category}
                  </span>
                </div>
              )}

              {/* Description */}
              {snack.description && (
                <p className="snack-description">
                  {snack.description}
                </p>
              )}

              {/* Location and Meta */}
              <div className="snack-meta-info">
                {snack.store && (
                  <div className="snack-location">
                    <MapPinIcon />
                    <span>{snack.store.name}</span>
                  </div>
                )}
                <Link
                  to={`/users/${snack.user.id}`}
                  className="snack-location"
                  aria-label={`View ${snack.user.username}'s profile`}
                >
                  <UserIcon />
                  <span>Added by {snack.user.username}</span>
                </Link>
                <div className="snack-location">
                  <ClockIcon />
                  <span>Added {formatDate(snack.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="snack-sidebar">
            <div className="sidebar-card">
              <h2 className="sidebar-title">
                Reviews ({reviews.length})
              </h2>
              {user && !hasUserReviewed() && (
                <button
                  onClick={() => setShowAddReview(!showAddReview)}
                  className="submit-button add-review-button"
                >
                  <PlusIcon />
                  <span>Add Review</span>
                </button>
              )}
              {user && hasUserReviewed() && (
                <div className="user-reviewed-message">
                  <span>✓ You've already reviewed this snack</span>
                </div>
              )}
            </div>

            {/* Add Review Form */}
            {showAddReview && user && snack && !hasUserReviewed() && (
              <div className="sidebar-card">
                <AddReviewForm
                  snackId={snack.id}
                  onReviewAdded={handleReviewAdded}
                  onCancel={() => setShowAddReview(false)}
                />
              </div>
            )}

            {/* Reviews List */}
            <div className="reviews-list">
              {reviewsLoading ? (
                <div className="loading-container">
                  <LoadingSpinner size="lg" />
                </div>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              ) : (
                <div className="sidebar-card no-reviews-card">
                  <h3 className="no-reviews-title">
                    No reviews yet
                  </h3>
                  <p className="no-reviews-text">
                    Be the first to share your thoughts about this snack!
                  </p>
                  {user && !hasUserReviewed() && (
                    <button
                      onClick={() => setShowAddReview(true)}
                      className="submit-button"
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

      {/* Edit Modal */}
      {snack && (
        <EditSnackModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSnackUpdated={handleSnackUpdated}
          snack={snack}
        />
      )}

      {/* Delete Modal */}
      {snack && (
        <DeleteSnackModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onSnackDeleted={handleSnackDeleted}
          snack={snack}
        />
      )}
    </div>
  );
};
