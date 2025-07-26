/**
 * Performance monitoring utilities for SnackSpot Auckland
 * Provides web vitals tracking, performance metrics, and error monitoring
 */

import React from 'react';

// Core Web Vitals interfaces
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  userId?: string;
}

// Performance thresholds based on Core Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }  // Time to First Byte
};

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorInfo[] = [];
  private isEnabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Monitor Core Web Vitals using Web Vitals API if available
    this.observeCoreWebVitals();
    
    // Monitor custom performance marks
    this.observeCustomMarks();
    
    // Monitor errors
    this.observeErrors();
    
    // Monitor navigation timing
    this.observeNavigationTiming();
  }

  private observeCoreWebVitals() {
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime);
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch {
        // Fallback for browsers that don't support LCP
        console.debug('LCP observation not supported');
      }

      // CLS - Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value || 0;
          }
        }
        this.recordMetric('CLS', clsValue);
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch {
        console.debug('CLS observation not supported');
      }

      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEntry & { processingStart?: number };
          this.recordMetric('FID', (fidEntry.processingStart || 0) - entry.startTime);
        }
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch {
        console.debug('FID observation not supported');
      }
    }

    // FCP - First Contentful Paint (using Navigation Timing)
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation && navigation.domContentLoadedEventEnd > 0) {
          this.recordMetric('FCP', navigation.domContentLoadedEventEnd - navigation.fetchStart);
        }
      }, 0);
    });
  }

  private observeCustomMarks() {
    // Observe custom performance marks
    if ('PerformanceObserver' in window) {
      const markObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.startsWith('snackspot-')) {
            this.recordMetric(entry.name, entry.startTime);
          }
        }
      });
      
      try {
        markObserver.observe({ entryTypes: ['mark', 'measure'] });
      } catch {
        console.debug('Custom marks observation not supported');
      }
    }
  }

  private observeNavigationTiming() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          // Time to First Byte
          const ttfb = navigation.responseStart - navigation.fetchStart;
          this.recordMetric('TTFB', ttfb);
          
          // DOM Content Loaded
          const dcl = navigation.domContentLoadedEventEnd - navigation.fetchStart;
          this.recordMetric('DCL', dcl);
          
          // Load Complete
          const loadComplete = navigation.loadEventEnd - navigation.fetchStart;
          this.recordMetric('Load', loadComplete);
        }
      }, 0);
    });
  }

  private observeErrors() {
    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.error?.message || event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
    if (!threshold) return 'good';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  recordMetric(name: string, value: number) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      rating: this.getRating(name, value)
    };

    this.metrics.push(metric);

    // Log poor performance
    if (metric.rating === 'poor') {
      console.warn(`Poor performance detected: ${name} = ${value}ms`);
    }

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  recordError(error: ErrorInfo) {
    if (!this.isEnabled) return;

    this.errors.push(error);
    console.error('Performance Monitor - Error recorded:', error);

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  getVitalsReport() {
    const vitals = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'];
    const report: Record<string, { value: number; rating: string } | null> = {};

    for (const vital of vitals) {
      const metric = this.metrics.filter(m => m.name === vital).pop();
      report[vital] = metric ? { value: metric.value, rating: metric.rating || 'unknown' } : null;
    }

    return report;
  }

  clearMetrics() {
    this.metrics = [];
    this.errors = [];
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Utility methods for manual performance tracking
  mark(name: string) {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`snackspot-${name}`);
    }
  }

  measure(name: string, startMark: string, endMark?: string) {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(
          `snackspot-${name}`, 
          `snackspot-${startMark}`, 
          endMark ? `snackspot-${endMark}` : undefined
        );
      } catch (e) {
        console.debug('Performance measure failed:', e);
      }
    }
  }

  // Resource timing analysis
  getResourceTimings() {
    if (typeof performance === 'undefined') return [];

    return performance.getEntriesByType('resource').map((entry) => {
      const resourceEntry = entry as PerformanceResourceTiming;
      return {
        name: resourceEntry.name,
        duration: resourceEntry.duration,
        size: resourceEntry.transferSize || 0,
        type: this.getResourceType(resourceEntry.name),
        timing: {
          dns: resourceEntry.domainLookupEnd - resourceEntry.domainLookupStart,
          tcp: resourceEntry.connectEnd - resourceEntry.connectStart,
          request: resourceEntry.responseStart - resourceEntry.requestStart,
          response: resourceEntry.responseEnd - resourceEntry.responseStart
        }
      };
    });
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image';
    if (url.includes('/api/')) return 'xhr';
    return 'other';
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    recordError: performanceMonitor.recordError.bind(performanceMonitor),
    mark: performanceMonitor.mark.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    getVitalsReport: performanceMonitor.getVitalsReport.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getErrors: performanceMonitor.getErrors.bind(performanceMonitor)
  };
}

// Helper to track component render performance
export function withPerformanceTracking<T extends React.ComponentType<Record<string, unknown>>>(
  Component: T,
  componentName: string
): T {
  const WrappedComponent = (props: Record<string, unknown>) => {
    React.useEffect(() => {
      performanceMonitor.mark(`${componentName}-mount-start`);
      
      return () => {
        performanceMonitor.mark(`${componentName}-unmount`);
        performanceMonitor.measure(`${componentName}-lifecycle`, `${componentName}-mount-start`, `${componentName}-unmount`);
      };
    }, []);

    performanceMonitor.mark(`${componentName}-render-start`);
    const result = React.createElement(Component, props);
    performanceMonitor.mark(`${componentName}-render-end`);
    performanceMonitor.measure(`${componentName}-render`, `${componentName}-render-start`, `${componentName}-render-end`);

    return result;
  };

  WrappedComponent.displayName = `withPerformanceTracking(${componentName})`;
  return WrappedComponent as T;
}

export default performanceMonitor;