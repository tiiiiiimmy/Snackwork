import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, MapIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import type { Location, Category } from '../../types/api';
import apiService from '../../services/api';

interface FilterBarProps {
  onRadiusChange: (radius: number) => void;
  onCategoryChange: (categoryId: string) => void;
  onSearchChange: (search: string) => void;
  onViewModeChange: (mode: 'map' | 'list') => void;
  currentLocation?: Location;
  radius: number;
  selectedCategory: string;
  searchQuery: string;
  viewMode: 'map' | 'list';
}

export const FilterBar: React.FC<FilterBarProps> = ({
  onRadiusChange,
  onCategoryChange,
  onSearchChange,
  onViewModeChange,
  currentLocation,
  radius,
  selectedCategory,
  searchQuery,
  viewMode,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
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
    // Search is handled on keystroke via onSearchChange
  };

  return (
    <div className="filter-bar">
      <div className="filter-content">
        {/* Search */}
        <form onSubmit={handleSearch} className="search-form" role="search">
          <div className="search-input-container">
            <MagnifyingGlassIcon className="search-icon" aria-hidden="true" />
            <label htmlFor="snack-search" className="sr-only">
              Search for snacks
            </label>
            <input
              id="snack-search"
              type="text"
              placeholder="Search snacks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="form-input search-input"
              aria-label="Search for snacks"
            />
          </div>
        </form>

        {/* Filters toggle */}
        <div className="filter-group">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`toggle-button ${showFilters ? 'active' : ''}`}
            aria-expanded={showFilters}
            aria-controls="expanded-filters"
            aria-label={`${showFilters ? 'Hide' : 'Show'} filter options`}
          >
            <AdjustmentsHorizontalIcon aria-hidden="true" />
            <span className={showFilters ? 'show' : 'hide'}>Filters</span>
          </button>
        </div>

        {/* View mode toggle */}
        <div className="view-toggle" role="group" aria-label="View mode selection">
          <button
            onClick={() => onViewModeChange('map')}
            className={`toggle-button ${viewMode === 'map' ? 'active' : ''}`}
            aria-pressed={viewMode === 'map'}
            aria-label="Switch to map view"
          >
            <MapIcon aria-hidden="true" />
            <span>Map</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`toggle-button ${viewMode === 'list' ? 'active' : ''}`}
            aria-pressed={viewMode === 'list'}
            aria-label="Switch to list view"
          >
            <ListBulletIcon aria-hidden="true" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div id="expanded-filters" className="expanded-filters">
          <div className="filters-grid">
            {/* Category filter */}
            <div className="filter-group">
              <label htmlFor="category-select" className="filter-label">
                Category
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="filter-select"
                aria-label="Select snack category"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Radius filter */}
            <div className="filter-group">
              <label htmlFor="radius-range" className="filter-label">
                Radius: {radius}m
              </label>
              <input
                id="radius-range"
                type="range"
                min="500"
                max="5000"
                step="100"
                value={radius}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="filter-input range-input"
                aria-label={`Search radius: ${radius} meters`}
                aria-valuemin={500}
                aria-valuemax={5000}
                aria-valuenow={radius}
                aria-valuetext={`${radius} meters`}
              />
              <div className="range-labels" aria-hidden="true">
                <span>500m</span>
                <span>5km</span>
              </div>
            </div>

            {/* Current location display */}
            <div className="filter-group">
              <label className="filter-label">
                Location
              </label>
              <div className="location-display">
                {currentLocation
                  ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                  : 'No location set'
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
