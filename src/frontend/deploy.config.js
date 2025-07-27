/**
 * Deployment configuration for SnackSpot Auckland Frontend
 * Supports multiple environments and deployment targets
 */

export const deployConfig = {
  // Environment configurations
  environments: {
    development: {
      name: 'Development',
      apiUrl: 'https://snackspot-auckland-api.azurewebsites.net/api/v1',
      baseUrl: 'http://localhost:5173',
      enableDebug: true,
      enablePerformanceMonitoring: true,
      enableHealthChecks: true
    },
    staging: {
      name: 'Staging',
      apiUrl: 'https://snackspot-auckland-api.azurewebsites.net/api/v1',
      baseUrl: 'https://staging.snackspot.nz',
      enableDebug: false,
      enablePerformanceMonitoring: true,
      enableHealthChecks: true
    },
    production: {
      name: 'Production',
      apiUrl: 'https://snackspot-auckland-api.azurewebsites.net/api/v1',
      baseUrl: 'https://snackspot.nz',
      enableDebug: false,
      enablePerformanceMonitoring: true,
      enableHealthChecks: true
    }
  },

  // Build configurations
  build: {
    outputDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: true,
    target: 'es2015',

    // Performance optimizations
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          maps: ['@googlemaps/js-api-loader'],
          ui: ['@heroicons/react']
        }
      }
    }
  },

  // Monitoring and logging
  monitoring: {
    performanceThresholds: {
      lcp: 2500,      // Largest Contentful Paint (ms)
      fid: 100,       // First Input Delay (ms)
      cls: 0.1,       // Cumulative Layout Shift
      fcp: 1800,      // First Contentful Paint (ms)
      ttfb: 800       // Time to First Byte (ms)
    },

    errorReporting: {
      enabled: true,
      maxErrors: 50,
      ignorePatterns: [
        /^Script error/,
        /Non-Error promise rejection captured/,
        /ResizeObserver loop limit exceeded/
      ]
    },

    healthChecks: {
      interval: 30000,  // 30 seconds
      timeout: 5000,    // 5 seconds
      retries: 3
    }
  },

  // Security configurations
  security: {
    contentSecurityPolicy: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://maps.googleapis.com", "https://maps.gstatic.com"],
      'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      'font-src': ["'self'", "https://fonts.gstatic.com"],
      'img-src': ["'self'", "data:", "https:"],
      'connect-src': ["'self'", "https://maps.googleapis.com"],
      'frame-src': ["'none'"],
      'object-src': ["'none'"]
    },

    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=self, microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=self'
    }
  },

  // Accessibility requirements
  accessibility: {
    wcagLevel: 'AA',
    minimumContrastRatio: 4.5,
    minimumTouchTargetSize: 44, // pixels
    requiredFeatures: [
      'keyboard-navigation',
      'screen-reader-support',
      'focus-management',
      'aria-labels',
      'skip-links'
    ]
  },

  // Performance budgets
  performance: {
    budgets: [
      {
        type: 'initial',
        maximumWarning: '500kb',
        maximumError: '1mb'
      },
      {
        type: 'allScript',
        maximumWarning: '2mb',
        maximumError: '5mb'
      },
      {
        type: 'anyComponentStyle',
        maximumWarning: '50kb',
        maximumError: '100kb'
      }
    ]
  }
};

// Environment detection
export function getCurrentEnvironment() {
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  } else if (hostname.includes('staging')) {
    return 'staging';
  } else {
    return 'production';
  }
}

// Get configuration for current environment
export function getConfig() {
  const env = getCurrentEnvironment();
  return {
    ...deployConfig,
    current: deployConfig.environments[env],
    environment: env
  };
}

export default deployConfig;