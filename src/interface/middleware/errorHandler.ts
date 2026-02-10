import { NextFunction, Response } from "express";
import { reporter } from "../../infra";
import { logger } from "../../infra/logger";
import { ValidationError } from "./validator";
import { Request } from "express";

// eslint-disable-next-line no-unused-vars
export const expressErrorHandler = (
  err: Error & {
    statusCode?: number;
    code?: number;
    token?: string;
    details?: any;
  },
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err.details != null) logger.warn({ details: err.details }, "Validation error details");
  const errorMessage = `Message: ${err.message}\nError Code: ${err.statusCode || err.code}`;
  reporter.reportError(errorMessage).catch((e) => logger.warn(e));
  if (err instanceof ValidationError) {
    return res.status(err?.statusCode || 500).json({ message: err.message });
  }
  res.status(err.code || 500).json({ message: err.message });
  next();
};
