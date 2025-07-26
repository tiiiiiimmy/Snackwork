/**
 * Health Check utilities for SnackSpot Auckland Frontend
 * Monitors application health, API connectivity, and dependencies
 */

import React from 'react';
import apiService from '../services/api';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: HealthCheck[];
  version: string;
  uptime: number;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message?: string;
  details?: Record<string, any>;
}

class HealthMonitor {
  private startTime = Date.now();
  private checkInterval: NodeJS.Timeout | null = null;
  private lastHealthStatus: HealthStatus | null = null;

  async performHealthCheck(): Promise<HealthStatus> {
    const checks: HealthCheck[] = [];
    const startTime = performance.now();

    // Check API connectivity
    checks.push(await this.checkApiHealth());
    
    // Check browser capabilities
    checks.push(await this.checkBrowserFeatures());
    
    // Check localStorage availability
    checks.push(await this.checkLocalStorage());
    
    // Check network connectivity
    checks.push(await this.checkNetworkConnectivity());
    
    // Check performance
    checks.push(await this.checkPerformanceMetrics());

    // Determine overall status
    const hasFailures = checks.some(check => check.status === 'fail');
    const hasWarnings = checks.some(check => check.status === 'warn');
    
    let status: HealthStatus['status'] = 'healthy';
    if (hasFailures) {
      status = 'unhealthy';
    } else if (hasWarnings) {
      status = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      checks,
      version: '1.0.0', // Should come from package.json
      uptime: Date.now() - this.startTime
    };

    this.lastHealthStatus = healthStatus;
    return healthStatus;
  }

  private async checkApiHealth(): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      await apiService.healthCheck();
      const duration = performance.now() - startTime;
      
