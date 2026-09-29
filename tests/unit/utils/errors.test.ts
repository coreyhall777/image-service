import { describe, it, expect } from 'vitest';
import {
  BadRequestError,
  NotFoundError,
  UnprocessableEntityError,
  InternalServerError,
} from '../../../src/utils/errors.js';

describe('Error Classes', () => {
  describe('BadRequestError', () => {
    it('should create error with 400 status code', () => {
      const error = new BadRequestError('Invalid parameter');

      expect(error.message).toBe('Invalid parameter');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BadRequestError');
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
    });

    it('should have stack trace', () => {
      const error = new BadRequestError('Test error');
      expect(error.stack).toBeDefined();
    });
  });

  describe('NotFoundError', () => {
    it('should create error with 404 status code', () => {
      const error = new NotFoundError('Resource not found');

      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('UnprocessableEntityError', () => {
    it('should create error with 422 status code', () => {
      const error = new UnprocessableEntityError('Cannot process image');

      expect(error.message).toBe('Cannot process image');
      expect(error.statusCode).toBe(422);
      expect(error.name).toBe('UnprocessableEntityError');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('InternalServerError', () => {
    it('should create error with 500 status code', () => {
      const error = new InternalServerError();

      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('InternalServerError');
      expect(error.isOperational).toBe(false);
    });

    it('should accept custom message', () => {
      const error = new InternalServerError('Database connection failed');

      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(500);
    });
  });
});
