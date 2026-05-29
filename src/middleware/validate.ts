import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * validate — Zod schema validation middleware factory.
 * Validates the specified part of the request against a Zod schema.
 * On failure, throws a ZodError which is caught by the global error handler.
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Replace with parsed (and coerced) values
    req[target] = result.data;
    next();
  };
}
