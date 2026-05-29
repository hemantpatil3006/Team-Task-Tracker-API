import { z } from 'zod';
import { Role } from '@prisma/client';

export const updateRoleSchema = z.object({
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'role must be ADMIN, MANAGER, or MEMBER' }),
  }),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
