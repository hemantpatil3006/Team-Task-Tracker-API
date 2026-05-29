import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { UnauthorizedError } from '../lib/errors';
import { prisma } from '../config/database';
import { Role } from '@prisma/client';

// Augment Express Request with user context
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        role: Role;
        orgId: string;
        name: string;
      };
    }
  }
}

/**
 * authenticate — Verifies the JWT access token from the Authorization header.
 * Attaches the decoded user context to req.user.
 * Must run before any authorize() middleware.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    // Verify user still exists (catches deleted/deactivated users)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, organizationId: true, name: true },
    });

    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.organizationId,
      name: user.name,
    };

    next();
  } catch (err) {
    // JsonWebTokenError, TokenExpiredError → map to UnauthorizedError
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}
