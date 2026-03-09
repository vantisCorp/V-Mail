/**
 * Advanced Cache Service
 * Implements multiple caching strategies with policies and management
 */

import type {
  CacheStrategy,
  CachePolicy,
  CachePriority,
  CacheEntry,
  CacheOptions,
  CacheConfig,
  CacheMetrics,
  CacheEvent,
  CacheStats,
  CacheAdapter,
  CacheInvalidationRule,
  CachePrewarmConfig
} from '../types/caching';

class CacheService {
  private static instance: CacheService | null = null;
  private cache: Map<string, CacheEntry> = new Map();
  private metrics: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    clears: 0,
    hitRate: 0,
    missRate: 0,
    averageAccessTime: 0,
    totalSize: 0,
    entries: 0
  };
  private eventListeners: Array<(event: CacheEvent) => void> = [];
  private invalidationRules: CacheInvalidationRule[] = [];
  private cleanupTimer?: NodeJS.Timeout;
  private config: CacheConfig;
  private adapters: Map<CacheStrategy, CacheAdapter> = new Map();

  private constructor(config?: Partial<CacheConfig>) {
    this.config = {
      strategy: 'memory',
      defaultPolicy: 'cache-first',
      maxEntries: 1000,
      maxSize: 50 * 1024 * 1024, // 50MB
      cleanupInterval: 60000, // 1 minute
      enableCompression: false,
      enableMetrics: true,
      ...config
    };

    this.initializeAdapters();
    this.startCleanupTimer();
    this.loadFromStorage();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config: Partial<CacheConfig> = {}): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  /**
   * Initialize cache adapters for different strategies
   */
  private initializeAdapters(): void {
    // Memory adapter (default)
    this.adapters.set('memory', {
      get: async (key) => {
        const entry = this.cache.get(key);
        if (!entry) {
          return null;
        }
        if (Date.now() > entry.expiresAt) {
          this.cache.delete(key);
          return null;
        }
        return entry.value;
      },
      set: async (key, value, options) => {
        const entry = this.createEntry(key, value, options);
        this.cache.set(key, entry);
      },
      delete: async (key) => {
        this.cache.delete(key);
      },
      clear: async () => {
        this.cache.clear();
      },
      has: async (key) => this.cache.has(key),
      keys: async () => Array.from(this.cache.keys()),
      size: async () => this.cache.size
    });

    // LocalStorage adapter
    this.adapters.set('localStorage', {
      get: async (key) => {
        const data = localStorage.getItem(`cache_${key}`);
        if (!data) {
          return null;
        }
        try {
          const entry = JSON.parse(data) as CacheEntry;
          if (Date.now() > entry.expiresAt) {
            localStorage.removeItem(`cache_${key}`);
            return null;
          }
          return entry.value;
        } catch {
          return null;
        }
      },
      set: async (key, value, options) => {
        const entry = this.createEntry(key, value, options);
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      },
      delete: async (key) => {
        localStorage.removeItem(`cache_${key}`);
      },
      clear: async () => {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('cache_'))
          .forEach((k) => localStorage.removeItem(k));
      },
      has: async (key) => localStorage.getItem(`cache_${key}`) !== null,
      keys: async () =>
        Object.keys(localStorage)
          .filter((k) => k.startsWith('cache_'))
          .map((k) => k.replace('cache_', '')),
      size: async () => Object.keys(localStorage).filter((k) => k.startsWith('cache_')).length
    });

    // SessionStorage adapter
    this.adapters.set('sessionStorage', {
      get: async (key) => {
        const data = sessionStorage.getItem(`cache_${key}`);
        if (!data) {
          return null;
        }
        try {
          const entry = JSON.parse(data) as CacheEntry;
          if (Date.now() > entry.expiresAt) {
            sessionStorage.removeItem(`cache_${key}`);
            return null;
          }
          return entry.value;
        } catch {
          return null;
        }
      },
      set: async (key, value, options) => {
        const entry = this.createEntry(key, value, options);
        sessionStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      },
      delete: async (key) => {
        sessionStorage.removeItem(`cache_${key}`);
      },
      clear: async () => {
        Object.keys(sessionStorage)
          .filter((k) => k.startsWith('cache_'))
          .forEach((k) => sessionStorage.removeItem(k));
      },
      has: async (key) => sessionStorage.getItem(`cache_${key}`) !== null,
      keys: async () =>
        Object.keys(sessionStorage)
          .filter((k) => k.startsWith('cache_'))
          .map((k) => k.replace('cache_', '')),
      size: async () => Object.keys(sessionStorage).filter((k) => k.startsWith('cache_')).length
    });
  }

  /**
   * Create a cache entry
   */
  private createEntry<T>(key: string, value: T, options?: CacheOptions): CacheEntry<T> {
    const now = Date.now();
    const ttl = options?.ttl || 300000; // 5 minutes default
    const serialized = JSON.stringify(value);
    const size = new Blob([serialized]).size;

    return {
      key,
      value,
      timestamp: now,
      expiresAt: now + ttl,
      size,
      hits: 0,
      lastAccessed: now,
      tags: options?.tags || [],
      metadata: options?.version ? { version: options.version } : undefined
    };
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, policy?: CachePolicy): Promise<T | null> {
    const startTime = Date.now();
    const effectivePolicy = policy || this.config.defaultPolicy;

    // For network-only policy, skip cache
    if (effectivePolicy === 'network-only') {
      this.recordMiss(key);
      return null;
    }

    const adapter = this.adapters.get(this.config.strategy);
    if (!adapter) {
      throw new Error(`Cache adapter not found for strategy: ${this.config.strategy}`);
    }

    const value = await adapter.get<T>(key);

    if (value !== null) {
      this.recordHit(key);
      this.emitEvent({ type: 'hit', key, timestamp: Date.now() });

      // For stale-while-revalidate, trigger background refresh
      if (effectivePolicy === 'stale-while-revalidate') {
        this.backgroundRefresh(key);
      }

      return value;
    }

    this.recordMiss(key);
    this.emitEvent({ type: 'miss', key, timestamp: Date.now() });
    return null;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const adapter = this.adapters.get(this.config.strategy);
    if (!adapter) {
      throw new Error(`Cache adapter not found for strategy: ${this.config.strategy}`);
    }

    // Check size limits
    await this.ensureCapacity(options);

    await adapter.set(key, value, options);
    this.metrics.sets++;
    this.emitEvent({
      type: 'set',
      key,
      timestamp: Date.now(),
      size: JSON.stringify(value).length
    });
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    const adapter = this.adapters.get(this.config.strategy);
    if (!adapter) {
      throw new Error(`Cache adapter not found for strategy: ${this.config.strategy}`);
    }

    await adapter.delete(key);
    this.metrics.deletes++;
    this.emitEvent({ type: 'delete', key, timestamp: Date.now() });
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const adapter = this.adapters.get(this.config.strategy);
    if (!adapter) {
      throw new Error(`Cache adapter not found for strategy: ${this.config.strategy}`);
    }

    await adapter.clear();
    this.metrics.clears++;
    this.emitEvent({ type: 'clear', key: '*', timestamp: Date.now() });
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    const adapter = this.adapters.get(this.config.strategy);
    if (!adapter) {
      throw new Error(`Cache adapter not found for strategy: ${this.config.strategy}`);
    }

    return adapter.has(key);
  }

  /**
   * Get all cache keys
   */
  async keys(): Promise<string[]> {
    const adapter = this.adapters.get(this.config.strategy);
    if (!adapter) {
      throw new Error(`Cache adapter not found for strategy: ${this.config.strategy}`);
    }

    return adapter.keys();
  }

  /**
   * Get cache size
   */
  async size(): Promise<number> {
    const adapter = this.adapters.get(this.config.strategy);
    if (!adapter) {
      throw new Error(`Cache adapter not found for strategy: ${this.config.strategy}`);
    }

    return adapter.size();
  }

  /**
   * Ensure cache capacity
   */
  private async ensureCapacity(options?: CacheOptions): Promise<void> {
    const currentSize = await this.size();
    const maxSize = options?.maxSize || this.config.maxEntries;

    if (currentSize >= maxSize) {
      await this.evictEntries(maxSize * 0.8);
    }
  }

  /**
   * Evict entries based on LRU
   */
  private async evictEntries(targetSize: number): Promise<void> {
    const entries = Array.from(this.cache.values()).sort((a, b) => a.lastAccessed - b.lastAccessed);

    const adapter = this.adapters.get(this.config.strategy);
    if (!adapter) {
      return;
    }

    let evicted = 0;
    for (const entry of entries) {
      if ((await this.size()) <= targetSize) {
        break;
      }

      await adapter.delete(entry.key);
      this.metrics.evictions++;
      this.emitEvent({
        type: 'evict',
        key: entry.key,
        timestamp: Date.now(),
        size: entry.size
      });
      evicted++;
    }
  }

  /**
   * Record cache hit
   */
  private recordHit(key: string): void {
    this.metrics.hits++;
    this.updateMetrics();

    // Update entry access time
    const entry = this.cache.get(key);
    if (entry) {
      entry.hits++;
      entry.lastAccessed = Date.now();
    }
  }

  /**
   * Record cache miss
   */
  private recordMiss(key: string): void {
    this.metrics.misses++;
    this.updateMetrics();
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
    this.metrics.missRate = total > 0 ? this.metrics.misses / total : 0;
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheStats {
    return { ...this.metrics };
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart cleanup timer if interval changed
    if (config.cleanupInterval !== undefined) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }
  }

  /**
   * Emit cache event
   */
  private emitEvent(event: CacheEvent): void {
    this.eventListeners.forEach((listener) => listener(event));
  }

  /**
   * Add event listener
   */
  on(event: (event: CacheEvent) => void): void {
    this.eventListeners.push(event);
  }

  /**
   * Remove event listener
   */
  off(event: (event: CacheEvent) => void): void {
    this.eventListeners = this.eventListeners.filter((l) => l !== event);
  }

  /**
   * Add invalidation rule
   */
  addInvalidationRule(rule: CacheInvalidationRule): void {
    this.invalidationRules.push(rule);
  }

  /**
   * Remove invalidation rule
   */
  removeInvalidationRule(rule: CacheInvalidationRule): void {
    this.invalidationRules = this.invalidationRules.filter((r) => r !== rule);
  }

  /**
   * Apply invalidation rules
   */
  async applyInvalidationRules(): Promise<void> {
    for (const rule of this.invalidationRules) {
      if (rule.type === 'tag' && rule.tags) {
        await this.invalidateByTags(rule.tags);
      } else if (rule.type === 'pattern' && rule.condition instanceof RegExp) {
        await this.invalidateByPattern(rule.condition);
      }
    }
  }

  /**
   * Invalidate by tags
   */
  private async invalidateByTags(tags: string[]): Promise<void> {
    const keys = await this.keys();
    const adapter = this.adapters.get(this.config.strategy);

    if (!adapter) {
      return;
    }

    for (const key of keys) {
      const entry = this.cache.get(key);
      if (entry && tags.some((tag) => entry.tags.includes(tag))) {
        await adapter.delete(key);
      }
    }
  }

  /**
   * Invalidate by pattern
   */
  private async invalidateByPattern(pattern: RegExp): Promise<void> {
    const keys = await this.keys();
    const adapter = this.adapters.get(this.config.strategy);

    if (!adapter) {
      return;
    }

    for (const key of keys) {
      if (pattern.test(key)) {
        await adapter.delete(key);
      }
    }
  }

  /**
   * Background refresh (for stale-while-revalidate)
   */
  private backgroundRefresh(key: string): void {
    // This would typically trigger a network request
    // Implementation depends on specific use case
    // For now, just log the refresh
    console.log(`Background refresh triggered for key: ${key}`);
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Cleanup expired entries
   */
  private async cleanup(): Promise<void> {
    const keys = await this.keys();
    const now = Date.now();
    const adapter = this.adapters.get(this.config.strategy);

    if (!adapter) {
      return;
    }

    for (const key of keys) {
      const entry = this.cache.get(key);
      if (entry && entry.expiresAt < now) {
        await adapter.delete(key);
      }
    }

    this.metrics.lastCleanup = now;

    // Ensure capacity
    if ((await this.size()) > this.config.maxEntries) {
      await this.evictEntries(this.config.maxEntries * 0.8);
    }
  }

  /**
   * Prewarm cache
   */
  async prewarm(config: CachePrewarmConfig, dataFetcher: (key: string) => Promise<any>): Promise<void> {
    if (!config.enabled) {
      return;
    }

    for (let i = 0; i < config.keys.length; i++) {
      const key = config.keys[i];
      const value = await dataFetcher(key);
      await this.set(key, value, { priority: config.priority });

      if (config.onProgress) {
        config.onProgress(i + 1, config.keys.length);
      }
    }
  }

  /**
   * Load from storage (for memory strategy)
   */
  private loadFromStorage(): void {
    // Implementation depends on persistence requirements
    // For now, this is a placeholder
  }

  /**
   * Reset cache service
   */
  static reset(): void {
    if (CacheService.instance) {
      CacheService.instance.stopCleanupTimer();
      CacheService.instance.clear();
      CacheService.instance = null;
    }
  }
}

export { CacheService };
