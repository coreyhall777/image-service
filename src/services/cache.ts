import crypto from 'crypto';
import { CONFIG } from '../utils/constants';

interface CacheEntry {
  buffer: Buffer;
  contentType: string;
  metadata: {
    width: number;
    height: number;
  };
  timestamp: number;
  size: number;
}

interface CacheKey {
  url: string;
  width?: number;
  height?: number;
  format?: string;
  quality?: number;
  crop?: string;
}

/**
 * LRU cache for processed images with size-based eviction
 */
export class ImageCache {
  private cache: Map<string, CacheEntry>;
  private currentSize: number;
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(maxSize: number = CONFIG.CACHE_MAX_SIZE, ttl: number = CONFIG.CACHE_TTL) {
    this.cache = new Map();
    this.currentSize = 0;
    this.maxSize = maxSize;
    this.ttl = ttl * 1000; // Convert seconds to milliseconds
  }

  /**
   * Generate cache key from request parameters
   */
  generateKey(params: CacheKey): string {
    const keyString = JSON.stringify({
      url: params.url,
      width: params.width,
      height: params.height,
      format: params.format,
      quality: params.quality,
      crop: params.crop,
    });
    return crypto.createHash('sha256').update(keyString).digest('hex');
  }

  /**
   * Get entry from cache
   */
  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry;
  }

  /**
   * Add entry to cache
   */
  set(key: string, entry: Omit<CacheEntry, 'timestamp' | 'size'>): void {
    const size = entry.buffer.length;

    // Don't cache if entry is larger than max cache size
    if (size > this.maxSize) {
      return;
    }

    // If key already exists, remove it first
    if (this.cache.has(key)) {
      this.delete(key);
    }

    // Evict entries until we have enough space
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    const cacheEntry: CacheEntry = {
      ...entry,
      timestamp: Date.now(),
      size,
    };

    this.cache.set(key, cacheEntry);
    this.currentSize += size;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    // First key in Map is the least recently used
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.delete(firstKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    count: number;
    maxSize: number;
  } {
    return {
      size: this.currentSize,
      count: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Singleton instance
export const imageCache = new ImageCache();
