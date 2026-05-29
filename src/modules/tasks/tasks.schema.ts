import { z } from 'zod';
import { Priority, TaskStatus } from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(Priority).default('MEDIUM'),
  assigneeId: z.string().cuid('Invalid assignee ID').optional(),
  dueDate: z
    .string()
    .datetime({ message: 'dueDate must be a valid ISO 8601 datetime' })
    .refine((d) => new Date(d) > new Date(), {
      message: 'due_date must be a future date',
    })
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  dueDate: z
    .string()
    .datetime()
    .refine((d) => new Date(d) > new Date(), {
      message: 'due_date must be a future date',
    })
    .nullable()
    .optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({
      message: 'status must be one of: TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED',
    }),
  }),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assigneeId: z.string().cuid().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
