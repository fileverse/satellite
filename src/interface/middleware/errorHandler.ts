import { NextFunction, Request, Response } from 'express';
import { ApplicationError } from '../../errors';
import { errorResponse } from '../api/responses';
import { ValidationError } from 'express-validation';

type ErrorWithCode = Error & { statusCode?: number; code?: number; details?: unknown };

/**
 * Central error handler. Only the API layer deals with HTTP:
 * - ApplicationError → use its statusCode and message
 * - express-validation ValidationError → 400
 * - Unknown errors → 500, generic message (do not leak details to client)
 */
export const expressErrorHandler = (
  err: ErrorWithCode,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ApplicationError) {
    return errorResponse(res, err.statusCode, err.message);
  }
  if (err instanceof ValidationError) {
    const statusCode = err.statusCode ?? 400;
    return errorResponse(res, statusCode, err.message);
  }
  return errorResponse(res, 500, 'Internal server error');
};
