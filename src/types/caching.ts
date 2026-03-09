/**
 * Caching Type Definitions
 * Provides types for advanced caching strategies
 */

export type CacheStrategy = 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB' | 'custom';

export type CachePolicy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';

export type CachePriority = 'low' | 'normal' | 'high' | 'critical';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt: number;
  size: number;
  hits: number;
  lastAccessed: number;
  tags: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum size in bytes
  priority?: CachePriority;
  tags?: string[];
  persist?: boolean;
  compress?: boolean;
  version?: string;
}

export interface CacheConfig {
  strategy: CacheStrategy;
  defaultPolicy: CachePolicy;
  maxEntries: number;
  maxSize: number;
  cleanupInterval: number;
  enableCompression: boolean;
  enableMetrics: boolean;
  storageQuota?: number; // For IndexedDB
}

export interface CacheMetrics {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictions: number;
  lastCleanup: number;
  averageAccessTime: number;
}

export interface CacheEvent {
  type: 'hit' | 'miss' | 'set' | 'delete' | 'evict' | 'clear';
  key: string;
  timestamp: number;
  size?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  clears: number;
  hitRate: number;
  missRate: number;
  averageAccessTime: number;
  totalSize: number;
  entries: number;
  lastCleanup?: number;
}

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

export interface CacheInvalidationRule {
  type: 'tag' | 'pattern' | 'time' | 'manual';
  condition: string | RegExp | number | (() => boolean);
  action: 'delete' | 'refresh' | 'stale';
  tags?: string[];
}

export interface CachePrewarmConfig {
  enabled: boolean;
  keys: string[];
  priority?: CachePriority;
  onProgress?: (progress: number, total: number) => void;
}
