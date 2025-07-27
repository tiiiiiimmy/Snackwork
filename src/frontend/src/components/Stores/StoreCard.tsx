import React from 'react';
import type { Store } from '../../types/api';

interface StoreCardProps {
  store: Store;
  distance?: number;
  onClick?: () => void;
  showStats?: boolean;
}

export const StoreCard: React.FC<StoreCardProps> = ({ 
  store, 
  distance, 
  onClick, 
  showStats = true 
}) => {
  const formatDistance = (dist: number) => {
    if (dist < 1000) {
      return `${Math.round(dist)}m`;
    }
    return `${(dist / 1000).toFixed(1)}km`;
  };

  return (
    <div className="store-card" onClick={onClick}>
      <div className="store-card__content">
        <div className="store-card__header">
          <h3 className="store-card__title">{store.name}</h3>
          {distance !== undefined && (
            <span className="store-card__distance">
              {formatDistance(distance)}
            </span>
          )}
        </div>
        
        {store.address && (
          <p className="store-card__address">{store.address}</p>
        )}
        
        {showStats && (
          <div className="store-card__stats">
            <div className="store-card__stat">
              <span className="store-card__stat-value">
                {store.snackCount || 0}
              </span>
              <span className="store-card__stat-label">Snacks</span>
            </div>
            <div className="store-card__stat">
              <span className="store-card__stat-value">
                {store.latitude.toFixed(4)}°
              </span>
              <span className="store-card__stat-label">Lat</span>
            </div>
            <div className="store-card__stat">
              <span className="store-card__stat-value">
                {store.longitude.toFixed(4)}°
              </span>
              <span className="store-card__stat-label">Lng</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};