      return {
        name: 'api_connectivity',
        status: duration < 1000 ? 'pass' : 'warn',
        duration: Math.round(duration),
        message: duration < 1000 ? 'API responding normally' : 'API responding slowly',
        details: { responseTime: duration }
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        name: 'api_connectivity',
        status: 'fail',
        duration: Math.round(duration),
        message: 'API not responding',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: duration
        }
      };
    }
  }

  private async checkBrowserFeatures(): Promise<HealthCheck> {
    const startTime = performance.now();
    const requiredFeatures = [
      'fetch',
      'Promise',
      'localStorage',
      'sessionStorage',
      'navigator.geolocation'
    ];
    
    const missingFeatures = requiredFeatures.filter(feature => {
      const keys = feature.split('.');
      let obj: any = window;
      for (const key of keys) {
        if (!(key in obj)) return true;
        obj = obj[key];
      }
      return false;
    });

    const duration = performance.now() - startTime;

    return {
      name: 'browser_features',
      status: missingFeatures.length === 0 ? 'pass' : 'fail',
      duration: Math.round(duration),
      message: missingFeatures.length === 0 
        ? 'All required browser features available'
        : `Missing features: ${missingFeatures.join(', ')}`,
      details: { 
        required: requiredFeatures,
        missing: missingFeatures,
        userAgent: navigator.userAgent
      }
    };
  }

  private async checkLocalStorage(): Promise<HealthCheck> {
    const startTime = performance.now();
    const testKey = '_health_check_test';
    const testValue = Date.now().toString();

    try {
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      const duration = performance.now() - startTime;

      if (retrieved === testValue) {
        return {
          name: 'local_storage',
          status: 'pass',
          duration: Math.round(duration),
          message: 'localStorage working correctly'
        };
      } else {
        return {
          name: 'local_storage',
          status: 'fail',
          duration: Math.round(duration),
          message: 'localStorage read/write mismatch'
        };
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        name: 'local_storage',
        status: 'fail',
        duration: Math.round(duration),
        message: 'localStorage not available',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private async checkNetworkConnectivity(): Promise<HealthCheck> {
    const startTime = performance.now();

    try {
      // Check if navigator.onLine is available and true
      if (!navigator.onLine) {
        return {
          name: 'network_connectivity',
          status: 'fail',
          duration: 0,
          message: 'Browser reports offline'
        };
      }

      // Try to fetch a small resource to test actual connectivity
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache'
      });

      const duration = performance.now() - startTime;

      return {
        name: 'network_connectivity',
        status: response.ok ? 'pass' : 'warn',
        duration: Math.round(duration),
        message: response.ok ? 'Network connectivity confirmed' : 'Network connectivity issues',
        details: { 
          online: navigator.onLine,
          testResponse: response.status,
          responseTime: duration
        }
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        name: 'network_connectivity',
        status: 'fail',
        duration: Math.round(duration),
        message: 'Network connectivity test failed',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          online: navigator.onLine
        }
      };
    }
  }

  private async checkPerformanceMetrics(): Promise<HealthCheck> {
    const startTime = performance.now();

    try {
      // Check memory usage if available
      const memory = (performance as any).memory;
      let memoryWarning = false;
      let memoryDetails = {};

      if (memory) {
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
        const usagePercent = (usedMB / limitMB) * 100;

        memoryWarning = usagePercent > 80;
        memoryDetails = {
          usedMB: Math.round(usedMB),
          limitMB: Math.round(limitMB),
          usagePercent: Math.round(usagePercent)
        };
      }

      // Check for long tasks
      const longTasks = performance.getEntriesByType('longtask');
      const hasLongTasks = longTasks.length > 0;

      const duration = performance.now() - startTime;

      let status: HealthCheck['status'] = 'pass';
      let message = 'Performance metrics normal';

      if (memoryWarning && hasLongTasks) {
        status = 'warn';
        message = 'High memory usage and long tasks detected';
      } else if (memoryWarning) {
        status = 'warn';
        message = 'High memory usage detected';
      } else if (hasLongTasks) {
        status = 'warn';
        message = 'Long tasks detected';
      }

      return {
        name: 'performance_metrics',
        status,
        duration: Math.round(duration),
        message,
        details: {
          memory: memoryDetails,
          longTasks: longTasks.length,
          navigation: this.getNavigationMetrics()
        }
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        name: 'performance_metrics',
        status: 'warn',
        duration: Math.round(duration),
        message: 'Could not check performance metrics',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private getNavigationMetrics() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (!navigation) return null;

      return {
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
        loadComplete: Math.round(navigation.loadEventEnd - navigation.fetchStart),
        domInteractive: Math.round(navigation.domInteractive - navigation.fetchStart),
        firstPaint: this.getFirstPaint()
      };
    } catch {
      return null;
    }
  }

  private getFirstPaint() {
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return firstPaint ? Math.round(firstPaint.startTime) : null;
    } catch {
      return null;
    }
  }

  startMonitoring(intervalMs: number = 30000) {
    this.stopMonitoring();
    
    this.checkInterval = setInterval(async () => {
      try {
        const health = await this.performHealthCheck();
        console.debug('Health check completed:', health);

        // Emit custom event for health status updates
        window.dispatchEvent(new CustomEvent('health-status-update', {
          detail: health
        }));

        // Log warnings and errors
        if (health.status === 'degraded') {
          console.warn('Application health degraded:', health);
        } else if (health.status === 'unhealthy') {
          console.error('Application unhealthy:', health);
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, intervalMs);

    // Perform initial check
    this.performHealthCheck().then(health => {
      console.log('Initial health check:', health);
    });
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getLastHealthStatus(): HealthStatus | null {
    return this.lastHealthStatus;
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor();

// React hook for health monitoring
export function useHealthMonitor() {
  const [healthStatus, setHealthStatus] = React.useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const handleHealthUpdate = (event: CustomEvent<HealthStatus>) => {
      setHealthStatus(event.detail);
    };

    window.addEventListener('health-status-update', handleHealthUpdate as EventListener);
    
    return () => {
      window.removeEventListener('health-status-update', handleHealthUpdate as EventListener);
    };
  }, []);

  const performCheck = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await healthMonitor.performHealthCheck();
      setHealthStatus(status);
      return status;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    healthStatus,
    isLoading,
    performCheck,
    startMonitoring: healthMonitor.startMonitoring.bind(healthMonitor),
    stopMonitoring: healthMonitor.stopMonitoring.bind(healthMonitor)
  };
}

export default healthMonitor;