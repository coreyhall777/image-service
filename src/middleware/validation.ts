import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors.js';

/**
 * Validation target type
 */
type ValidationTarget = 'query' | 'body' | 'params';

/**
 * Middleware factory to validate request data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate (query, body, params)
 */
export const validate = (schema: ZodSchema, target: ValidationTarget = 'query') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate the target data
      const validated = schema.parse(req[target]);

      // Replace request data with validated (and transformed) data
      req[target] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into readable messages
        const errorMessages = error.errors.map((err) => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });

        // Throw BadRequestError with formatted messages
        next(new BadRequestError(errorMessages.join('; ')));
      } else {
        next(error);
      }
    }
  };
};
