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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-200 via-pink-200 to-purple-300">
        <div className="text-center px-8 py-12 bg-white rounded-3xl border-4 border-purple-300 shadow-2xl transform hover:scale-105 transition-transform duration-300">
          <div className="text-8xl mb-6 animate-bounce">📍</div>
          <div className="animate-spin rounded-full h-16 w-16 border-8 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
          <p className="text-purple-600 font-bold text-xl">Getting your magical location...</p>
        </div>
      </div>
    );
  }

  if (locationError && !location) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-200 via-orange-200 to-yellow-300">
        <div className="text-center max-w-md mx-auto px-8 py-12 bg-white rounded-3xl border-4 border-red-300 shadow-2xl transform hover:scale-105 transition-transform duration-300">
          <div className="text-8xl mb-6">🎯</div>
          <h2 className="text-3xl font-bold text-red-600 mb-6">Location Magic Needed!</h2>
          <p className="text-red-500 font-medium mb-8 text-lg leading-relaxed">
            SnackSpot needs your location to show nearby snacks. Please enable location access or search for a specific area.
          </p>
          <button
            onClick={requestLocation}
            className="bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg transform hover:scale-110 transition-all duration-200 border-3 border-white"
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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
      <div className="flex-1 relative p-4">
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
