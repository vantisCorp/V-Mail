/**
 * Performance utility functions for Vantis Mail
 */

/**
 * Memoize function results to avoid expensive recalculations
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Debounce function to limit execution rate
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Throttle function to limit execution rate
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastResult: ReturnType<T>;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = fn(...args);

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult;
  };
}

/**
 * Request animation frame throttle for smooth animations
 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(fn: T): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return (...args: Parameters<T>) => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      fn(...args);
      rafId = null;
    });
  };
}

/**
 * Lazy load images with intersection observer
 */
export function lazyLoadImages(selector: string = 'img[data-src]', options?: IntersectionObserverInit): void {
  const images = document.querySelectorAll(selector);

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute('data-src');

          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    }, options);

    images.forEach((img) => imageObserver.observe(img));
  } else {
    // Fallback for browsers without IntersectionObserver
    images.forEach((img) => {
      const src = img.getAttribute('data-src');
      if (src) {
        (img as HTMLImageElement).src = src;
        img.removeAttribute('data-src');
      }
    });
  }
}

/**
 * Preload critical resources
 */
export function preloadResources(resources: Array<{ href: string; as: string }>): void {
  resources.forEach((resource) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    document.head.appendChild(link);
  });
}

/**
 * Measure performance of a function
 */
export function measurePerformance<T extends (...args: unknown[]) => unknown>(fn: T, label: string): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();

    // eslint-disable-next-line no-console
    console.log(`${label} took ${(end - start).toFixed(2)}ms`);
    return result;
  }) as T;
}

/**
 * Batch DOM updates to reduce reflows
 */
export function batchDOMUpdates(updates: Array<() => void>): void {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
}

/**
 * Virtual scroll helper for large lists
 */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  buffer: number = 5
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const end = Math.min(totalItems, Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer);

  return { start, end };
}

/**
 * Optimize image URL with quality and size parameters
 */
export function optimizeImageUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }
): string {
  if (!url) {
    return url;
  }

  const params = new URLSearchParams();
  if (options?.width) {
    params.append('w', options.width.toString());
  }
  if (options?.height) {
    params.append('h', options.height.toString());
  }
  if (options?.quality) {
    params.append('q', options.quality.toString());
  }
  if (options?.format) {
    params.append('f', options.format);
  }

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Check if user is on slow connection
 */
export function isSlowConnection(): boolean {
  const connection = (navigator as unknown).connection;
  if (!connection) {
    return false;
  }

  return connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
}

/**
 * Get device memory (if available)
 */
export function getDeviceMemory(): number {
  return (navigator as unknown).deviceMemory || 4; // Default to 4GB
}

/**
 * Get hardware concurrency (CPU cores)
 */
export function getHardwareConcurrency(): number {
  return navigator.hardwareConcurrency || 4;
}
