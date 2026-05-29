import { prisma } from '../../config/database';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../lib/errors';
import { assertValidTransition } from '../../lib/taskStateMachine';
import {
  getCachedTaskList,
  setCachedTaskList,
  invalidateAssigneeCache,
  invalidateMultipleAssigneeCaches,
} from '../../lib/cache';
import { Role, TaskStatus } from '@prisma/client';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  ListTasksQuery,
} from './tasks.schema';

const taskSelect = {
  id: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  projectId: true,
  assignee: {
    select: { id: true, name: true, email: true, role: true },
  },
};

/** Verifies the project belongs to the org. Returns the project or throws. */
async function getProjectOrThrow(projectId: string, orgId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new NotFoundError('Project');
  return project;
}

/** Verifies a task belongs to the given project in the org. */
async function getTaskOrThrow(taskId: string, projectId: string, orgId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
      project: { organizationId: orgId },
    },
    include: { assignee: { select: { id: true, name: true, email: true, role: true } } },
  });
  if (!task) throw new NotFoundError('Task');
  return task;
}

export async function createTaskService(
  orgId: string,
  projectId: string,
  input: CreateTaskInput
) {
  await getProjectOrThrow(projectId, orgId);

  // Verify assignee belongs to the same org
  if (input.assigneeId) {
    const assignee = await prisma.user.findFirst({
      where: { id: input.assigneeId, organizationId: orgId },
    });
    if (!assignee) throw new ValidationError('Assignee does not belong to this organization');
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      projectId,
    },
    select: taskSelect,
  });

  // Invalidate cache for the new assignee
  if (task.assignee?.id) {
    await invalidateAssigneeCache(task.assignee.id);
  }

  return task;
}

export async function listTasksService(
  orgId: string,
  projectId: string,
  query: ListTasksQuery,
  requestingUserId: string,
  requestingUserRole: Role
) {
  await getProjectOrThrow(projectId, orgId);

  // MEMBER can only see their own tasks
  const effectiveAssigneeId =
    requestingUserRole === 'MEMBER' ? requestingUserId : query.assigneeId;

  // Attempt cache hit (only when filtering by assignee)
  if (effectiveAssigneeId) {
    const cached = await getCachedTaskList({
      assigneeId: effectiveAssigneeId,
      page: query.page,
      limit: query.limit,
      status: query.status,
      priority: query.priority,
    });
    if (cached) {
      return { ...cached, fromCache: true };
    }
  }

  const where = {
    projectId,
    project: { organizationId: orgId },
    ...(effectiveAssigneeId && { assigneeId: effectiveAssigneeId }),
    ...(query.status && { status: query.status }),
    ...(query.priority && { priority: query.priority }),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      select: taskSelect,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.task.count({ where }),
  ]);

  const result = {
    data: tasks,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };

  // Cache if filtering by assignee
  if (effectiveAssigneeId) {
    await setCachedTaskList(
      {
        assigneeId: effectiveAssigneeId,
        page: query.page,
        limit: query.limit,
        status: query.status,
        priority: query.priority,
      },
      result
    );
  }

  return result;
}

export async function getTaskService(orgId: string, projectId: string, taskId: string) {
  await getProjectOrThrow(projectId, orgId);
  return getTaskOrThrow(taskId, projectId, orgId);
}

export async function updateTaskService(
  orgId: string,
  projectId: string,
  taskId: string,
  input: UpdateTaskInput,
  requestingUserId: string,
  requestingUserRole: Role
) {
  await getProjectOrThrow(projectId, orgId);
  const task = await getTaskOrThrow(taskId, projectId, orgId);

  // MEMBER can only update tasks assigned to them
  if (requestingUserRole === 'MEMBER' && task.assigneeId !== requestingUserId) {
    throw new ForbiddenError('You can only update tasks assigned to you');
  }

  // Verify new assignee belongs to org
  if (input.assigneeId) {
    const assignee = await prisma.user.findFirst({
      where: { id: input.assigneeId, organizationId: orgId },
    });
    if (!assignee) throw new ValidationError('Assignee does not belong to this organization');
  }

  const oldAssigneeId = task.assigneeId;
  const newAssigneeId = input.assigneeId !== undefined ? input.assigneeId : oldAssigneeId;

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.priority && { priority: input.priority }),
      ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }),
      ...(input.dueDate !== undefined && {
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      }),
    },
    select: taskSelect,
  });

  // Invalidate old and new assignee caches
  await invalidateMultipleAssigneeCaches([oldAssigneeId, newAssigneeId]);

  return updated;
}

export async function updateTaskStatusService(
  orgId: string,
  projectId: string,
  taskId: string,
  input: UpdateTaskStatusInput,
  requestingUserId: string,
  requestingUserRole: Role
) {
  await getProjectOrThrow(projectId, orgId);
  const task = await getTaskOrThrow(taskId, projectId, orgId);

  // Only the assignee or MANAGER/ADMIN can advance status
  const canUpdate =
    requestingUserRole === 'ADMIN' ||
    requestingUserRole === 'MANAGER' ||
    task.assigneeId === requestingUserId;

  if (!canUpdate) {
    throw new ForbiddenError('Only the assignee or a MANAGER can update task status');
  }

  // Validate state machine transition
  assertValidTransition(task.status, input.status);

  const isCompleting = input.status === TaskStatus.DONE;

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: input.status,
      completedAt: isCompleting ? new Date() : null,
    },
    select: taskSelect,
  });

  // Invalidate cache for the task's assignee
  if (task.assigneeId) {
    await invalidateAssigneeCache(task.assigneeId);
  }

  return updated;
}

export async function deleteTaskService(
  orgId: string,
  projectId: string,
  taskId: string
) {
  await getProjectOrThrow(projectId, orgId);
  const task = await getTaskOrThrow(taskId, projectId, orgId);

  await prisma.task.delete({ where: { id: taskId } });

  // Invalidate cache
  if (task.assigneeId) {
    await invalidateAssigneeCache(task.assigneeId);
  }
}
