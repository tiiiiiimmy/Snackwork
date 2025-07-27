import React, { useState, useEffect } from 'react';
import { StoreCard } from './StoreCard';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { apiService } from '../../services/api';
import type { Store, StoresResponse } from '../../types/api';

interface StoreListProps {
  searchQuery?: string;
  onStoreSelect?: (store: Store) => void;
  userLocation?: { lat: number; lng: number };
  showCreateButton?: boolean;
}

export const StoreList: React.FC<StoreListProps> = ({
  searchQuery,
  onStoreSelect,
  userLocation,
  showCreateButton = true
}) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const calculateDistance = (store: Store): number => {
    if (!userLocation) return 0;
    
    const R = 6371e3; // Earth's radius in meters
    const φ1 = userLocation.lat * Math.PI / 180;
    const φ2 = store.latitude * Math.PI / 180;
    const Δφ = (store.latitude - userLocation.lat) * Math.PI / 180;
    const Δλ = (store.longitude - userLocation.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const loadStores = async (pageNum: number = 1, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: StoresResponse = await apiService.getStores(search, pageNum, 20);
      
      if (pageNum === 1) {
        setStores(response.stores);
      } else {
        setStores(prev => [...prev, ...response.stores]);
      }
      
      setTotalCount(response.totalCount);
      setHasMore(pageNum < response.totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading stores:', err);
      setError('Failed to load stores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores(1, searchQuery);
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadStores(page + 1, searchQuery);
    }
  };

  const sortedStores = userLocation
    ? stores.sort((a, b) => calculateDistance(a) - calculateDistance(b))
    : stores;

  if (loading && stores.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => loadStores(1, searchQuery)}
          className="btn btn--primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">
          {searchQuery ? 'No stores found matching your search.' : 'No stores found.'}
        </div>
        {showCreateButton && (
          <button className="btn btn--primary">
            Create First Store
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="store-list">
      <div className="store-list__header">
        <div className="store-list__count">
          {totalCount} store{totalCount !== 1 ? 's' : ''} found
        </div>
      </div>
      
      <div className="store-list__grid">
        {sortedStores.map(store => (
          <StoreCard
            key={store.id}
            store={store}
            distance={userLocation ? calculateDistance(store) : undefined}
            onClick={() => onStoreSelect?.(store)}
          />
        ))}
      </div>
      
      {hasMore && (
        <div className="store-list__load-more">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="btn btn--secondary btn--large"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};