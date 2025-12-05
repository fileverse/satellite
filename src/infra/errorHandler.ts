import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface ErrorWithCode extends Error {
  code?: number;
}

const errorHandler = (
  err: ErrorWithCode,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err);
  res.status(err.code || 500).json({
    message: err.message || "Internal Server Error",
    error: err.message,
  });
};

export default errorHandler;
