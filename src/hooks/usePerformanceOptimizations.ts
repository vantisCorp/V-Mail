/**
 * Performance Optimizations Hook
 * 
 * Provides comprehensive performance monitoring and optimization features:
 * - Performance metrics tracking
 * - Caching mechanisms
 * - Lazy loading
 * - Code splitting
 * - Virtual scrolling
 * - Memoization
 * - Performance reports
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  MetricType,
  PerformanceSeverity,
  PerformanceThreshold,
  PerformanceMetric,
  PerformanceSnapshot,
  CacheStrategy,
  CacheEntry,
  CacheStatistics,
  CacheConfiguration,
  LazyLoadConfig,
  CodeSplitConfig,
  VirtualScrollConfig,
  MemoizationStrategy,
  ComponentOptimization,
  ImageOptimization,
  PerformanceReport,
  OptimizationAction,
  PerformanceMonitoringConfig,
  NetworkOptimization,
  DatabaseOptimization,
  RenderingOptimization,
  PerformanceConfiguration,
  PerformanceAlert,
} from '../types/performance';

/**
 * Default performance thresholds
 */
const DEFAULT_THRESHOLDS: PerformanceThreshold[] = [
  {
    metricType: MetricType.RENDER_TIME,
    warningThreshold: 16,
    errorThreshold: 100,
    criticalThreshold: 500,
    unit: 'ms',
  },
  {
    metricType: MetricType.API_CALL,
    warningThreshold: 200,
    errorThreshold: 1000,
    criticalThreshold: 5000,
    unit: 'ms',
  },
  {
    metricType: MetricType.MEMORY_USAGE,
    warningThreshold: 100 * 1024 * 1024, // 100MB
    errorThreshold: 200 * 1024 * 1024, // 200MB
    criticalThreshold: 500 * 1024 * 1024, // 500MB
    unit: 'bytes',
  },
  {
    metricType: MetricType.NETWORK_LATENCY,
    warningThreshold: 100,
    errorThreshold: 500,
    criticalThreshold: 2000,
    unit: 'ms',
  },
];

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: CacheConfiguration = {
  maxSize: 50 * 1024 * 1024, // 50MB
  maxEntries: 1000,
  strategy: CacheStrategy.LRU,
  ttl: 3600000, // 1 hour
  enableCompression: true,
  enablePersistence: false,
};

/**
 * Default lazy load configuration
 */
const DEFAULT_LAZY_LOAD_CONFIG: LazyLoadConfig = {
  enabled: true,
  threshold: 200,
  rootMargin: '100px',
  triggerOnce: true,
};

/**
 * Default virtual scroll configuration
 */
const DEFAULT_VIRTUAL_SCROLL_CONFIG: VirtualScrollConfig = {
  enabled: true,
  itemHeight: 50,
  overscanCount: 5,
  windowSize: 20,
  dynamicHeights: false,
};

/**
 * Default monitoring configuration
 */
const DEFAULT_MONITORING_CONFIG: PerformanceMonitoringConfig = {
  enabled: true,
  sampleRate: 1.0,
  thresholds: DEFAULT_THRESHOLDS,
  enableRealtimeMonitoring: true,
  enableDetailedMetrics: true,
};

/**
 * Cache Manager Class
 */
class CacheManager {
  private cache: Map<string, CacheEntry>;
  private config: CacheConfiguration;
  private stats: CacheStatistics;

  constructor(config: CacheConfiguration) {
    this.cache = new Map();
    this.config = config;
    this.stats = this.initializeStats();
  }

  private initializeStats(): CacheStatistics {
    return {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      averageAccessTime: 0,
      oldestEntry: '',
      newestEntry: '',
    };
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    const now = Date.now();
    const entry: CacheEntry = {
      key,
      value,
      timestamp: now.toString(),
      lastAccessed: now.toString(),
      accessCount: 0,
      size: this.calculateSize(value),
      ttl: ttl || this.config.ttl,
      tags: this.config.tags,
    };

    // Check if we need to evict entries
    this.evictIfNeeded();

    this.cache.set(key, entry);
    this.updateStats('set', entry);
    return true;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.updateStats('miss');
      return null;
    }

    // Check TTL
    if (entry.ttl && Date.now() - parseInt(entry.timestamp) > entry.ttl) {
      this.cache.delete(key);
      this.updateStats('miss');
      return null;
    }

