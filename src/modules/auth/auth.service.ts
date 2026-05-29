import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { config } from '../../config';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../lib/errors';
import type { RegisterInput, LoginInput, RefreshInput } from './auth.schema';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

async function generateUniqueSlug(baseName: string): Promise<string> {
  const base = generateSlug(baseName);
  let slug = base;
  let suffix = 1;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

export async function registerService(input: RegisterInput) {
  // Check for existing email
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, config.bcrypt.rounds);
  const slug = await generateUniqueSlug(input.organizationName);

  // Create org + ADMIN user in a single transaction
  const user = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: input.organizationName, slug },
    });

    return tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: 'ADMIN',
        organizationId: org.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        organization: { select: { id: true, name: true, slug: true } },
        createdAt: true,
      },
    });
  });

  const tokens = await issueTokenPair(user.id, user.email, user.role, user.organizationId);
  return { user, tokens };
}

export async function loginService(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      organizationId: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!user) {
    // Consistent timing — always hash even for non-existent users
    await bcrypt.compare(input.password, '$2a$12$invalidhashfortimingnormalization');
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const { passwordHash: _, ...safeUser } = user;
  const tokens = await issueTokenPair(user.id, user.email, user.role, user.organizationId);
  return { user: safeUser, tokens };
}

export async function refreshTokenService(input: RefreshInput) {
  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(input.refreshToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Validate token exists in DB and is not revoked
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: input.refreshToken },
    include: { user: { select: { id: true, email: true, role: true, organizationId: true } } },
  });

  if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token is invalid, revoked, or expired');
  }

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  const { user } = storedToken;
  const tokens = await issueTokenPair(user.id, user.email, user.role, user.organizationId);
  return { tokens };
}

export async function logoutService(userId: string, refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken, userId, revoked: false },
    data: { revoked: true },
  });
}

export async function getMeService(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!user) throw new NotFoundError('User');
  return user;
}

async function issueTokenPair(
  userId: string,
  email: string,
  role: string,
  orgId: string
) {
  const tokenId = uuidv4();
  const rawRefreshToken = signRefreshToken({ sub: userId, tokenId });

  const expiresAt = new Date(Date.now() + config.jwt.refreshExpiryMs);

  await prisma.refreshToken.create({
    data: {
      token: rawRefreshToken,
      userId,
      expiresAt,
    },
  });

  const accessToken = signAccessToken({ sub: userId, email, role, orgId });
  return { accessToken, refreshToken: rawRefreshToken };
}
