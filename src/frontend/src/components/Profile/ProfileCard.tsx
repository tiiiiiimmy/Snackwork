import React from 'react';
import type { User } from '../../types/api';

interface ProfileCardProps {
  user: User;
  isOwner?: boolean;
  onEditClick?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ 
  user, 
  isOwner = false, 
  onEditClick 
}) => {
  return (
    <div className="profile-card">
      <div className="profile-card__avatar">
        {user.avatarEmoji}
      </div>
      
      <h2 className="profile-card__name">
        {user.username}
      </h2>
      
      {user.instagramHandle && (
        <div className="profile-card__handle">
          @{user.instagramHandle}
        </div>
      )}
      
      {user.bio && (
        <p className="profile-card__bio">
          {user.bio}
        </p>
      )}
      
      {user.statistics && (
        <div className="profile-card__stats">
          <div className="profile-card__stat">
            <span className="profile-card__stat-value">
              {user.statistics.totalSnacks}
            </span>
            <span className="profile-card__stat-label">
              Snacks
            </span>
          </div>
          
          <div className="profile-card__stat">
            <span className="profile-card__stat-value">
              {user.statistics.totalReviews}
            </span>
            <span className="profile-card__stat-label">
              Reviews
            </span>
          </div>
          
          <div className="profile-card__stat">
            <span className="profile-card__stat-value">
              {user.level}
            </span>
            <span className="profile-card__stat-label">
              Level
            </span>
          </div>
        </div>
      )}
      
      {user.badges && user.badges.length > 0 && (
        <div className="profile-card__badges">
          {user.badges.map((badge, index) => (
            <div key={index} className="profile-card__badge">
              <span className="profile-card__badge-icon">
                {badge.icon}
              </span>
              <span className="profile-card__badge-text">
                {badge.name}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {isOwner && (
        <button 
          onClick={onEditClick}
          className="btn btn--secondary btn--small"
        >
          Edit Profile
        </button>
      )}
    </div>
  );
};