    // Update access info
    entry.lastAccessed = Date.now().toString();
    entry.accessCount++;
    this.updateStats('hit', entry);

    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.ttl && Date.now() - parseInt(entry.timestamp) > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats = this.initializeStats();
  }

  private evictIfNeeded(): void {
    const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    
    if (totalSize > this.config.maxSize || this.cache.size > this.config.maxEntries) {
      switch (this.config.strategy) {
        case CacheStrategy.LRU:
          this.evictLRU();
          break;
        case CacheStrategy.LFU:
          this.evictLFU();
          break;
        case CacheStrategy.FIFO:
          this.evictFIFO();
          break;
        case CacheStrategy.LIFO:
          this.evictLIFO();
          break;
        case CacheStrategy.TTL:
          this.evictTTL();
          break;
      }
    }
  }

  private evictLRU(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => parseInt(a[1].lastAccessed) - parseInt(b[1].lastAccessed));
    
    const entriesToEvict = Math.ceil(this.cache.size * 0.1);
    for (let i = 0; i < entriesToEvict; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }

  private evictLFU(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
    
    const entriesToEvict = Math.ceil(this.cache.size * 0.1);
    for (let i = 0; i < entriesToEvict; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }

  private evictFIFO(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => parseInt(a[1].timestamp) - parseInt(b[1].timestamp));
    
    const entriesToEvict = Math.ceil(this.cache.size * 0.1);
    for (let i = 0; i < entriesToEvict; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }

  private evictLIFO(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => parseInt(b[1].timestamp) - parseInt(a[1].timestamp));
    
    const entriesToEvict = Math.ceil(this.cache.size * 0.1);
    for (let i = 0; i < entriesToEvict; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }

  private evictTTL(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - parseInt(entry.timestamp) > entry.ttl) {
        this.cache.delete(key);
        this.stats.evictions++;
      }
    }
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Rough estimate in bytes
  }

  private updateStats(action: 'set' | 'hit' | 'miss', entry?: CacheEntry): void {
    const totalRequests = this.stats.hits + this.stats.misses;
    
    if (action === 'set' && entry) {
      this.stats.totalEntries = this.cache.size;
      this.stats.totalSize = Array.from(this.cache.values()).reduce((sum, e) => sum + e.size, 0);
      
      const entries = Array.from(this.cache.values());
      if (entries.length > 0) {
        const oldest = entries.reduce((min, e) => 
          parseInt(e.timestamp) < parseInt(min.timestamp) ? e : min
        );
        const newest = entries.reduce((max, e) => 
          parseInt(e.timestamp) > parseInt(max.timestamp) ? e : max
        );
        this.stats.oldestEntry = oldest.key;
        this.stats.newestEntry = newest.key;
      }
    } else if (action === 'hit') {
      this.stats.hits++;
    } else if (action === 'miss') {
      this.stats.misses++;
    }

    if (totalRequests > 0) {
      this.stats.hitRate = (this.stats.hits / totalRequests) * 100;
      this.stats.missRate = (this.stats.misses / totalRequests) * 100;
    }
  }

  getStatistics(): CacheStatistics {
    return { ...this.stats };
  }

  getConfiguration(): CacheConfiguration {
    return { ...this.config };
  }
}

/**
 * Performance Optimizations Hook
 */
