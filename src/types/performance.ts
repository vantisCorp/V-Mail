/**
 * Performance Optimizations Type Definitions
 * 
 * Provides types for performance monitoring, optimization strategies,
 * and caching mechanisms.
 */

/**
 * Performance metric types
 */
export enum MetricType {
  RENDER_TIME = 'render_time',
  COMPONENT_MOUNT = 'component_mount',
  API_CALL = 'api_call',
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  NETWORK_LATENCY = 'network_latency',
  DATABASE_QUERY = 'database_query',
  CACHE_HIT = 'cache_hit',
  CACHE_MISS = 'cache_miss',
  USER_INTERACTION = 'user_interaction',
  SCROLL_PERFORMANCE = 'scroll_performance',
  ANIMATION_FRAME = 'animation_frame',
}

/**
 * Performance severity levels
 */
export enum PerformanceSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Performance threshold
 */
export interface PerformanceThreshold {
  metricType: MetricType;
  warningThreshold: number;
  errorThreshold: number;
  criticalThreshold: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
}

/**
 * Performance metric
 */
export interface PerformanceMetric {
  id: string;
  type: MetricType;
  name: string;
  value: number;
  threshold?: PerformanceThreshold;
  severity: PerformanceSeverity;
  timestamp: string;
  metadata?: Record<string, any>;
  component?: string;
  route?: string;
}

/**
 * Performance snapshot
 */
export interface PerformanceSnapshot {
  id: string;
  timestamp: string;
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    criticalIssues: number;
    errors: number;
    warnings: number;
    averageRenderTime: number;
    averageApiTime: number;
    cacheHitRate: number;
  };
}

/**
 * Caching strategy types
 */
export enum CacheStrategy {
  LRU = 'lru', // Least Recently Used
  LFU = 'lfu', // Least Frequently Used
  FIFO = 'fifo', // First In First Out
  LIFO = 'lifo', // Last In First Out
  TTL = 'ttl', // Time To Live
  MANUAL = 'manual',
}

/**
 * Cache entry
 */
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: string;
  lastAccessed: string;
  accessCount: number;
  size: number;
  ttl?: number;
  tags?: string[];
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  hits: number;
  misses: number;
  evictions: number;
  averageAccessTime: number;
  oldestEntry: string;
  newestEntry: string;
}

/**
 * Cache configuration
 */
export interface CacheConfiguration {
  maxSize: number;
  maxEntries: number;
  strategy: CacheStrategy;
  ttl?: number;
  enableCompression: boolean;
  enablePersistence: boolean;
  persistKey?: string;
  tags?: string[];
}

/**
 * Lazy load configuration
 */
export interface LazyLoadConfig {
  enabled: boolean;
  threshold: number; // pixels before element viewport
  rootMargin: string;
  triggerOnce: boolean;
}

/**
 * Code split configuration
 */
export interface CodeSplitConfig {
  enabled: boolean;
  chunks: {
    name: string;
    path: string;
    loadOn: 'route' | 'condition' | 'manual';
    condition?: () => boolean;
  }[];
  preloadStrategy: 'none' | 'all' | 'hover' | 'viewport';
}

/**
 * Virtual scroll configuration
 */
export interface VirtualScrollConfig {
  enabled: boolean;
  itemHeight: number | ((index: number) => number);
  overscanCount: number;
  windowSize: number;
  dynamicHeights: boolean;
}

/**
 * Memoization strategy
 */
export enum MemoizationStrategy {
  SHALLOW = 'shallow',
  DEEP = 'deep',
  MANUAL = 'manual',
  DISABLED = 'disabled',
}

/**
 * Component optimization config
 */
export interface ComponentOptimization {
  componentName: string;
  memoize: boolean;
  memoizationStrategy: MemoizationStrategy;
  virtualScroll: boolean;
  lazyLoad: boolean;
  shouldUpdateCheck?: (prevProps: any, nextProps: any) => boolean;
}

/**
 * Image optimization config
 */
export interface ImageOptimization {
  enabled: boolean;
  lazyLoad: boolean;
  placeholder: 'blur' | 'color' | 'empty';
  quality: number;
  formats: ('webp' | 'jpeg' | 'png' | 'avif')[];
  maxDimensions: {
    width: number;
    height: number;
  };
  responsive: boolean;
}

/**
 * Bundle analysis
 */
export interface BundleAnalysis {
  version: string;
  timestamp: string;
  totalSize: number;
  gzipSize: number;
  chunks: {
    name: string;
    size: number;
    gzipSize: number;
    modules: number;
    dependencies: string[];
  }[];
  assets: {
    name: string;
    size: number;
    type: string;
  }[];
  duplicates: {
    module: string;
    instances: string[];
    totalSize: number;
  }[];
}

/**
 * Performance report
 */
export interface PerformanceReport {
  id: string;
  period: {
    start: string;
    end: string;
  };
  snapshots: PerformanceSnapshot[];
  summary: {
    averageRenderTime: number;
    p95RenderTime: number;
    p99RenderTime: number;
    averageApiTime: number;
    cacheHitRate: number;
    memoryUsage: number;
    totalErrors: number;
    totalWarnings: number;
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    impact: string;
    effort: string;
  }[];
}

/**
 * Optimization action
 */
export interface OptimizationAction {
  id: string;
  type: 'cache' | 'lazy_load' | 'code_split' | 'memoize' | 'virtual_scroll';
  target: string;
  config: any;
  appliedAt?: string;
  status: 'pending' | 'applied' | 'failed';
  result?: {
    before: PerformanceSnapshot;
    after: PerformanceSnapshot;
    improvement: number;
  };
}

/**
 * Performance monitoring config
 */
export interface PerformanceMonitoringConfig {
  enabled: boolean;
  sampleRate: number; // 0-1
  thresholds: PerformanceThreshold[];
  alertWebhooks?: string[];
  enableRealtimeMonitoring: boolean;
  enableDetailedMetrics: boolean;
}

/**
 * Network optimization config
 */
export interface NetworkOptimization {
  enableDeduplication: boolean;
  enableCompression: boolean;
  enablePrefetch: boolean;
  enableConnectionPooling: boolean;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Database optimization config
 */
export interface DatabaseOptimization {
  enableQueryCaching: boolean;
  enableIndexUsage: boolean;
  enableBatchOperations: boolean;
  enableConnectionPooling: boolean;
  maxConnections: number;
  queryTimeout: number;
}

/**
 * Rendering optimization config
 */
export interface RenderingOptimization {
  enableVirtualScroll: boolean;
  enableLazyLoading: boolean;
  enableCodeSplitting: boolean;
  enableMemoization: boolean;
  requestAnimationFrame: boolean;
  debounceTime: number;
  throttleTime: number;
}

/**
 * Overall performance configuration
 */
export interface PerformanceConfiguration {
  monitoring: PerformanceMonitoringConfig;
  caching: CacheConfiguration;
  lazyLoad: LazyLoadConfig;
  codeSplit: CodeSplitConfig;
  virtualScroll: VirtualScrollConfig;
  imageOptimization: ImageOptimization;
  network: NetworkOptimization;
  database: DatabaseOptimization;
  rendering: RenderingOptimization;
}

/**
 * Performance alert
 */
export interface PerformanceAlert {
  id: string;
  type: PerformanceSeverity;
  metric: PerformanceMetric;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}