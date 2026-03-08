import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService } from '../cacheService';
import type { CacheStrategy, CachePolicy, CacheOptions, CacheEvent } from '../../types/caching';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    CacheService.reset();
    cacheService = CacheService.getInstance();
  });

  afterEach(() => {
    CacheService.reset();
  });

  describe('initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = CacheService.getInstance();
      const instance2 = CacheService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with default config', () => {
      const config = cacheService.getConfig();
      expect(config.strategy).toBe('memory');
      expect(config.defaultPolicy).toBe('cache-first');
      expect(config.maxEntries).toBe(1000);
    });

    it('should accept custom config', () => {
      CacheService.reset();
      const customCache = CacheService.getInstance({
        strategy: 'localStorage',
        maxEntries: 500
      });
      const config = customCache.getConfig();
      expect(config.strategy).toBe('localStorage');
      expect(config.maxEntries).toBe(500);
    });
  });

  describe('basic operations', () => {
    it('should set and get value', async () => {
      await cacheService.set('test-key', 'test-value');
      const value = await cacheService.get<string>('test-key');
      expect(value).toBe('test-value');
    });

    it('should set and get object', async () => {
      const testObj = { name: 'test', value: 123 };
      await cacheService.set('test-obj', testObj);
      const value = await cacheService.get<typeof testObj>('test-obj');
      expect(value).toEqual(testObj);
    });

    it('should return null for non-existent key', async () => {
      const value = await cacheService.get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete value', async () => {
      await cacheService.set('test-key', 'test-value');
      await cacheService.delete('test-key');
      const value = await cacheService.get('test-key');
      expect(value).toBeNull();
    });

    it('should clear all values', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.clear();
      const value1 = await cacheService.get('key1');
      const value2 = await cacheService.get('key2');
      expect(value1).toBeNull();
      expect(value2).toBeNull();
    });

    it('should check if key exists', async () => {
      await cacheService.set('test-key', 'test-value');
      const exists = await cacheService.has('test-key');
      const notExists = await cacheService.has('non-existent');
      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it('should get all keys', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');
      const keys = await cacheService.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should get cache size', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      const size = await cacheService.size();
      expect(size).toBe(2);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      await cacheService.set('test-key', 'test-value', { ttl: 100 });
      const value1 = await cacheService.get('test-key');
      expect(value1).toBe('test-value');

      await new Promise((resolve) => setTimeout(resolve, 150));
      const value2 = await cacheService.get('test-key');
      expect(value2).toBeNull();
    });
  });

  describe('cache policies', () => {
    it('should respect cache-first policy', async () => {
      await cacheService.set('test-key', 'cached-value');
      const value = await cacheService.get('test-key', 'cache-first');
      expect(value).toBe('cached-value');
    });

    it('should respect network-only policy', async () => {
      await cacheService.set('test-key', 'cached-value');
      const value = await cacheService.get('test-key', 'network-only');
      expect(value).toBeNull();
    });

    it('should respect cache-only policy', async () => {
      const value = await cacheService.get('non-existent', 'cache-only');
      expect(value).toBeNull();
    });
  });

  describe('metrics', () => {
    it('should track hits', async () => {
      await cacheService.set('test-key', 'test-value');
      await cacheService.get('test-key');
      const metrics = cacheService.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(0);
      expect(metrics.hitRate).toBe(1);
    });

    it('should track misses', async () => {
      await cacheService.get('non-existent');
      const metrics = cacheService.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(1);
      expect(metrics.missRate).toBe(1);
    });

    it('should track sets', async () => {
      await cacheService.set('test-key', 'test-value');
      const metrics = cacheService.getMetrics();
      expect(metrics.sets).toBe(1);
    });

    it('should track deletes', async () => {
      await cacheService.set('test-key', 'test-value');
      await cacheService.delete('test-key');
      const metrics = cacheService.getMetrics();
      expect(metrics.deletes).toBe(1);
    });

    it('should track evictions', async () => {
      CacheService.reset(); // Reset to allow custom config
      const smallCache = CacheService.getInstance({ maxEntries: 2 });
      await smallCache.set('key1', 'value1');
      await smallCache.set('key2', 'value2');
      await smallCache.set('key3', 'value3');
      const metrics = smallCache.getMetrics();
      expect(metrics.evictions).toBeGreaterThan(0);
    });

    it('should calculate hit rate correctly', async () => {
      await cacheService.set('test-key', 'test-value');
      await cacheService.get('test-key');
      await cacheService.get('test-key');
      await cacheService.get('non-existent');
      const metrics = cacheService.getMetrics();
      expect(metrics.hitRate).toBe(0.6666666666666666);
    });
  });

  describe('events', () => {
    it('should emit hit event', (done) => {
      const handler = (event: CacheEvent) => {
        if (event.type === 'hit') {
          expect(event.key).toBe('test-key');
          cacheService.off(handler);
          done();
        }
      };
      cacheService.on(handler);

      (async () => {
        await cacheService.set('test-key', 'test-value');
        await cacheService.get('test-key');
      })();
    });

    it('should emit miss event', async () => {
      const eventPromise = new Promise<CacheEvent>((resolve) => {
        const handler = (event: CacheEvent) => {
          if (event.type === 'miss') {
            cacheService.off(handler);
            resolve(event);
          }
        };
        cacheService.on(handler);
      });

      await cacheService.get('non-existent');
      const event = await eventPromise;
      expect(event.key).toBe('non-existent');
    });

    it('should emit set event', async () => {
      const eventPromise = new Promise<CacheEvent>((resolve) => {
        const handler = (event: CacheEvent) => {
          if (event.type === 'set') {
            cacheService.off(handler);
            resolve(event);
          }
        };
        cacheService.on(handler);
      });

      await cacheService.set('test-key', 'test-value');
      const event = await eventPromise;
      expect(event.key).toBe('test-key');
      expect(event.size).toBeGreaterThan(0);
    });

    it('should emit delete event', async () => {
      await cacheService.set('test-key', 'test-value');

      const eventPromise = new Promise<CacheEvent>((resolve) => {
        const handler = (event: CacheEvent) => {
          if (event.type === 'delete') {
            cacheService.off(handler);
            resolve(event);
          }
        };
        cacheService.on(handler);
      });

      await cacheService.delete('test-key');
      const event = await eventPromise;
      expect(event.key).toBe('test-key');
    });
  });

  describe('invalidation rules', () => {
    it('should invalidate by tag', async () => {
      await cacheService.set('key1', 'value1', { tags: ['email'] });
      await cacheService.set('key2', 'value2', { tags: ['email'] });
      await cacheService.set('key3', 'value3', { tags: ['thread'] });

      cacheService.addInvalidationRule({
        type: 'tag',
        condition: 'email',
        action: 'delete',
        tags: ['email']
      });

      await cacheService.applyInvalidationRules();

      const value1 = await cacheService.get('key1');
      const value2 = await cacheService.get('key2');
      const value3 = await cacheService.get('key3');

      expect(value1).toBeNull();
      expect(value2).toBeNull();
      expect(value3).toBe('value3');
    });

    it('should invalidate by pattern', async () => {
      await cacheService.set('email_1', 'value1');
      await cacheService.set('email_2', 'value2');
      await cacheService.set('thread_1', 'value3');

      cacheService.addInvalidationRule({
        type: 'pattern',
        condition: /^email_/,
        action: 'delete'
      });

      await cacheService.applyInvalidationRules();

      const value1 = await cacheService.get('email_1');
      const value2 = await cacheService.get('email_2');
      const value3 = await cacheService.get('thread_1');

      expect(value1).toBeNull();
      expect(value2).toBeNull();
      expect(value3).toBe('value3');
    });
  });

  describe('prewarm', () => {
    it('should prewarm cache with data', async () => {
      const dataFetcher = async (key: string) => {
        return `data-${key}`;
      };

      await cacheService.prewarm(
        {
          enabled: true,
          keys: ['key1', 'key2', 'key3']
        },
        dataFetcher
      );

      const value1 = await cacheService.get('key1');
      const value2 = await cacheService.get('key2');
      const value3 = await cacheService.get('key3');

      expect(value1).toBe('data-key1');
      expect(value2).toBe('data-key2');
      expect(value3).toBe('data-key3');
    });
  });

  describe('configuration updates', () => {
    it('should update configuration', () => {
      cacheService.updateConfig({
        maxEntries: 500,
        cleanupInterval: 30000
      });

      const config = cacheService.getConfig();
      expect(config.maxEntries).toBe(500);
      expect(config.cleanupInterval).toBe(30000);
    });
  });
});
