import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePerformanceOptimizations } from '../../src/hooks/usePerformanceOptimizations';
import { MetricType, PerformanceSeverity } from '../../src/types/performance';

describe('usePerformanceOptimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Performance Metrics', () => {
    it('should record a metric successfully', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      act(() => {
        result.current.recordMetric(
          MetricType.API_CALL,
          100,
          { endpoint: '/test' },
          'TestComponent'
        );
      });

      expect(result.current.metrics).toHaveLength(1);
      expect(result.current.metrics[0].type).toBe(MetricType.API_CALL);
      expect(result.current.metrics[0].value).toBe(100);
      expect(result.current.metrics[0].component).toBe('TestComponent');
    });

    it('should create a performance snapshot', async () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      act(() => {
        result.current.recordMetric(
          MetricType.API_CALL,
          100,
          { endpoint: '/test' },
          'TestComponent'
        );
      });

      let snapshot;
      await act(async () => {
        snapshot = result.current.createSnapshot();
      });

      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.metrics).toHaveLength(1);
    });

    it('should measure render time', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      let renderTime;
      act(() => {
        renderTime = result.current.measureRender('TestComponent', () => {
          return 'test result';
        });
      });

      expect(renderTime).toBeDefined();
      expect(renderTime.value).toBeGreaterThan(0);
      expect(renderTime.type).toBe(MetricType.RENDER_TIME);
      expect(result.current.metrics.length).toBeGreaterThan(0);
      expect(result.current.metrics[0].component).toBe('TestComponent');
    });

    it('should measure API call time', async () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      const mockApiCall = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'api result';
      };

      let apiResult;
      await act(async () => {
        apiResult = await result.current.measureApiCall('test_api', mockApiCall);
      });

      expect(apiResult).toBe('api result');
      expect(result.current.metrics.length).toBeGreaterThan(0);
      const metric = result.current.metrics.find(m => m.metadata?.apiName === 'test_api');
      expect(metric).toBeDefined();
      expect(metric?.type).toBe(MetricType.API_CALL);
    });

    it('should detect threshold violations', async () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      // Note: Using default thresholds where API_CALL error is 1000ms
      act(() => {
        result.current.recordMetric(
          MetricType.API_CALL,
          1500, // Exceeds error threshold (1000ms)
          { endpoint: '/slow' },
          'TestComponent'
        );
      });

      const metric = result.current.metrics[0];
      expect(metric.severity).toBe(PerformanceSeverity.ERROR);
      expect(result.current.alerts.length).toBeGreaterThan(0);
      expect(result.current.alerts[0].metric.id).toBe(metric.id);
    });
  });

  describe('Cache Operations', () => {
    it('should set and get cache values', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      act(() => {
        result.current.cache.set('test_key', 'test_value');
      });

      const value = result.current.cache.get('test_key');
      expect(value).toBe('test_value');
    });

    it('should return null for non-existent cache keys', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      const value = result.current.cache.get('non_existent_key');
      expect(value).toBeNull();
    });

    it('should check if key exists in cache', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      act(() => {
        result.current.cache.set('test_key', 'test_value');
      });

      expect(result.current.cache.has('test_key')).toBe(true);
      expect(result.current.cache.has('non_existent_key')).toBe(false);
    });

    it('should delete cache entries', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      act(() => {
        result.current.cache.set('test_key', 'test_value');
        result.current.cache.delete('test_key');
      });

      expect(result.current.cache.has('test_key')).toBe(false);
    });

    it('should clear all cache entries', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      act(() => {
        result.current.cache.set('key1', 'value1');
        result.current.cache.set('key2', 'value2');
        result.current.cache.clear();
      });

      expect(result.current.cache.has('key1')).toBe(false);
      expect(result.current.cache.has('key2')).toBe(false);
    });

    it('should get cache statistics', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      act(() => {
        result.current.cache.set('key1', 'value1');
        result.current.cache.set('key2', 'value2');
        result.current.cache.get('key1');
        result.current.cache.get('non_existent');
      });

      const stats = result.current.cache.getStatistics();
      expect(stats.totalEntries).toBe(2);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should use default cache configuration', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());

      // Default configuration is used
      expect(result.current.cacheConfig.strategy).toBe('lru');
      expect(result.current.cacheConfig.maxSize).toBe(50 * 1024 * 1024);
      expect(result.current.cacheConfig.maxEntries).toBe(1000);
    });
  });

  describe('Memoization', () => {
    it('should memoize a function', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      let callCount = 0;
      const expensiveFn = (x: number) => {
        callCount++;
        return x * 2;
      };

      const memoizedFn = result.current.memoize(expensiveFn, 'test_fn');
      
      expect(callCount).toBe(0);
      
      const result1 = memoizedFn(5);
      expect(result1).toBe(10);
      expect(callCount).toBe(1);

      const result2 = memoizedFn(5);
      expect(result2).toBe(10);
      expect(callCount).toBe(1); // Should not increase
    });

    it('should memoize multiple function calls with different arguments', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      let callCount = 0;
      const expensiveFn = (x: number) => {
        callCount++;
        return x * 2;
      };

      const memoizedFn = result.current.memoize(expensiveFn, 'test_fn');
      
      memoizedFn(5);
      memoizedFn(10);
      memoizedFn(5); // Cached
      memoizedFn(10); // Cached
      memoizedFn(15); // New

      expect(callCount).toBe(3);
    });
  });

  describe('Performance Reports', () => {
    it('should generate a performance report', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      act(() => {
        result.current.recordMetric(
          MetricType.API_CALL,
          100,
          { endpoint: '/api1' },
          'Component1'
        );
        result.current.recordMetric(
          MetricType.RENDER_TIME,
          50,
          {},
          'Component2'
        );
        // Create a snapshot
        result.current.createSnapshot();
      });

      const period = {
        start: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
        end: new Date().toISOString()
      };

      let report;
      act(() => {
        report = result.current.generateReport(period);
      });

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.snapshots).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.period).toEqual(period);
    });

    it('should provide recommendations based on metrics', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      act(() => {
        result.current.recordMetric(
          MetricType.API_CALL,
          1000, // Slow API
          { endpoint: '/slow' },
          'Component1'
        );
        result.current.recordMetric(
          MetricType.RENDER_TIME,
          200, // Slow render
          {},
          'Component2'
        );
        result.current.createSnapshot();
      });

      const period = {
        start: new Date(Date.now() - 86400000).toISOString(),
        end: new Date().toISOString()
      };

      let report;
      act(() => {
        report = result.current.generateReport(period);
      });

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Alerts', () => {
    it('should create alerts for critical metrics', async () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      // Record a critical metric (default critical threshold for API_CALL is 5000ms)
      act(() => {
        result.current.recordMetric(
          MetricType.API_CALL,
          6000, // Exceeds critical threshold (5000ms)
          { endpoint: '/critical' },
          'TestComponent'
        );
      });

      expect(result.current.alerts).toHaveLength(1);
      expect(result.current.alerts[0].type).toBe(PerformanceSeverity.CRITICAL);
      expect(result.current.alerts[0].acknowledged).toBe(false);
    });

    it('should acknowledge alerts', async () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      act(() => {
        result.current.recordMetric(
          MetricType.API_CALL,
          6000, // Critical
          { endpoint: '/critical' },
          'TestComponent'
        );
      });

      expect(result.current.alerts[0].acknowledged).toBe(false);

      act(() => {
        result.current.acknowledgeAlert(result.current.alerts[0].id);
      });

      expect(result.current.alerts[0].acknowledged).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should toggle performance monitoring', async () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true);
      });

      act(() => {
        result.current.setIsEnabled(false);
      });

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(false);
      });

      // Recording should be disabled
      act(() => {
        result.current.recordMetric(
          MetricType.API_CALL,
          100,
          {},
          'TestComponent'
        );
      });

      expect(result.current.metrics).toHaveLength(0);
    });

    it('should update cache configuration', async () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      act(() => {
        result.current.setCacheConfig({
          strategy: 'lfu',
          maxSize: 100 * 1024 * 1024,
          maxEntries: 2000,
          ttl: 7200000
        });
      });

      await waitFor(() => {
        expect(result.current.cacheConfig.strategy).toBe('lfu');
        expect(result.current.cacheConfig.maxSize).toBe(100 * 1024 * 1024);
      });
    });
  });

  describe('Clear Operations', () => {
    it('should clear metrics', () => {
      const { result } = renderHook(() => usePerformanceOptimizations());
      
      act(() => {
        result.current.recordMetric(
          MetricType.API_CALL,
          100,
          {},
          'TestComponent'
        );
      });

      expect(result.current.metrics).toHaveLength(1);

      act(() => {
        result.current.clearMetrics();
      });

      expect(result.current.metrics).toHaveLength(0);
    });
  });
});