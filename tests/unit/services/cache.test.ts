import { describe, it, expect, beforeEach } from 'vitest';
import { ImageCache } from '../../../src/services/cache';

describe('ImageCache', () => {
  let cache: ImageCache;

  beforeEach(() => {
    cache = new ImageCache(1024 * 1024, 60); // 1MB, 60 seconds
  });

  describe('Cache key generation', () => {
    it('should generate consistent keys for same parameters', () => {
      const params = { url: 'http://example.com/test.jpg', width: 100, height: 100 };
      const key1 = cache.generateKey(params);
      const key2 = cache.generateKey(params);
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different parameters', () => {
      const key1 = cache.generateKey({ url: 'http://example.com/test.jpg', width: 100 });
      const key2 = cache.generateKey({ url: 'http://example.com/test.jpg', width: 200 });
      expect(key1).not.toBe(key2);
    });

    it('should include all transformation parameters in key', () => {
      const key1 = cache.generateKey({
        url: 'http://example.com/test.jpg',
        width: 100,
        height: 100,
        format: 'webp',
        quality: 80,
        crop: 'cover',
      });
      const key2 = cache.generateKey({
        url: 'http://example.com/test.jpg',
        width: 100,
        height: 100,
        format: 'jpeg',
        quality: 80,
        crop: 'cover',
      });
      expect(key1).not.toBe(key2);
    });
  });

  describe('Basic operations', () => {
    it('should store and retrieve entry', () => {
      const key = cache.generateKey({ url: 'http://example.com/test.jpg' });
      const entry = {
        buffer: Buffer.from('test'),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      };

      cache.set(key, entry);
      const retrieved = cache.get(key);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.buffer.toString()).toBe('test');
      expect(retrieved?.contentType).toBe('image/jpeg');
      expect(retrieved?.metadata.width).toBe(100);
    });

    it('should return null for non-existent key', () => {
      const result = cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should delete entry', () => {
      const key = cache.generateKey({ url: 'http://example.com/test.jpg' });
      cache.set(key, {
        buffer: Buffer.from('test'),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });

      const deleted = cache.delete(key);
      expect(deleted).toBe(true);
      expect(cache.get(key)).toBeNull();
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = cache.delete('nonexistent');
      expect(deleted).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', {
        buffer: Buffer.from('test1'),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });
      cache.set('key2', {
        buffer: Buffer.from('test2'),
        contentType: 'image/png',
        metadata: { width: 200, height: 200 },
      });

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.getStats().count).toBe(0);
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when size limit reached', () => {
      const smallCache = new ImageCache(50, 60); // Very small cache

      // Add entries that exceed cache size
      smallCache.set('key1', {
        buffer: Buffer.alloc(20),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });
      smallCache.set('key2', {
        buffer: Buffer.alloc(20),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });
      smallCache.set('key3', {
        buffer: Buffer.alloc(20),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });

      // key1 should be evicted
      expect(smallCache.get('key1')).toBeNull();
      expect(smallCache.get('key2')).not.toBeNull();
      expect(smallCache.get('key3')).not.toBeNull();
    });

    it('should update LRU order when entry is accessed', () => {
      const smallCache = new ImageCache(50, 60);

      smallCache.set('key1', {
        buffer: Buffer.alloc(20),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });
      smallCache.set('key2', {
        buffer: Buffer.alloc(20),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });

      // Access key1 to make it recently used
      smallCache.get('key1');

      // Add new entry - key2 should be evicted, not key1
      smallCache.set('key3', {
        buffer: Buffer.alloc(20),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });

      expect(smallCache.get('key1')).not.toBeNull();
      expect(smallCache.get('key2')).toBeNull();
      expect(smallCache.get('key3')).not.toBeNull();
    });

    it('should not cache entry larger than max cache size', () => {
      const smallCache = new ImageCache(10, 60);

      smallCache.set('key1', {
        buffer: Buffer.alloc(20), // Larger than cache size
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });

      expect(smallCache.get('key1')).toBeNull();
      expect(smallCache.getStats().count).toBe(0);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      const shortTTLCache = new ImageCache(1024 * 1024, 0.1); // 100ms TTL

      shortTTLCache.set('key1', {
        buffer: Buffer.from('test'),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });

      // Should exist immediately
      expect(shortTTLCache.get('key1')).not.toBeNull();

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired
      expect(shortTTLCache.get('key1')).toBeNull();
    });

    it('should not expire entries before TTL', async () => {
      const longTTLCache = new ImageCache(1024 * 1024, 10); // 10 seconds

      longTTLCache.set('key1', {
        buffer: Buffer.from('test'),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });

      // Wait a short time
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should still exist
      expect(longTTLCache.get('key1')).not.toBeNull();
    });
  });

  describe('Cache statistics', () => {
    it('should track cache size correctly', () => {
      const buffer1 = Buffer.alloc(100);
      const buffer2 = Buffer.alloc(200);

      cache.set('key1', {
        buffer: buffer1,
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });
      cache.set('key2', {
        buffer: buffer2,
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });

      const stats = cache.getStats();
      expect(stats.count).toBe(2);
      expect(stats.size).toBe(300);
    });

    it('should update size when entries are deleted', () => {
      const buffer = Buffer.alloc(100);

      cache.set('key1', {
        buffer,
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });

      expect(cache.getStats().size).toBe(100);

      cache.delete('key1');

      expect(cache.getStats().size).toBe(0);
    });

    it('should reset stats on clear', () => {
      cache.set('key1', {
        buffer: Buffer.alloc(100),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });

      cache.clear();

      const stats = cache.getStats();
      expect(stats.count).toBe(0);
      expect(stats.size).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle replacing existing entry', () => {
      const key = cache.generateKey({ url: 'http://example.com/test.jpg' });

      cache.set(key, {
        buffer: Buffer.alloc(100),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });

      const statsBefore = cache.getStats();

      cache.set(key, {
        buffer: Buffer.alloc(200),
        contentType: 'image/png',
        metadata: { width: 200, height: 200 },
      });

      const statsAfter = cache.getStats();

      // Should still have only 1 entry
      expect(statsAfter.count).toBe(1);
      // Size should be updated
      expect(statsAfter.size).toBe(200);
      expect(statsBefore.size).toBe(100);

      const entry = cache.get(key);
      expect(entry?.contentType).toBe('image/png');
    });

    it('should handle empty buffer', () => {
      const key = cache.generateKey({ url: 'http://example.com/test.jpg' });

      cache.set(key, {
        buffer: Buffer.alloc(0),
        contentType: 'image/jpeg',
        metadata: { width: 100, height: 100 },
      });

      const entry = cache.get(key);
      expect(entry).not.toBeNull();
      expect(entry?.buffer.length).toBe(0);
    });
  });
});
