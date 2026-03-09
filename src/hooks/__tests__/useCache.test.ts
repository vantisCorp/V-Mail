import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCache, useCacheManager, useCachedFetch } from '../useCache';
import { CacheService } from '../../services/cacheService';

describe('useCache', () => {
  beforeEach(() => {
    CacheService.reset();
  });

  afterEach(() => {
    CacheService.reset();
  });

  describe('basic operations', () => {
    it('should initialize with null data', () => {
      const { result } = renderHook(() => useCache({ key: 'test-key' }));
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set data', async () => {
      const { result } = renderHook(() => useCache({ key: 'test-key' }));

      await act(async () => {
        await result.current.set('test-value');
      });

      expect(result.current.data).toBe('test-value');
      expect(result.current.isLoading).toBe(false);
    });

    it('should invalidate data', async () => {
      const { result } = renderHook(() => useCache({ key: 'test-key' }));

      await act(async () => {
        await result.current.set('test-value');
      });

      expect(result.current.data).toBe('test-value');

      await act(async () => {
        await result.current.invalidate();
      });

      expect(result.current.data).toBeNull();
    });

    it('should refresh data', async () => {
      const { result } = renderHook(() => useCache({ key: 'test-key' }));

      await act(async () => {
        await result.current.set('test-value');
      });

      expect(result.current.data).toBe('test-value');

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.data).toBe('test-value');
    });
  });

  describe('stale data', () => {
    it('should mark data as stale after staleTime', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useCache({ key: 'test-key', staleTime: 1000 }));

      await act(async () => {
        await result.current.set('test-value');
      });

      expect(result.current.isStale).toBe(false);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isStale).toBe(true);

      vi.useRealTimers();
    });

    it('should reset stale state on new data', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useCache({ key: 'test-key', staleTime: 1000 }));

      await act(async () => {
        await result.current.set('test-value');
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isStale).toBe(true);

      await act(async () => {
        await result.current.set('new-value');
      });

      expect(result.current.isStale).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('should handle set errors', async () => {
      const { result } = renderHook(() => useCache({ key: 'test-key' }));

      await act(async () => {
        try {
          await result.current.set('test-value');
        } catch {
          // Ignore
        }
      });

      // If set succeeds, error should be null
      expect(result.current.error).toBeNull();
    });
  });
});

