import { describe, it, expect, beforeAll } from 'vitest';
import { CONFIG } from '../../../src/utils/constants.js';

describe('CONFIG constants', () => {
  // Ensure we're testing with clean environment
  beforeAll(() => {
    // Document the test environment state
    // eslint-disable-next-line no-console
    console.log('Testing with PORT:', process.env.PORT || 'undefined (using default)');
    // eslint-disable-next-line no-console
    console.log(
      'Testing with MAX_IMAGE_SIZE:',
      process.env.MAX_IMAGE_SIZE || 'undefined (using default)'
    );
    // eslint-disable-next-line no-console
    console.log(
      'Testing with REQUEST_TIMEOUT:',
      process.env.REQUEST_TIMEOUT || 'undefined (using default)'
    );
  });

  it('should have PORT as a number', () => {
    expect(typeof CONFIG.PORT).toBe('number');
    expect(CONFIG.PORT).toBeGreaterThan(0);
  });

  it('should have PORT within valid range (1-65535)', () => {
    expect(CONFIG.PORT).toBeGreaterThanOrEqual(1);
    expect(CONFIG.PORT).toBeLessThanOrEqual(65535);
  });

  it('should have MAX_IMAGE_SIZE as a positive number', () => {
    expect(typeof CONFIG.MAX_IMAGE_SIZE).toBe('number');
    expect(CONFIG.MAX_IMAGE_SIZE).toBeGreaterThan(0);
  });

  it('should have REQUEST_TIMEOUT as a positive number', () => {
    expect(typeof CONFIG.REQUEST_TIMEOUT).toBe('number');
    expect(CONFIG.REQUEST_TIMEOUT).toBeGreaterThan(0);
  });

  it('should have correct default or configured values', () => {
    // When no env vars are set, should use defaults
    // When env vars ARE set (from operator), should use those values
    if (!process.env.PORT) {
      expect(CONFIG.PORT).toBe(3000);
    }

    if (!process.env.MAX_IMAGE_SIZE) {
      expect(CONFIG.MAX_IMAGE_SIZE).toBe(10 * 1024 * 1024); // 10MB default
    }

    if (!process.env.REQUEST_TIMEOUT) {
      expect(CONFIG.REQUEST_TIMEOUT).toBe(10000); // 10 seconds default
    }

    // All values should be safe integers
    expect(Number.isSafeInteger(CONFIG.PORT)).toBe(true);
    expect(Number.isSafeInteger(CONFIG.MAX_IMAGE_SIZE)).toBe(true);
    expect(Number.isSafeInteger(CONFIG.REQUEST_TIMEOUT)).toBe(true);
  });

  it('should have correct image format constants', () => {
    expect(CONFIG.SUPPORTED_IMAGE_FORMATS).toContain('jpeg');
    expect(CONFIG.SUPPORTED_IMAGE_FORMATS).toContain('png');
    expect(CONFIG.SUPPORTED_IMAGE_FORMATS).toContain('webp');
  });

  it('should have correct crop mode constants', () => {
    expect(CONFIG.SUPPORTED_CROP_MODES).toContain('fill');
    expect(CONFIG.SUPPORTED_CROP_MODES).toContain('fit');
    expect(CONFIG.SUPPORTED_CROP_MODES).toContain('contain');
  });

  it('should have valid quality range', () => {
    expect(CONFIG.MIN_QUALITY).toBe(1);
    expect(CONFIG.MAX_QUALITY).toBe(100);
    expect(CONFIG.DEFAULT_QUALITY).toBeGreaterThanOrEqual(CONFIG.MIN_QUALITY);
    expect(CONFIG.DEFAULT_QUALITY).toBeLessThanOrEqual(CONFIG.MAX_QUALITY);
  });
});
