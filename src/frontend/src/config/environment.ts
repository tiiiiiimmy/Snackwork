// Environment Configuration for SnackSpot Auckland Frontend

interface EnvironmentConfig {
    apiUrl: string;
    isDevelopment: boolean;
    isProduction: boolean;
    enableDebug: boolean;
}

const config: EnvironmentConfig = {
    apiUrl: import.meta.env.VITE_API_URL || 'https://snackspot-auckland-api.azurewebsites.net',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    enableDebug: import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === 'true',
};

// Export both the config object and the API URL for backward compatibility
export const API_BASE_URL = config.apiUrl;
export default config; 