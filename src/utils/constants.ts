/**
 * Parse and validate environment variable as a positive safe integer
 * @throws {Error} if value is not a valid positive safe integer
 */
function parsePositiveInt(
  value: string | undefined,
  defaultValue: number,
  name: string,
  max?: number
): number {
  // Only use default when truly undefined - not when explicitly set to empty
  if (value === undefined) {
    return defaultValue;
  }

  // Reject explicitly empty strings
  if (value === '') {
    throw new Error(`Invalid ${name}: empty string. Must be a positive integer.`);
  }

  // Check if the entire string is a valid integer (no trailing characters)
  if (!/^\d+$/.test(value)) {
    throw new Error(
      `Invalid ${name}: "${value}". Must be a positive integer with no extra characters.`
    );
  }

  const parsed = parseInt(value, 10);

  // Validate it's a safe integer
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`Invalid ${name}: "${value}". Value exceeds safe integer range.`);
  }

  // Check if positive
  if (parsed <= 0) {
    throw new Error(`Invalid ${name}: "${value}". Must be greater than 0.`);
  }

  // Check maximum if provided
  if (max !== undefined && parsed > max) {
    throw new Error(`Invalid ${name}: "${value}". Must be between 1 and ${max}.`);
  }

  return parsed;
}

export const CONFIG = {
  PORT: parsePositiveInt(process.env.PORT, 3000, 'PORT', 65535),
  MAX_IMAGE_SIZE: parsePositiveInt(process.env.MAX_IMAGE_SIZE, 10 * 1024 * 1024, 'MAX_IMAGE_SIZE'), // 10MB
  REQUEST_TIMEOUT: parsePositiveInt(process.env.REQUEST_TIMEOUT, 10000, 'REQUEST_TIMEOUT'), // 10 seconds
  SUPPORTED_IMAGE_FORMATS: ['jpeg', 'jpg', 'png', 'webp'] as const,
  SUPPORTED_CROP_MODES: ['fill', 'fit', 'contain'] as const,
  DEFAULT_QUALITY: 80,
  MIN_QUALITY: 1,
  MAX_QUALITY: 100,
} as const;

export const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;