export const usePerformanceOptimizations = () => {
  // State
  const [isEnabled, setIsEnabled] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [snapshots, setSnapshots] = useState<PerformanceSnapshot[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [cacheConfig, setCacheConfig] = useState<CacheConfiguration>(DEFAULT_CACHE_CONFIG);
  const [lazyLoadConfig, setLazyLoadConfig] = useState<LazyLoadConfig>(DEFAULT_LAZY_LOAD_CONFIG);
  const [virtualScrollConfig, setVirtualScrollConfig] = useState<VirtualScrollConfig>(DEFAULT_VIRTUAL_SCROLL_CONFIG);
  const [monitoringConfig, setMonitoringConfig] = useState<PerformanceMonitoringConfig>(DEFAULT_MONITORING_CONFIG);

  // Cache manager instance
  const cacheManagerRef = useRef<CacheManager | null>(null);

  // Initialize cache manager
  useEffect(() => {
    cacheManagerRef.current = new CacheManager(cacheConfig);
  }, [cacheConfig]);

  /**
   * Record a performance metric
   */
  const recordMetric = useCallback((
    type: MetricType,
    value: number,
    metadata?: Record<string, any>,
    component?: string,
    route?: string
  ) => {
    if (!isEnabled || !monitoringConfig.enabled) return;

    // Find threshold for metric type
    const threshold = monitoringConfig.thresholds.find(t => t.metricType === type);
    
    let severity: PerformanceSeverity = PerformanceSeverity.INFO;
    if (threshold) {
      if (value >= threshold.criticalThreshold) {
        severity = PerformanceSeverity.CRITICAL;
      } else if (value >= threshold.errorThreshold) {
        severity = PerformanceSeverity.ERROR;
      } else if (value >= threshold.warningThreshold) {
        severity = PerformanceSeverity.WARNING;
      }
    }

    const metric: PerformanceMetric = {
      id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      threshold,
      severity,
      timestamp: new Date().toISOString(),
      metadata,
      component,
      route,
    };

    setMetrics(prev => [...prev, metric]);

    // Create alert if needed
    if (severity === PerformanceSeverity.ERROR || severity === PerformanceSeverity.CRITICAL) {
      const alert: PerformanceAlert = {
        id: `alert-${Date.now()}`,
        type: severity,
        metric,
        message: `${metric.name} exceeded threshold: ${value}${threshold?.unit}`,
        timestamp: new Date().toISOString(),
        acknowledged: false,
      };
      setAlerts(prev => [...prev, alert]);
    }

    return metric;
  }, [isEnabled, monitoringConfig]);

  /**
   * Create a performance snapshot
   */
  const createSnapshot = useCallback((): PerformanceSnapshot => {
    const snapshot: PerformanceSnapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: new Date().toISOString(),
      metrics: [...metrics],
      summary: {
        totalMetrics: metrics.length,
        criticalIssues: metrics.filter(m => m.severity === PerformanceSeverity.CRITICAL).length,
        errors: metrics.filter(m => m.severity === PerformanceSeverity.ERROR).length,
        warnings: metrics.filter(m => m.severity === PerformanceSeverity.WARNING).length,
        averageRenderTime: calculateAverage(metrics, MetricType.RENDER_TIME),
        averageApiTime: calculateAverage(metrics, MetricType.API_CALL),
        cacheHitRate: calculateCacheHitRate(metrics),
      },
    };

    setSnapshots(prev => [...prev, snapshot].slice(-100)); // Keep last 100 snapshots
    return snapshot;
  }, [metrics]);

  /**
   * Cache operations
   */
  const cache = useMemo(() => ({
    set: <T>(key: string, value: T, ttl?: number): boolean => {
      return cacheManagerRef.current?.set(key, value, ttl) ?? false;
    },
    get: <T>(key: string): T | null => {
      return cacheManagerRef.current?.get<T>(key) ?? null;
    },
    has: (key: string): boolean => {
      return cacheManagerRef.current?.has(key) ?? false;
    },
    delete: (key: string): boolean => {
      return cacheManagerRef.current?.delete(key) ?? false;
    },
    clear: (): void => {
      cacheManagerRef.current?.clear();
    },
    getStatistics: (): CacheStatistics => {
      return cacheManagerRef.current?.getStatistics() ?? {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        hits: 0,
        misses: 0,
        evictions: 0,
        averageAccessTime: 0,
        oldestEntry: '',
        newestEntry: '',
      };
    },
  }), [cacheConfig]);

  /**
   * Measure component render time
   */
  const measureRender = useCallback((
    componentName: string,
    renderFn: () => void
  ) => {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    return recordMetric(
      MetricType.RENDER_TIME,
      endTime - startTime,
      { componentName },
      componentName
    );
  }, [recordMetric]);

  /**
   * Measure API call time
   */
  const measureApiCall = useCallback(async <T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await apiCall();
      const endTime = performance.now();
      
      recordMetric(
        MetricType.API_CALL,
        endTime - startTime,
        { apiName, success: true },
        undefined,
        apiName
      );
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      recordMetric(
        MetricType.API_CALL,
        endTime - startTime,
        { apiName, success: false, error },
        undefined,
        apiName
      );
      
      throw error;
    }
  }, [recordMetric]);

  /**
   * Memoize a function result
   */
  const memoize = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    key: string,
    ttl?: number
  ): T => {
    return ((...args: Parameters<T>) => {
      const cacheKey = `${key}-${JSON.stringify(args)}`;
      
      const cached = cache.get<ReturnType<T>>(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      const result = fn(...args);
      cache.set(cacheKey, result, ttl);
      return result;
    }) as T;
  }, [cache]);

  /**
   * Clear all metrics
   */
  const clearMetrics = useCallback(() => {
    setMetrics([]);
    setAlerts([]);
  }, []);

  /**
   * Acknowledge alert
   */
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
  }, []);

  /**
   * Generate performance report
   */
  const generateReport = useCallback((
    period: { start: string; end: string }
  ): PerformanceReport => {
    const periodSnapshots = snapshots.filter(s => 
      new Date(s.timestamp) >= new Date(period.start) &&
      new Date(s.timestamp) <= new Date(period.end)
    );

    return {
      id: `report-${Date.now()}`,
      period,
      snapshots: periodSnapshots,
      summary: {
        averageRenderTime: calculateAverageFromSnapshots(periodSnapshots, MetricType.RENDER_TIME),
        p95RenderTime: calculatePercentileFromSnapshots(periodSnapshots, MetricType.RENDER_TIME, 95),
        p99RenderTime: calculatePercentileFromSnapshots(periodSnapshots, MetricType.RENDER_TIME, 99),
        averageApiTime: calculateAverageFromSnapshots(periodSnapshots, MetricType.API_CALL),
        cacheHitRate: calculateCacheHitRateFromSnapshots(periodSnapshots),
        memoryUsage: metrics.find(m => m.type === MetricType.MEMORY_USAGE)?.value || 0,
        totalErrors: periodSnapshots.reduce((sum, s) => sum + s.summary.errors, 0),
        totalWarnings: periodSnapshots.reduce((sum, s) => sum + s.summary.warnings, 0),
      },
      recommendations: generateRecommendations(metrics),
    };
  }, [snapshots, metrics]);

  return {
    // State
    isEnabled,
    metrics,
    snapshots,
    alerts,
    cacheConfig,
    lazyLoadConfig,
    virtualScrollConfig,
    monitoringConfig,

    // Cache operations
    cache,

    // Metrics
    recordMetric,
    createSnapshot,
    measureRender,
    measureApiCall,

    // Optimization utilities
    memoize,

    // Management
    clearMetrics,
    acknowledgeAlert,
    generateReport,

    // Configuration
    setIsEnabled,
    setCacheConfig,
    setLazyLoadConfig,
    setVirtualScrollConfig,
    setMonitoringConfig,
  };
};

