import React, { useState, useEffect } from 'react';
import { MapContainer } from '../components/Map/MapContainer';
import { SnackList } from '../components/Snacks/SnackList';
import { FilterBar } from '../components/Filters/FilterBar';
import { useSnacks } from '../hooks/useSnacks';
import { useLocation } from '../hooks/useLocation';
import type { Location } from '../types/api';

export const Home: React.FC = () => {
  const { location, loading: locationLoading, error: locationError, requestLocation } = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(location || undefined);
  const [mapCenter, setMapCenter] = useState<Location | undefined>(location || undefined);
  const [searchRadius, setSearchRadius] = useState(1000);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  
  const { snacks, loading: snacksLoading, error: snacksError, fetchSnacks } = useSnacks({
    location: selectedLocation,
    radius: searchRadius,
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

  if (locationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Getting your location...</p>
        </div>
      </div>
    );
  }

  if (locationError && !location) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Location Required</h2>
          <p className="text-gray-600 mb-6">
            SnackSpot needs your location to show nearby snacks. Please enable location access or search for a specific area.
          </p>
          <button
            onClick={requestLocation}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Enable Location
          </button>
        </div>
      </div>
    );
  }

  const filteredSnacks = selectedCategory
    ? snacks.filter(snack => snack.categoryId === selectedCategory)
    : snacks;

  return (
    <div className="flex flex-col h-screen">
      {/* Filter bar */}
      <FilterBar
        onRadiusChange={handleRadiusChange}
        onCategoryChange={handleCategoryChange}
        onViewModeChange={setViewMode}
        currentLocation={selectedLocation}
        radius={searchRadius}
        selectedCategory={selectedCategory}
        viewMode={viewMode}
      />

      {/* Main content */}
      <div className="flex-1 relative">
        {viewMode === 'map' ? (
          <div className="h-full">
            <MapContainer
              center={mapCenter}
              snacks={filteredSnacks}
              loading={snacksLoading}
              onLocationChange={handleLocationChange}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <SnackList
              snacks={filteredSnacks}
              loading={snacksLoading}
              error={snacksError}
              onRetry={() => fetchSnacks(selectedLocation, searchRadius)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
