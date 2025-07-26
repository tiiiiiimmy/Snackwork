import { useState, useEffect, useCallback } from 'react';
import type { Snack, Location } from '../types/api';
import apiService from '../services/api';

interface UseSnacksProps {
  location?: Location;
  radius?: number;
  categoryId?: string;
  search?: string;
  autoFetch?: boolean;
}

export const useSnacks = ({ location, radius = 1000, categoryId, search, autoFetch = true }: UseSnacksProps = {}) => {
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSnacks = useCallback(async (loc?: Location, r?: number, catId?: string, searchTerm?: string) => {
    if (!loc && !location) {
      setError('Location is required to fetch snacks');
      return;
    }

    const fetchLocation = loc || location!;
    const fetchRadius = r || radius;
    const fetchCategoryId = catId !== undefined ? catId : categoryId;
    const fetchSearch = searchTerm !== undefined ? searchTerm : search;

    setLoading(true);
    setError(null);

    try {
      const fetchedSnacks = await apiService.getSnacks(
        fetchLocation.lat,
        fetchLocation.lng,
        fetchRadius,
        fetchCategoryId,
        fetchSearch
      );
      setSnacks(fetchedSnacks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch snacks';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [location, radius, categoryId, search]);

  const refetch = () => {
    if (location) {
      fetchSnacks(location, radius, categoryId, search);
    }
  };

  useEffect(() => {
    if (autoFetch && location) {
      fetchSnacks(location, radius, categoryId, search);
    }
  }, [fetchSnacks, location, radius, categoryId, search, autoFetch]);

  return {
    snacks,
    loading,
    error,
    fetchSnacks,
    refetch,
  };
};