import { prisma } from '../../config/database';
import { NotFoundError } from '../../lib/errors';
import type { CreateProjectInput, UpdateProjectInput } from './projects.schema';

const projectSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  organizationId: true,
  _count: { select: { tasks: true } },
};

export async function createProjectService(orgId: string, input: CreateProjectInput) {
  return prisma.project.create({
    data: { ...input, organizationId: orgId },
    select: projectSelect,
  });
}

export async function listProjectsService(orgId: string, page: number, limit: number) {
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: orgId },
      select: projectSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.count({ where: { organizationId: orgId } }),
  ]);

  return {
    data: projects,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getProjectService(orgId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: projectSelect,
  });
  if (!project) throw new NotFoundError('Project');
  return project;
}

export async function updateProjectService(
  orgId: string,
  projectId: string,
  input: UpdateProjectInput
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new NotFoundError('Project');

  return prisma.project.update({
    where: { id: projectId },
    data: input,
    select: projectSelect,
  });
}

export async function deleteProjectService(orgId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) throw new NotFoundError('Project');
  await prisma.project.delete({ where: { id: projectId } });
}
