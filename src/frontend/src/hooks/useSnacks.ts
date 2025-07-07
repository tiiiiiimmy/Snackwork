import { useState, useEffect } from 'react';
import type { Snack, Location } from '../types/api';
import apiService from '../services/api';

interface UseSnacksProps {
  location?: Location;
  radius?: number;
  autoFetch?: boolean;
}

export const useSnacks = ({ location, radius = 1000, autoFetch = true }: UseSnacksProps = {}) => {
  const [snacks, setSnacks] = useState<Snack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSnacks = async (loc?: Location, r?: number) => {
    if (!loc && !location) {
      setError('Location is required to fetch snacks');
      return;
    }

    const fetchLocation = loc || location!;
    const fetchRadius = r || radius;

    setLoading(true);
    setError(null);

    try {
      const fetchedSnacks = await apiService.getSnacks(
        fetchLocation.lat,
        fetchLocation.lng,
        fetchRadius
      );
      setSnacks(fetchedSnacks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch snacks';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    if (location) {
      fetchSnacks(location, radius);
    }
  };

  useEffect(() => {
    if (autoFetch && location) {
      fetchSnacks(location, radius);
    }
  }, [location?.lat, location?.lng, radius, autoFetch]);

  return {
    snacks,
    loading,
    error,
    fetchSnacks,
    refetch,
  };
};