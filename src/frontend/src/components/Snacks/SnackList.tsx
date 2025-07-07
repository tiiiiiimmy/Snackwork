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
      <div className="flex items-center justify-center py-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl mx-4 my-6 border-4 border-blue-300">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">🍿</div>
          <LoadingSpinner size="lg" />
          <p className="text-blue-600 font-bold text-xl mt-4">Loading delicious snacks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 mx-4 my-6">
        <div className="text-center max-w-md bg-gradient-to-br from-red-100 to-pink-200 rounded-3xl p-8 border-4 border-red-300 shadow-2xl">
          <div className="text-8xl mb-6">😱</div>
          <h3 className="text-2xl font-bold text-red-600 mb-4">Oops! Snack Loading Failed</h3>
          <p className="text-red-500 font-medium mb-6">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white px-6 py-3 rounded-full font-bold shadow-lg transform hover:scale-110 transition-all duration-200 wiggle-on-hover"
            >
              🔄 Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (snacks.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 px-6 mx-4 my-6">
        <div className="text-center max-w-md bg-gradient-to-br from-yellow-100 to-orange-200 rounded-3xl p-8 border-4 border-yellow-300 shadow-2xl">
          <div className="text-8xl mb-6">🔍</div>
          <h3 className="text-2xl font-bold text-orange-600 mb-4">No Snacks Found!</h3>
          <p className="text-orange-500 font-medium">
            Try adjusting your search radius or location to discover more tasty snacks nearby! 🌟
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-purple-800 flex items-center justify-center space-x-3">
          <span className="text-4xl">🎉</span>
          <span>Snack Discoveries</span>
          <span className="text-4xl">🎉</span>
        </h2>
        <p className="text-purple-600 font-medium mt-2">Found {snacks.length} delicious snack{snacks.length !== 1 ? 's' : ''} for you!</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {snacks.map((snack, index) => (
          <div
            key={snack.id}
            className="transform hover:scale-105 transition-all duration-300"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <SnackCard snack={snack} />
          </div>
        ))}
      </div>
    </div>
  );
};
