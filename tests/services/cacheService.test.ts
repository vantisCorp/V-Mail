import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheService } from '../../src/services/cacheService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null)
  };
})();

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null)
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock });

describe('CacheService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    CacheService.reset();
    localStorageMock.clear();
    sessionStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    CacheService.reset();
    vi.useRealTimers();
  });

  // =============================================
  // Singleton
  // =============================================
  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = CacheService.getInstance();
      const instance2 = CacheService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should accept custom config', () => {
      const instance = CacheService.getInstance({ maxEntries: 500 });
      expect(instance.getConfig().maxEntries).toBe(500);
    });

    it('should have default config values', () => {
      const instance = CacheService.getInstance();
      const config = instance.getConfig();
      expect(config.strategy).toBe('memory');
      expect(config.defaultPolicy).toBe('cache-first');
      expect(config.maxEntries).toBe(1000);
      expect(config.enableCompression).toBe(false);
      expect(config.enableMetrics).toBe(true);
    });
  });

  // =============================================
  // Basic CRUD operations
  // =============================================
  describe('set / get', () => {
    it('should store and retrieve a value', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key1', 'value1');
      const result = await cache.get<string>('key1');
      expect(result).toBe('value1');
    });

    it('should store and retrieve objects', async () => {
      const cache = CacheService.getInstance();
      const obj = { name: 'Alice', age: 30 };
      await cache.set('user', obj);
      const result = await cache.get<typeof obj>('user');
      expect(result).toEqual(obj);
    });

    it('should store and retrieve arrays', async () => {
      const cache = CacheService.getInstance();
      const arr = [1, 2, 3];
      await cache.set('numbers', arr);
      const result = await cache.get<number[]>('numbers');
      expect(result).toEqual(arr);
    });

    it('should return null for non-existent key', async () => {
      const cache = CacheService.getInstance();
      const result = await cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null for expired entry', async () => {
      const cache = CacheService.getInstance();
      await cache.set('expiring', 'value', { ttl: 1000 });

      // Advance time past TTL
      vi.advanceTimersByTime(1500);

      const result = await cache.get('expiring');
      expect(result).toBeNull();
    });

    it('should return value before TTL expires', async () => {
      const cache = CacheService.getInstance();
      await cache.set('alive', 'value', { ttl: 5000 });

      vi.advanceTimersByTime(3000);

      const result = await cache.get<string>('alive');
      expect(result).toBe('value');
    });

    it('should overwrite existing key', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key', 'first');
      await cache.set('key', 'second');
      const result = await cache.get<string>('key');
      expect(result).toBe('second');
    });
  });

  // =============================================
  // delete
  // =============================================
  describe('delete', () => {
    it('should delete a cached entry', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key1', 'value1');
      await cache.delete('key1');
      const result = await cache.get('key1');
      expect(result).toBeNull();
    });

    it('should not throw when deleting non-existent key', async () => {
      const cache = CacheService.getInstance();
      await expect(cache.delete('nonexistent')).resolves.not.toThrow();
    });
  });

  // =============================================
  // clear
  // =============================================
  describe('clear', () => {
    it('should clear all entries', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.clear();
      const size = await cache.size();
      expect(size).toBe(0);
    });
  });

  // =============================================
  // has
  // =============================================
  describe('has', () => {
    it('should return true for existing key', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key1', 'value1');
      expect(await cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      const cache = CacheService.getInstance();
      expect(await cache.has('nonexistent')).toBe(false);
    });
  });

  // =============================================
  // keys
  // =============================================
  describe('keys', () => {
    it('should return all cache keys', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key1', 'v1');
      await cache.set('key2', 'v2');
      const keys = await cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should return empty array when cache is empty', async () => {
      const cache = CacheService.getInstance();
      const keys = await cache.keys();
      expect(keys).toEqual([]);
    });
  });

  // =============================================
  // size
  // =============================================
  describe('size', () => {
    it('should return correct size', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key1', 'v1');
      await cache.set('key2', 'v2');
      expect(await cache.size()).toBe(2);
    });

    it('should return 0 for empty cache', async () => {
      const cache = CacheService.getInstance();
      expect(await cache.size()).toBe(0);
    });
  });

  // =============================================
  // Metrics
  // =============================================
  describe('getMetrics', () => {
    it('should track hits', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key1', 'value1');
      await cache.get('key1');
      await cache.get('key1');

      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(2);
    });

    it('should track misses', async () => {
      const cache = CacheService.getInstance();
      await cache.get('nonexistent1');
      await cache.get('nonexistent2');

      const metrics = cache.getMetrics();
      expect(metrics.misses).toBe(2);
    });

    it('should track sets', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key1', 'v1');
      await cache.set('key2', 'v2');

      const metrics = cache.getMetrics();
      expect(metrics.sets).toBe(2);
    });

    it('should track deletes', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key1', 'v1');
      await cache.delete('key1');

      const metrics = cache.getMetrics();
      expect(metrics.deletes).toBe(1);
    });

    it('should track clears', async () => {
      const cache = CacheService.getInstance();
      await cache.clear();

      const metrics = cache.getMetrics();
      expect(metrics.clears).toBe(1);
    });

    it('should calculate hit rate correctly', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key1', 'value1');
      await cache.get('key1'); // hit
      await cache.get('nonexistent'); // miss

      const metrics = cache.getMetrics();
      expect(metrics.hitRate).toBe(0.5);
      expect(metrics.missRate).toBe(0.5);
    });

    it('should return 0 hit rate when no accesses', () => {
      const cache = CacheService.getInstance();
      const metrics = cache.getMetrics();
      expect(metrics.hitRate).toBe(0);
      expect(metrics.missRate).toBe(0);
    });
  });

  // =============================================
  // Cache policies
  // =============================================
  describe('cache policies', () => {
    it('should skip cache for network-only policy', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key1', 'value1');
      const result = await cache.get('key1', 'network-only');
      expect(result).toBeNull();
    });

    it('should return cached value for cache-first policy', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key1', 'value1');
      const result = await cache.get<string>('key1', 'cache-first');
      expect(result).toBe('value1');
    });

    it('should trigger background refresh for stale-while-revalidate', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const cache = CacheService.getInstance();
      await cache.set('key1', 'value1');
      await cache.get('key1', 'stale-while-revalidate');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Background refresh triggered for key: key1'));
      consoleSpy.mockRestore();
    });
  });

  // =============================================
  // Config
  // =============================================
  describe('updateConfig', () => {
    it('should update configuration', () => {
      const cache = CacheService.getInstance();
      cache.updateConfig({ maxEntries: 2000 });
      expect(cache.getConfig().maxEntries).toBe(2000);
    });

    it('should restart cleanup timer when interval changes', () => {
      const cache = CacheService.getInstance();
      cache.updateConfig({ cleanupInterval: 30000 });
      expect(cache.getConfig().cleanupInterval).toBe(30000);
    });
  });

  // =============================================
  // Event listeners
  // =============================================
  describe('event listeners', () => {
    it('should emit set event', async () => {
      const cache = CacheService.getInstance();
      const listener = vi.fn();
      cache.on(listener);

      await cache.set('key1', 'value1');

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'set', key: 'key1' }));
    });

    it('should emit hit event', async () => {
      const cache = CacheService.getInstance();
      const listener = vi.fn();
      await cache.set('key1', 'value1');

      cache.on(listener);
      await cache.get('key1');

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'hit', key: 'key1' }));
    });

    it('should emit miss event', async () => {
      const cache = CacheService.getInstance();
      const listener = vi.fn();
      cache.on(listener);

      await cache.get('nonexistent');

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'miss', key: 'nonexistent' }));
    });

    it('should emit delete event', async () => {
      const cache = CacheService.getInstance();
      const listener = vi.fn();
      await cache.set('key1', 'value1');

      cache.on(listener);
      await cache.delete('key1');

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'delete', key: 'key1' }));
    });

    it('should emit clear event', async () => {
      const cache = CacheService.getInstance();
      const listener = vi.fn();
      cache.on(listener);

      await cache.clear();

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'clear', key: '*' }));
    });

    it('should remove event listener with off()', async () => {
      const cache = CacheService.getInstance();
      const listener = vi.fn();
      cache.on(listener);
      cache.off(listener);

      await cache.set('key1', 'value1');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // Invalidation rules
  // =============================================
  describe('invalidation rules', () => {
    it('should add and apply tag-based invalidation rule', async () => {
      const cache = CacheService.getInstance();
      await cache.set('user:1', { name: 'Alice' }, { tags: ['users'] });
      await cache.set('post:1', { title: 'Hello' }, { tags: ['posts'] });

      cache.addInvalidationRule({
        type: 'tag',
        condition: 'users',
        action: 'delete',
        tags: ['users']
      });

      await cache.applyInvalidationRules();

      expect(await cache.get('user:1')).toBeNull();
      expect(await cache.get('post:1')).not.toBeNull();
    });

    it('should add and apply pattern-based invalidation rule', async () => {
      const cache = CacheService.getInstance();
      await cache.set('user:1', { name: 'Alice' });
      await cache.set('user:2', { name: 'Bob' });
      await cache.set('post:1', { title: 'Hello' });

      cache.addInvalidationRule({
        type: 'pattern',
        condition: /^user:/,
        action: 'delete'
      });

      await cache.applyInvalidationRules();

      expect(await cache.get('user:1')).toBeNull();
      expect(await cache.get('user:2')).toBeNull();
      expect(await cache.get('post:1')).not.toBeNull();
    });

    it('should remove invalidation rule', async () => {
      const cache = CacheService.getInstance();
      const rule = {
        type: 'tag' as const,
        condition: 'users',
        action: 'delete' as const,
        tags: ['users']
      };

      cache.addInvalidationRule(rule);
      cache.removeInvalidationRule(rule);

      await cache.set('user:1', { name: 'Alice' }, { tags: ['users'] });
      await cache.applyInvalidationRules();

      // Rule was removed, so entry should still exist
      expect(await cache.get('user:1')).not.toBeNull();
    });
  });

  // =============================================
  // Prewarm
  // =============================================
  describe('prewarm', () => {
    it('should prewarm cache with provided keys', async () => {
      const cache = CacheService.getInstance();
      const fetcher = vi.fn().mockImplementation(async (key: string) => `value_${key}`);

      await cache.prewarm({ enabled: true, keys: ['k1', 'k2', 'k3'] }, fetcher);

      expect(fetcher).toHaveBeenCalledTimes(3);
      expect(await cache.get('k1')).toBe('value_k1');
      expect(await cache.get('k2')).toBe('value_k2');
      expect(await cache.get('k3')).toBe('value_k3');
    });

    it('should not prewarm when disabled', async () => {
      const cache = CacheService.getInstance();
      const fetcher = vi.fn();

      await cache.prewarm({ enabled: false, keys: ['k1'] }, fetcher);

      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should call onProgress callback', async () => {
      const cache = CacheService.getInstance();
      const fetcher = vi.fn().mockResolvedValue('value');
      const onProgress = vi.fn();

      await cache.prewarm({ enabled: true, keys: ['k1', 'k2'], onProgress }, fetcher);

      expect(onProgress).toHaveBeenCalledWith(1, 2);
      expect(onProgress).toHaveBeenCalledWith(2, 2);
    });
  });

  // =============================================
  // Reset
  // =============================================
  describe('reset', () => {
    it('should reset the singleton instance', async () => {
      const instance1 = CacheService.getInstance();
      await instance1.set('key1', 'value1');

      CacheService.reset();

      const instance2 = CacheService.getInstance();
      expect(instance2).not.toBe(instance1);
      expect(await instance2.get('key1')).toBeNull();
    });
  });

  // =============================================
  // Options: tags and version
  // =============================================
  describe('cache options', () => {
    it('should store entries with tags', async () => {
      const cache = CacheService.getInstance();
      await cache.set('key1', 'value1', { tags: ['tag1', 'tag2'] });
      const result = await cache.get<string>('key1');
      expect(result).toBe('value1');
    });

    it('should store entries with custom TTL', async () => {
      const cache = CacheService.getInstance();
      await cache.set('short', 'value', { ttl: 500 });

      expect(await cache.get('short')).toBe('value');

      vi.advanceTimersByTime(600);

      expect(await cache.get('short')).toBeNull();
    });
  });
});
