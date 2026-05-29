import { prisma } from '../../config/database';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import { Role } from '@prisma/client';

export async function listUsersService(orgId: string, page: number, limit: number) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.count({ where: { organizationId: orgId } }),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateUserRoleService(
  orgId: string,
  targetUserId: string,
  requestingUserId: string,
  newRole: Role
) {
  // Prevent self-demotion
  if (targetUserId === requestingUserId) {
    throw new ForbiddenError('You cannot change your own role');
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: targetUserId, organizationId: orgId },
  });

  if (!targetUser) throw new NotFoundError('User');

  return prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function deleteUserService(
  orgId: string,
  targetUserId: string,
  requestingUserId: string
) {
  if (targetUserId === requestingUserId) {
    throw new ForbiddenError('You cannot remove yourself from the organization');
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: targetUserId, organizationId: orgId },
  });

  if (!targetUser) throw new NotFoundError('User');

  await prisma.user.delete({ where: { id: targetUserId } });
}
