import React, { useState, useEffect } from 'react';
import { MapContainer } from '../components/Map/MapContainer';
import { SnackList } from '../components/Snacks/SnackList';
import { FilterBar } from '../components/Filters/FilterBar';
import { useSnacks } from '../hooks/useSnacks';
import { useLocation } from '../hooks/useLocation';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import type { Location } from '../types/api';

export const Home: React.FC = () => {
  const { location, loading: locationLoading, error: locationError, requestLocation } = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(location || undefined);
  const [mapCenter, setMapCenter] = useState<Location | undefined>(location || undefined);
  const [searchRadius, setSearchRadius] = useState(1000);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const { snacks, loading: snacksLoading, error: snacksError, fetchSnacks } = useSnacks({
    location: selectedLocation,
    radius: searchRadius,
    categoryId: selectedCategory,
    search: searchQuery,
    autoFetch: true,
  });

  useEffect(() => {
    if (location) {
      setSelectedLocation(location);
      setMapCenter(location);
    }
  }, [location]);

  const handleLocationChange = (newLocation: Location) => {
    setSelectedLocation(newLocation);
    setMapCenter(newLocation);
  };

  const handleRadiusChange = (radius: number) => {
    setSearchRadius(radius);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
  };

  if (locationLoading) {
    return (
      <div className="location-loading">
        <div className="loading-card">
          <div className="location-icon">📍</div>
          <LoadingSpinner size="lg" />
          <p className="location-text">Getting your magical location...</p>
        </div>
      </div>
    );
  }

  if (locationError && !location) {
    return (
      <div className="location-error">
        <div className="error-card">
          <div className="error-icon">🎯</div>
          <h2 className="error-title">Location Magic Needed!</h2>
          <p className="error-message">
            SnackSpot needs your location to show nearby snacks. Please enable location access or search for a specific area.
          </p>
          <button
            onClick={requestLocation}
            className="retry-button"
          >
            🚀 Enable Location Magic
          </button>
        </div>
      </div>
    );
  }

  const filteredSnacks = selectedCategory
    ? snacks.filter(snack => snack.categoryId === selectedCategory)
    : snacks;

  return (
    <div className="home-container">
      {/* Filter bar */}
      <FilterBar
        onRadiusChange={handleRadiusChange}
        onCategoryChange={handleCategoryChange}
        onViewModeChange={setViewMode}
        currentLocation={selectedLocation}
        radius={searchRadius}
        selectedCategory={selectedCategory}
        viewMode={viewMode}
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
      />

      {/* Main content */}
      <div className="home-content">
        {viewMode === 'map' ? (
          <div className="content-view map-view">
            <MapContainer
              center={mapCenter}
              snacks={filteredSnacks}
              loading={snacksLoading}
              onLocationChange={handleLocationChange}
            />
          </div>
        ) : (
          <div className="content-view list-view">
            <SnackList
              snacks={snacks}
              loading={snacksLoading}
              error={snacksError}
              onRetry={() => fetchSnacks(selectedLocation, searchRadius, selectedCategory, searchQuery)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
