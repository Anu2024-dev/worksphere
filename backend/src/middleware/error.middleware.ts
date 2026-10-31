import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { config } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If headers already sent, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: formattedErrors,
    });
    return;
  }

  // Handle Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || ['resource'];
      res.status(409).json({
        success: false,
        message: `Unique constraint violated. Record with this ${target.join(', ')} already exists.`,
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'The requested record was not found.',
      });
      return;
    }
  }

  // Generic application or uncaught errors
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'An internal server error occurred.';

  console.error('[Error Middleware]:', err);

  res.status(status).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
}
