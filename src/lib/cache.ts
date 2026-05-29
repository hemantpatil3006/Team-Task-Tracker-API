import { getRedisClient } from '../config/redis';
import { config } from '../config';

/**
 * Cache key format:
 *   tasks:assignee:{assigneeId}:page:{page}:limit:{limit}:status:{status}:priority:{priority}
 *
 * Pattern for invalidation (per assignee):
 *   tasks:assignee:{assigneeId}:*
 */

function buildCacheKey(params: {
  assigneeId: string;
  page: number;
  limit: number;
  status?: string;
  priority?: string;
}): string {
  return [
    'tasks',
    `assignee:${params.assigneeId}`,
    `page:${params.page}`,
    `limit:${params.limit}`,
    `status:${params.status ?? 'all'}`,
    `priority:${params.priority ?? 'all'}`,
  ].join(':');
}

function buildAssigneePattern(assigneeId: string): string {
  return `tasks:assignee:${assigneeId}:*`;
}

export async function getCachedTaskList(params: {
  assigneeId: string;
  page: number;
  limit: number;
  status?: string;
  priority?: string;
}): Promise<unknown | null> {
  try {
    const redis = getRedisClient();
    const key = buildCacheKey(params);
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    // Cache failures must never break the API
    return null;
  }
}

export async function setCachedTaskList(
  params: {
    assigneeId: string;
    page: number;
    limit: number;
    status?: string;
    priority?: string;
  },
  data: unknown
): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = buildCacheKey(params);
    await redis.setex(key, config.cache.taskListTtl, JSON.stringify(data));
  } catch {
    // Silently ignore cache write failures
  }
}

/**
 * Invalidates all cached task lists for a given assignee using
 * SCAN + DEL pattern to avoid full keyspace scans.
 */
export async function invalidateAssigneeCache(
  assigneeId: string
): Promise<void> {
  try {
    const redis = getRedisClient();
    const pattern = buildAssigneePattern(assigneeId);

    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch {
    // Silently ignore cache invalidation failures
  }
}

/**
 * Invalidates cache for multiple assignees at once.
 * Used when a task's assignee changes (invalidate both old and new).
 */
export async function invalidateMultipleAssigneeCaches(
  assigneeIds: (string | null | undefined)[]
): Promise<void> {
  const validIds = assigneeIds.filter(Boolean) as string[];
  await Promise.all(validIds.map(invalidateAssigneeCache));
}