/**
 * Helper functions
 */
function calculateAverage(metrics: PerformanceMetric[], type: MetricType): number {
  const filtered = metrics.filter(m => m.type === type);
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length;
}

function calculateCacheHitRate(metrics: PerformanceMetric[]): number {
  const hits = metrics.filter(m => m.type === MetricType.CACHE_HIT).length;
  const misses = metrics.filter(m => m.type === MetricType.CACHE_MISS).length;
  const total = hits + misses;
  return total > 0 ? (hits / total) * 100 : 0;
}

function calculateAverageFromSnapshots(snapshots: PerformanceSnapshot[], type: MetricType): number {
  const values = snapshots.flatMap(s => 
    s.metrics.filter(m => m.type === type).map(m => m.value)
  );
  return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
}

function calculatePercentileFromSnapshots(
  snapshots: PerformanceSnapshot[],
  type: MetricType,
  percentile: number
): number {
  const values = snapshots.flatMap(s => 
    s.metrics.filter(m => m.type === type).map(m => m.value)
  ).sort((a, b) => a - b);
  
  if (values.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * values.length) - 1;
  return values[index];
}

function calculateCacheHitRateFromSnapshots(snapshots: PerformanceSnapshot[]): number {
  const hitRates = snapshots.map(s => s.summary.cacheHitRate);
  return hitRates.length > 0 ? hitRates.reduce((sum, r) => sum + r, 0) / hitRates.length : 0;
}

function generateRecommendations(metrics: PerformanceMetric[]): Array<{
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  impact: string;
  effort: string;
}> {
  const recommendations: any[] = [];
  
  const avgRenderTime = calculateAverage(metrics, MetricType.RENDER_TIME);
  const avgApiTime = calculateAverage(metrics, MetricType.API_CALL);
  const cacheHitRate = calculateCacheHitRate(metrics);

  if (avgRenderTime > 50) {
    recommendations.push({
      priority: 'high',
      category: 'Rendering',
      description: `Average render time (${avgRenderTime.toFixed(2)}ms) exceeds recommended threshold`,
      impact: 'High',
      effort: 'Medium',
    });
  }

  if (avgApiTime > 500) {
    recommendations.push({
      priority: 'high',
      category: 'API',
      description: `Average API call time (${avgApiTime.toFixed(2)}ms) exceeds recommended threshold`,
      impact: 'High',
      effort: 'Low',
    });
  }

  if (cacheHitRate < 70) {
    recommendations.push({
      priority: 'medium',
      category: 'Caching',
      description: `Cache hit rate (${cacheHitRate.toFixed(2)}%) is below optimal`,
      impact: 'Medium',
      effort: 'Low',
    });
  }

  return recommendations;
}