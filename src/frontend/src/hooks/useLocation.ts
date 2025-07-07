import { useState, useEffect } from 'react';
import type { Location } from '../types/api';

interface LocationState {
  location: Location | null;
  loading: boolean;
  error: string | null;
}

// Default to Auckland, New Zealand coordinates
const AUCKLAND_COORDS: Location = {
  lat: -36.8485,
  lng: 174.7633,
};

export const useLocation = (autoRequest: boolean = true) => {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
  });

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setState({
        location: AUCKLAND_COORDS,
        loading: false,
        error: 'Geolocation is not supported by this browser. Using Auckland as default.',
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setState({
          location,
          loading: false,
          error: null,
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location. Using Auckland as default.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Using Auckland as default.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Using Auckland as default.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Using Auckland as default.';
            break;
        }

        setState({
          location: AUCKLAND_COORDS,
          loading: false,
          error: errorMessage,
        });
      },
      options
    );
  };

  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest]);

  return {
    ...state,
    requestLocation,
    aucklandCoords: AUCKLAND_COORDS,
  };
};