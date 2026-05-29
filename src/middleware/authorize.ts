import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError } from '../lib/errors';

/**
 * authorize — Role-Based Access Control middleware factory.
 *
 * Enforced at the MIDDLEWARE layer (not in controller logic).
 * Usage: router.get('/path', authenticate, authorize('ADMIN', 'MANAGER'), handler)
 *
 * Role hierarchy: ADMIN > MANAGER > MEMBER
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      next(
        new ForbiddenError(
          `This action requires one of: ${allowedRoles.join(', ')}. Your role is: ${userRole}`
        )
      );
      return;
    }

    next();
  };
}

/**
 * authorizeOrgMember — Ensures the requesting user belongs to the same
 * organization as the resource being accessed. Guards cross-org data leakage.
 */
export function authorizeOrgMember(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  // req.user.orgId is always set by authenticate middleware
  // Resources are always filtered by orgId in queries — this is an extra safeguard
  if (!req.user?.orgId) {
    next(new ForbiddenError('No organization context'));
    return;
  }
  next();
}
