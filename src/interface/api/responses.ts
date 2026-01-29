import { Response } from 'express';

export interface SuccessBody<T = unknown> {
  statusCode: number;
  message: string;
  data?: T;
}

export interface ErrorBody {
  statusCode: number;
  errorMsg: string;
  error?: string;
}

export function successResponse<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
): Response {
  const body: SuccessBody<T> = { statusCode, message };
  if (data !== undefined) {
    body.data = data;
  }
  return res.status(statusCode).json(body);
}

export function errorResponse(
  res: Response,
  statusCode: number,
  errorMsg: string,
  error?: string,
): Response {
  const body: ErrorBody = { statusCode, errorMsg };
  if (error !== undefined) {
    body.error = error;
  }
  return res.status(statusCode).json(body);
}