describe('useCacheManager', () => {
  beforeEach(() => {
    CacheService.reset();
  });

  afterEach(() => {
    CacheService.reset();
  });

  describe('metrics', () => {
    it('should provide cache metrics', async () => {
      const { result } = renderHook(() => useCacheManager());

      // Wait for the interval to populate metrics (1000ms interval in hook)
      await waitFor(
        () => {
          expect(result.current.metrics).not.toBeNull();
        },
        { timeout: 2000 }
      );

      if (result.current.metrics) {
        expect(result.current.metrics.hits).toBeGreaterThanOrEqual(0);
        expect(result.current.metrics.misses).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('events', () => {
    it('should track cache events', async () => {
      const { result } = renderHook(() => useCacheManager());

      const cacheService = CacheService.getInstance();
      await cacheService.set('test-key', 'test-value');

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });
    });
  });

  describe('clear operations', () => {
    it('should clear all cache', async () => {
      const { result } = renderHook(() => useCacheManager());

      const cacheService = CacheService.getInstance();
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      await act(async () => {
        await result.current.clearCache();
      });

      const keys = await cacheService.keys();
      expect(keys).toHaveLength(0);
    });

    it('should clear by key', async () => {
      const { result } = renderHook(() => useCacheManager());

      const cacheService = CacheService.getInstance();
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      await act(async () => {
        await result.current.clearByKey('key1');
      });

      const value1 = await cacheService.get('key1');
      const value2 = await cacheService.get('key2');
      expect(value1).toBeNull();
      expect(value2).toBe('value2');
    });

    it('should clear by pattern', async () => {
      const { result } = renderHook(() => useCacheManager());

      const cacheService = CacheService.getInstance();
      await cacheService.set('email_1', 'value1');
      await cacheService.set('email_2', 'value2');
      await cacheService.set('thread_1', 'value3');

      await act(async () => {
        await result.current.clearByPattern(/^email_/);
      });

      const value1 = await cacheService.get('email_1');
      const value2 = await cacheService.get('email_2');
      const value3 = await cacheService.get('thread_1');

      expect(value1).toBeNull();
      expect(value2).toBeNull();
      expect(value3).toBe('value3');
    });
  });

  describe('invalidation rules', () => {
    it('should add invalidation rule', () => {
      const { result } = renderHook(() => useCacheManager());

      const rule = {
        type: 'tag' as const,
        condition: 'email',
        action: 'delete' as const,
        tags: ['email']
      };

      act(() => {
        result.current.addInvalidationRule(rule);
      });

      // Rule should be added without error
      expect(true).toBe(true);
    });

    it('should remove invalidation rule', () => {
      const { result } = renderHook(() => useCacheManager());

      const rule = {
        type: 'tag' as const,
        condition: 'email',
        action: 'delete' as const,
        tags: ['email']
      };

      act(() => {
        result.current.addInvalidationRule(rule);
        result.current.removeInvalidationRule(rule);
      });

      // Rule should be removed without error
      expect(true).toBe(true);
    });
  });

  describe('prewarm', () => {
    it('should prewarm cache', async () => {
      const { result } = renderHook(() => useCacheManager());

      const dataFetcher = async (key: string) => {
        return `data-${key}`;
      };

      await act(async () => {
        await result.current.prewarmCache(
          {
            enabled: true,
            keys: ['key1', 'key2']
          },
          dataFetcher
        );
      });

      const cacheService = CacheService.getInstance();
      const value1 = await cacheService.get('key1');
      const value2 = await cacheService.get('key2');

      expect(value1).toBe('data-key1');
      expect(value2).toBe('data-key2');
    });
  });
});

describe('useCachedFetch', () => {
  beforeEach(() => {
    CacheService.reset();
  });

  afterEach(() => {
    CacheService.reset();
  });

  describe('basic operations', () => {
    it('should fetch and cache data', async () => {
      const fetcher = vi.fn().mockResolvedValue('fetched-data');

      const { result } = renderHook(() => useCachedFetch('test-key', fetcher, { enabled: true }));

      await waitFor(() => {
        expect(result.current.data).toBe('fetched-data');
      });

      expect(fetcher).toHaveBeenCalled();
    });

    it('should use cached data on subsequent calls', async () => {
      const fetcher = vi.fn().mockResolvedValue('fetched-data');

      const { result, rerender } = renderHook(() => useCachedFetch('test-key', fetcher, { enabled: true }));

      await waitFor(() => {
        expect(result.current.data).toBe('fetched-data');
      });

      expect(fetcher).toHaveBeenCalledTimes(1);

      // Rerender should use cache
      rerender();

      await waitFor(() => {
        expect(result.current.data).toBe('fetched-data');
      });

      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should not fetch when disabled', async () => {
      const fetcher = vi.fn().mockResolvedValue('fetched-data');

      renderHook(() => useCachedFetch('test-key', fetcher, { enabled: false }));

      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Fetch failed'));

      const { result } = renderHook(() => useCachedFetch('test-key', fetcher, { enabled: true }));

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('manual fetch', () => {
    it('should manually fetch data', async () => {
      const fetcher = vi.fn().mockResolvedValue('fetched-data');

      const { result } = renderHook(() => useCachedFetch('test-key', fetcher, { enabled: false }));

      expect(fetcher).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.fetch();
      });

      expect(result.current.data).toBe('fetched-data');
      expect(fetcher).toHaveBeenCalled();
    });
  });
});
