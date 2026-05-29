import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  status: number;
  code: string;
  message: string;
  errors?: Record<string, string>[];
}

/**
 * Global error handler middleware.
 * Must be registered last in the Express app pipeline.
 * Normalizes all errors into the consistent response format:
 *   { status, code, message }
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Our custom AppError
  if (err instanceof AppError) {
    const body: ErrorResponse = {
      status: err.statusCode,
      code: err.code,
      message: err.message,
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Zod validation errors — format field-level messages
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => e.message).join('; ');
    res.status(400).json({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: messages,
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      res.status(409).json({
        status: 409,
        code: 'CONFLICT',
        message: `A record with this ${target} already exists`,
      });
      return;
    }
    // Record not found
    if (err.code === 'P2025') {
      res.status(404).json({
        status: 404,
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });
      return;
    }
  }

  // Unknown errors — log and return 500
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}
