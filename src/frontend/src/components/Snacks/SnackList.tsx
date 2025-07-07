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
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load snacks</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (snacks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No snacks found</h3>
          <p className="text-gray-600">
            Try adjusting your search radius or location to discover more snacks nearby.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {snacks.map((snack) => (
          <SnackCard key={snack.id} snack={snack} />
        ))}
      </div>
    </div>
  );
};
