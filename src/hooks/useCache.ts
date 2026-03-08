/**
 * Cache Hook
 * React hook for managing cache operations
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { CacheService } from '../services/cacheService';
import type {
  CachePolicy,
  CacheOptions,
  CacheStats,
  CacheEvent,
  CacheInvalidationRule,
  CachePrewarmConfig,
  CacheConfig,
} from '../types/caching';

interface UseCacheOptions {
  key: string;
  policy?: CachePolicy;
  staleTime?: number;
  cacheTime?: number;
}

export function useCache<T = any>(options: UseCacheOptions) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const cacheService = useRef(CacheService.getInstance());
  const staleTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    loadFromCache();
    return () => {
      if (staleTimerRef.current) {
        clearTimeout(staleTimerRef.current);
      }
    };
  }, [options.key]);

  useEffect(() => {
    if (options.staleTime && data !== null) {
      setIsStale(false);
      staleTimerRef.current = setTimeout(() => {
        setIsStale(true);
      }, options.staleTime);
    }
  }, [data, options.staleTime]);

  const loadFromCache = useCallback(async () => {
    try {
      const cachedData = await cacheService.current.get<T>(options.key, options.policy);
      setData(cachedData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Cache load failed'));
    }
  }, [options.key, options.policy]);

  const set = useCallback(
    async (value: T, cacheOptions?: CacheOptions) => {
      try {
        setIsLoading(true);
        const optionsWithCache: CacheOptions = {
          ttl: options.cacheTime,
          ...cacheOptions,
        };
        await cacheService.current.set(options.key, value, optionsWithCache);
        setData(value);
        setIsStale(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Cache set failed'));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [options.key, options.cacheTime]
  );

  const invalidate = useCallback(async () => {
    try {
      await cacheService.current.delete(options.key);
      setData(null);
      setIsStale(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Cache invalidate failed'));
    }
  }, [options.key]);

  const refresh = useCallback(async () => {
    return loadFromCache();
  }, [loadFromCache]);

  return {
    data,
    isLoading,
    error,
    isStale,
    set,
    invalidate,
    refresh,
  };
}

/**
 * Hook for cache management operations
 */
export function useCacheManager() {
  const [metrics, setMetrics] = useState<CacheStats | null>(null);
  const [events, setEvents] = useState<CacheEvent[]>([]);
  const cacheService = useRef(CacheService.getInstance());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(cacheService.current.getMetrics());
    }, 1000);

    // Subscribe to events
    const eventHandler = (event: CacheEvent) => {
      setEvents((prev) => [...prev.slice(-99), event]); // Keep last 100 events
    };

    cacheService.current.on(eventHandler);

    return () => {
      clearInterval(interval);
      cacheService.current.off(eventHandler);
    };
  }, []);

  const clearCache = useCallback(async () => {
    await cacheService.current.clear();
  }, []);

  const clearByKey = useCallback(async (key: string) => {
    await cacheService.current.delete(key);
  }, []);

  const clearByPattern = useCallback(async (pattern: RegExp) => {
    const keys = await cacheService.current.keys();
    for (const key of keys) {
      if (pattern.test(key)) {
        await cacheService.current.delete(key);
      }
    }
  }, []);

  const addInvalidationRule = useCallback((rule: CacheInvalidationRule) => {
    cacheService.current.addInvalidationRule(rule);
  }, []);

  const removeInvalidationRule = useCallback((rule: CacheInvalidationRule) => {
    cacheService.current.removeInvalidationRule(rule);
  }, []);

  const prewarmCache = useCallback(
    async (config: CachePrewarmConfig, dataFetcher: (key: string) => Promise<any>) => {
      await cacheService.current.prewarm(config, dataFetcher);
    },
    []
  );

  return {
    metrics,
    events,
    clearCache,
    clearByKey,
    clearByPattern,
    addInvalidationRule,
    removeInvalidationRule,
    prewarmCache,
  };
}

/**
 * Hook for cached data fetching
 */
export function useCachedFetch<T = any>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    policy?: CachePolicy;
    staleTime?: number;
    cacheTime?: number;
    enabled?: boolean;
  }
) {
  const cache = useCache<T>({ key, ...options });
  const [isFetching, setIsFetching] = useState(false);
  const fetchRef = useRef(fetcher);

  // Update ref when fetcher changes
  fetchRef.current = fetcher;

  const fetch = useCallback(async () => {
    // Only skip automatic fetch when disabled, but allow manual fetch
    try {
      setIsFetching(true);
      const data = await fetchRef.current();
      await cache.set(data);
      return data;
    } catch (err) {
      // Set the error state from the cache hook
      const errorMessage = err instanceof Error ? err.message : 'Fetch failed';
      // We need to trigger the error state - useCache doesn't expose setError directly
      // So we'll just re-throw and let the caller handle it
      throw err;
    } finally {
      setIsFetching(false);
    }
  }, [cache.set]);

  // Track fetch errors
  const [fetchError, setFetchError] = useState<Error | null>(null);

  useEffect(() => {
    if (options?.enabled !== false && cache.data === null) {
      fetch().catch((err) => {
        setFetchError(err instanceof Error ? err : new Error('Fetch failed'));
      });
    }
  }, [options?.enabled, cache.data, fetch]);

  return {
    ...cache,
    error: cache.error || fetchError,
    fetch,
    isFetching,
  };
}