import React from 'react';

// Enhanced caching system with multiple storage strategies

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
  metadata?: Record<string, unknown>;
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  version?: string; // Cache version for invalidation
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
  serialize?: boolean; // Whether to serialize complex objects
  compress?: boolean; // Whether to compress data (for localStorage)
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxMemorySize = 100; // Maximum number of entries in memory
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
  };

  constructor() {
    this.setupCleanupInterval();
  }

  private setupCleanupInterval() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private generateKey(key: string, version?: string): string {
    return version ? `${key}:${version}` : key;
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private serializeData(data: unknown): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.warn('Failed to serialize cache data:', error);
      return String(data);
    }
  }

  private deserializeData<T>(data: string): T {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to deserialize cache data:', error);
      return data as unknown as T;
    }
  }

  private compressData(data: string): string {
    // Simple compression using LZ-string or similar could be implemented here
    // For now, we'll just return the data as-is
    return data;
  }

  private decompressData(data: string): string {
    // Simple decompression
    return data;
  }

  private evictLRU() {
    if (this.memoryCache.size <= this.maxMemorySize) return;

    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const toEvict = entries.slice(0, entries.length - this.maxMemorySize);
    toEvict.forEach(([key]) => {
      this.memoryCache.delete(key);
    });
  }

  private getFromStorage<T>(key: string, storage: 'localStorage' | 'sessionStorage'): T | null {
    try {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
      const item = storageObj.getItem(key);
      
      if (!item) return null;

      const entry: CacheEntry<T> = this.deserializeData(item);
      
      if (this.isExpired(entry)) {
        storageObj.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn(`Failed to get from ${storage}:`, error);
      return null;
    }
  }

  private setInStorage<T>(
    key: string, 
    data: T, 
    storage: 'localStorage' | 'sessionStorage',
    options: CacheOptions
  ): void {
    try {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: options.ttl || this.defaultTTL,
        version: options.version || '1.0',
        metadata: {},
      };

      let serialized = this.serializeData(entry);
      
      if (options.compress) {
        serialized = this.compressData(serialized);
      }

      storageObj.setItem(key, serialized);
    } catch (error) {
      console.warn(`Failed to set in ${storage}:`, error);
      
      // If storage is full, try to clear some space
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearStorage(storage);
        // Try again after clearing
        try {
          const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: options.ttl || this.defaultTTL,
            version: options.version || '1.0',
            metadata: {},
          };
          storageObj.setItem(key, this.serializeData(entry));
        } catch (retryError) {
          console.warn(`Failed to set in ${storage} after clearing:`, retryError);
        }
      }
    }
  }

  get<T>(key: string, options: CacheOptions = {}): T | null {
    const cacheKey = this.generateKey(key, options.version);
    const storage = options.storage || 'memory';

    let result: T | null = null;

    switch (storage) {
      case 'memory':
        const memoryEntry = this.memoryCache.get(cacheKey);
        if (memoryEntry && !this.isExpired(memoryEntry)) {
          result = memoryEntry.data;
        }
        break;

      case 'localStorage':
        result = this.getFromStorage<T>(cacheKey, 'localStorage');
        break;

      case 'sessionStorage':
        result = this.getFromStorage<T>(cacheKey, 'sessionStorage');
        break;
    }

    if (result !== null) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    return result;
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const cacheKey = this.generateKey(key, options.version);
    const storage = options.storage || 'memory';
    const ttl = options.ttl || this.defaultTTL;

    switch (storage) {
      case 'memory':
        this.memoryCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl,
          version: options.version || '1.0',
          metadata: {},
        });
        this.evictLRU();
        break;

      case 'localStorage':
        this.setInStorage(cacheKey, data, 'localStorage', options);
        break;

      case 'sessionStorage':
        this.setInStorage(cacheKey, data, 'sessionStorage', options);
        break;
    }

    this.stats.sets++;
    this.stats.size = this.memoryCache.size;
  }

  delete(key: string, options: CacheOptions = {}): boolean {
    const cacheKey = this.generateKey(key, options.version);
    const storage = options.storage || 'memory';
    let deleted = false;

    switch (storage) {
      case 'memory':
        deleted = this.memoryCache.delete(cacheKey);
        break;

      case 'localStorage':
        try {
          localStorage.removeItem(cacheKey);
          deleted = true;
        } catch (error) {
          console.warn('Failed to delete from localStorage:', error);
        }
        break;

      case 'sessionStorage':
        try {
          sessionStorage.removeItem(cacheKey);
          deleted = true;
        } catch (error) {
          console.warn('Failed to delete from sessionStorage:', error);
        }
        break;
    }

    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.memoryCache.size;
    }

    return deleted;
  }

  clear(storage?: 'memory' | 'localStorage' | 'sessionStorage'): void {
    if (!storage || storage === 'memory') {
      this.memoryCache.clear();
    }

    if (!storage || storage === 'localStorage') {
      this.clearStorage('localStorage');
    }

    if (!storage || storage === 'sessionStorage') {
      this.clearStorage('sessionStorage');
    }

    this.stats.size = this.memoryCache.size;
  }

  private clearStorage(storage: 'localStorage' | 'sessionStorage'): void {
    try {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
      storageObj.clear();
    } catch (error) {
      console.warn(`Failed to clear ${storage}:`, error);
    }
  }

  cleanup(): void {
    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Clean localStorage
    this.cleanupStorage('localStorage');

    // Clean sessionStorage
    this.cleanupStorage('sessionStorage');

    this.stats.size = this.memoryCache.size;
  }

  private cleanupStorage(storage: 'localStorage' | 'sessionStorage'): void {
    try {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
      const keysToDelete: string[] = [];

      for (let i = 0; i < storageObj.length; i++) {
        const key = storageObj.key(i);
        if (!key) continue;

        try {
          const item = storageObj.getItem(key);
          if (!item) continue;

          const entry: CacheEntry<unknown> = this.deserializeData(item);
          if (this.isExpired(entry)) {
            keysToDelete.push(key);
          }
        } catch (error) {
          // Invalid cache entry, remove it
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => storageObj.removeItem(key));
    } catch (error) {
      console.warn(`Failed to cleanup ${storage}:`, error);
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  invalidateByPattern(pattern: RegExp, storage?: 'memory' | 'localStorage' | 'sessionStorage'): void {
    if (!storage || storage === 'memory') {
      for (const key of this.memoryCache.keys()) {
        if (pattern.test(key)) {
          this.memoryCache.delete(key);
        }
      }
    }

    if (!storage || storage === 'localStorage') {
      this.invalidateStorageByPattern(pattern, 'localStorage');
    }

    if (!storage || storage === 'sessionStorage') {
      this.invalidateStorageByPattern(pattern, 'sessionStorage');
    }

    this.stats.size = this.memoryCache.size;
  }

  private invalidateStorageByPattern(
    pattern: RegExp, 
    storage: 'localStorage' | 'sessionStorage'
  ): void {
    try {
      const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;
      const keysToDelete: string[] = [];

      for (let i = 0; i < storageObj.length; i++) {
        const key = storageObj.key(i);
        if (key && pattern.test(key)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => storageObj.removeItem(key));
    } catch (error) {
      console.warn(`Failed to invalidate ${storage} by pattern:`, error);
    }
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// React hook for cached data
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { enabled?: boolean } = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const { enabled = true, ...cacheOptions } = options;

  React.useEffect(() => {
    if (!enabled) return;

    const cachedData = cacheManager.get<T>(key, cacheOptions);
    
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetcher()
      .then(result => {
        setData(result);
        cacheManager.set(key, result, cacheOptions);
      })
      .catch(err => {
        setError(err instanceof Error ? err : new Error('Fetch failed'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [key, enabled, fetcher]);

  const invalidate = React.useCallback(() => {
    cacheManager.delete(key, cacheOptions);
    setData(null);
  }, [key, cacheOptions]);

  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      cacheManager.set(key, result, cacheOptions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fetch failed'));
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, key, cacheOptions]);

  return {
    data,
    isLoading,
    error,
    invalidate,
    refetch,
  };
}

// Helper functions
export const cache = {
  get: <T>(key: string, options?: CacheOptions) => cacheManager.get<T>(key, options),
  set: <T>(key: string, data: T, options?: CacheOptions) => cacheManager.set(key, data, options),
  delete: (key: string, options?: CacheOptions) => cacheManager.delete(key, options),
  clear: (storage?: 'memory' | 'localStorage' | 'sessionStorage') => cacheManager.clear(storage),
  invalidateByPattern: (pattern: RegExp, storage?: 'memory' | 'localStorage' | 'sessionStorage') => 
    cacheManager.invalidateByPattern(pattern, storage),
  getStats: () => cacheManager.getStats(),
};