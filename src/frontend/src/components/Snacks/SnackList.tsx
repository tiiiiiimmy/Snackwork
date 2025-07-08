import React from 'react';
import { SnackCard } from './SnackCard';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import type { Snack } from '../../types/api';

interface SnackListProps {
  snacks: Snack[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export const SnackList: React.FC<SnackListProps> = ({
  snacks,
  loading,
  error,
  onRetry,
}) => {
  if (loading) {
    return (
      <div className="snack-list-loading">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="snack-list-error">
        <p className="error-message">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="retry-button"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (snacks.length === 0) {
    return (
      <div className="no-snacks">
        <div className="no-snacks-icon">🔍</div>
        <h3 className="no-snacks-title">No Snacks Found!</h3>
        <p className="no-snacks-message">
          Try adjusting your search radius or location to discover more tasty snacks nearby!
        </p>
      </div>
    );
  }

  return (
    <div className="snack-list-container">
      <div className="snack-list-header">
        <h2 className="snack-list-title">
          Snack Discoveries
        </h2>
        <p className="snack-list-subtitle">
          Found {snacks.length} delicious snack{snacks.length !== 1 ? 's' : ''} for you!
        </p>
      </div>
      <div className="snack-grid">
        {snacks.map((snack) => (
          <SnackCard key={snack.id} snack={snack} />
        ))}
      </div>
    </div>
  );
};
