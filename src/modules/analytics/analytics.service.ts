import { prisma } from '../../config/database';

/**
 * Returns count of overdue tasks per user in the organization.
 * A task is overdue if: dueDate < now AND status NOT IN (DONE)
 */
export async function getOverdueTasksService(orgId: string) {
  const now = new Date();

  const overdueTasks = await prisma.task.groupBy({
    by: ['assigneeId'],
    where: {
      project: { organizationId: orgId },
      dueDate: { lt: now },
      status: { not: 'DONE' },
      assigneeId: { not: null },
    },
    _count: { id: true },
  });

  // Enrich with user info
  const assigneeIds = overdueTasks
    .map((t) => t.assigneeId)
    .filter(Boolean) as string[];

  const users = await prisma.user.findMany({
    where: { id: { in: assigneeIds } },
    select: { id: true, name: true, email: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return overdueTasks.map((row) => ({
    user: userMap.get(row.assigneeId!) || null,
    overdueCount: row._count.id,
  }));
}

/**
 * Returns average completion time (in hours) per user.
 * Only considers tasks with completedAt set (DONE status).
 * Uses raw SQL for efficiency (Prisma groupBy doesn't support avg of date diffs).
 */
export async function getAvgCompletionTimeService(orgId: string) {
  const results = await prisma.$queryRaw<
    Array<{
      assignee_id: string;
      user_name: string;
      user_email: string;
      avg_hours: number;
      completed_count: bigint;
    }>
  >`
    SELECT
      u.id            AS assignee_id,
      u.name          AS user_name,
      u.email         AS user_email,
      ROUND(
        AVG(
          EXTRACT(EPOCH FROM (t.completed_at - t.created_at)) / 3600
        )::numeric,
        2
      )               AS avg_hours,
      COUNT(t.id)     AS completed_count
    FROM tasks t
    JOIN users u ON u.id = t.assignee_id
    JOIN projects p ON p.id = t.project_id
    WHERE
      p.organization_id = ${orgId}
      AND t.status = 'DONE'
      AND t.completed_at IS NOT NULL
    GROUP BY u.id, u.name, u.email
    ORDER BY avg_hours ASC
  `;

  return results.map((r) => ({
    user: { id: r.assignee_id, name: r.user_name, email: r.user_email },
    avgCompletionHours: Number(r.avg_hours),
    completedTaskCount: Number(r.completed_count),
  }));
}
