import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { SnackCard } from '../components/Snacks/SnackCard';
import { EditProfileModal } from '../components/Profile/EditProfileModal';
import apiService from '../services/api';
import type { User, Snack } from '../types/api';

export const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userSnacks, setUserSnacks] = useState<Snack[]>([]);
  const [loading, setLoading] = useState(true);
  const [snacksLoading, setSnacksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    if (!id) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await apiService.getUser(id);
        setUser(userData);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;

    const fetchUserSnacks = async () => {
      try {
        setSnacksLoading(true);
        const snacksData = await apiService.getUserSnacks(id);
        setUserSnacks(snacksData);
      } catch (err) {
        console.error('Error fetching user snacks:', err);
        // Don't show error for snacks, just leave empty
      } finally {
        setSnacksLoading(false);
      }
    };

    fetchUserSnacks();
  }, [id, user]);

  const handleProfileUpdated = (updatedUser: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUser });
    }
    setShowEditModal(false);
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

  if (error || !user) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2 className="error-title">User Not Found</h2>
          <p className="error-message">
            {error || 'The user you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <Link to="/" className="submit-button">
            Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="user-profile-content">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar">
              <span className="profile-avatar-emoji">{user.avatarEmoji}</span>
            </div>
            
            <div className="profile-info">
              <div className="profile-main-info">
                <h1 className="profile-username">{user.username}</h1>
                {user.instagramHandle && (
                  <a
                    href={`https://instagram.com/${user.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="profile-instagram"
                  >
                    @{user.instagramHandle}
                  </a>
                )}
              </div>
              
              {user.bio && (
                <p className="profile-bio">{user.bio}</p>
              )}
              
              <div className="profile-stats">
                <div className="profile-stat">
                  <span className="profile-stat-value">{user.statistics?.totalSnacks || 0}</span>
                  <span className="profile-stat-label">Snacks</span>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-value">{user.statistics?.totalReviews || 0}</span>
                  <span className="profile-stat-label">Reviews</span>
                </div>
                <div className="profile-stat">
                  <span className="profile-stat-value">Level {user.level}</span>
                  <span className="profile-stat-label">{user.experiencePoints} XP</span>
                </div>
              </div>
            </div>
            
            {isOwnProfile && (
              <div className="profile-actions">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn btn--primary"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Snacks Section */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">
              {isOwnProfile ? 'Your Snacks' : `${user.username}'s Snacks`}
            </h2>
            <span className="profile-section-count">
              {userSnacks.length} snack{userSnacks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {snacksLoading ? (
            <div className="loading-container">
              <LoadingSpinner size="lg" />
            </div>
          ) : userSnacks.length > 0 ? (
            <div className="snacks-grid">
              {userSnacks.map((snack) => (
                <SnackCard key={snack.id} snack={snack} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🍿</div>
              <h3 className="empty-state-title">
                {isOwnProfile ? 'No snacks yet' : `${user.username} hasn't added any snacks yet`}
              </h3>
              <p className="empty-state-message">
                {isOwnProfile 
                  ? 'Start exploring and add your first snack discovery!'
                  : 'Check back later to see what they discover!'
                }
              </p>
              {isOwnProfile && (
                <Link to="/" className="btn btn--primary">
                  Discover Snacks
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Badges Section (if user has badges) */}
        {user.badges && user.badges.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Badges</h2>
            </div>
            <div className="badges-grid">
              {user.badges.map((badge, index) => (
                <div key={index} className="badge-card">
                  <div className="badge-name">{badge.name}</div>
                  <div className="badge-description">{badge.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && user && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onProfileUpdated={handleProfileUpdated}
          user={user}
        />
      )}
    </div>
  );
};