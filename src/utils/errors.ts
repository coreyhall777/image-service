/**
 * Base class for all application errors
 */
export abstract class AppError extends Error {
  abstract statusCode: number;
  abstract isOperational: boolean;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Invalid client request
 */
export class BadRequestError extends AppError {
  statusCode = 400;
  isOperational = true;

  constructor(message: string) {
    super(message);
  }
}

/**
 * 404 Not Found - Requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  statusCode = 404;
  isOperational = true;

  constructor(message: string) {
    super(message);
  }
}

/**
 * 422 Unprocessable Entity - Request syntax is correct but semantically invalid
 */
export class UnprocessableEntityError extends AppError {
  statusCode = 422;
  isOperational = true;

  constructor(message: string) {
    super(message);
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends AppError {
  statusCode = 500;
  isOperational = false;

  constructor(message = 'Internal server error') {
    super(message);
  }
}
