import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, MapIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import type { Location, Category } from '../../types/api';
import apiService from '../../services/api';

interface FilterBarProps {
  onRadiusChange: (radius: number) => void;
  onCategoryChange: (categoryId: string) => void;
  onViewModeChange: (mode: 'map' | 'list') => void;
  currentLocation?: Location;
  radius: number;
  selectedCategory: string;
  viewMode: 'map' | 'list';
}

export const FilterBar: React.FC<FilterBarProps> = ({
  onRadiusChange,
  onCategoryChange,
  onViewModeChange,
  currentLocation,
  radius,
  selectedCategory,
  viewMode,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await apiService.getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search:', searchQuery);
  };

  return (
    <div className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-400 border-b-4 border-purple-500 sticky top-16 z-40 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        {/* Main filter bar */}
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative transform hover:scale-105 transition-transform duration-200">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-600" />
              <input
                type="text"
                placeholder="🍿 Search snacks or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border-3 border-purple-300 rounded-full focus:ring-4 focus:ring-yellow-300 focus:border-purple-500 text-purple-800 placeholder-purple-400 shadow-lg font-medium"
              />
            </div>
          </form>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-full border-3 font-bold shadow-lg transform hover:scale-105 transition-all duration-200 ${showFilters
                ? 'bg-orange-400 border-orange-500 text-white shadow-orange-300'
                : 'bg-white border-purple-300 text-purple-700 hover:bg-purple-50 shadow-purple-200'
              }`}
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            <span className="hidden sm:block">🎛️ Filters</span>
          </button>

          {/* View mode toggle */}
          <div className="flex bg-white rounded-full p-2 border-3 border-purple-300 shadow-lg">
            <button
              onClick={() => onViewModeChange('map')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold transform transition-all duration-200 ${viewMode === 'map'
                  ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg scale-105'
                  : 'text-purple-600 hover:bg-purple-50 hover:scale-105'
                }`}
            >
              <MapIcon className="h-4 w-4" />
              <span className="hidden sm:block">🗺️ Map</span>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold transform transition-all duration-200 ${viewMode === 'list'
                  ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg scale-105'
                  : 'text-purple-600 hover:bg-purple-50 hover:scale-105'
                }`}
            >
              <ListBulletIcon className="h-4 w-4" />
              <span className="hidden sm:block">📝 List</span>
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-6 p-6 bg-white/90 backdrop-blur-sm rounded-3xl border-3 border-purple-300 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category filter */}
              <div className="space-y-3">
                <label className="block text-lg font-bold text-purple-800 mb-3">
                  🏷️ Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 border-3 border-purple-300 rounded-2xl focus:ring-4 focus:ring-yellow-300 focus:border-purple-500 text-purple-800 font-medium shadow-lg"
                >
                  <option value="">🌟 All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Radius filter */}
              <div className="space-y-3">
                <label className="block text-lg font-bold text-purple-800 mb-3">
                  📏 Radius: {radius}m
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={radius}
                    onChange={(e) => onRadiusChange(Number(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full appearance-none cursor-pointer shadow-lg slider"
                  />
                  <div className="flex justify-between text-sm font-bold text-purple-600 mt-2">
                    <span className="bg-yellow-200 px-2 py-1 rounded-full">500m</span>
                    <span className="bg-orange-200 px-2 py-1 rounded-full">5km</span>
                  </div>
                </div>
              </div>

              {/* Current location display */}
              <div className="space-y-3">
                <label className="block text-lg font-bold text-purple-800 mb-3">
                  📍 Location
                </label>
                <div className="px-4 py-3 bg-gradient-to-r from-green-100 to-blue-100 border-3 border-purple-300 rounded-2xl text-sm font-medium text-purple-700 shadow-lg">
                  {currentLocation
                    ? `🎯 ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                    : '❓ No location set'
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
