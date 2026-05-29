import { TaskStatus } from '@prisma/client';
import { InvalidTransitionError } from './errors';

/**
 * State machine for task status transitions.
 *
 * Enforced transitions:
 *   TODO → IN_PROGRESS → IN_REVIEW → DONE
 *   Any active state → BLOCKED
 *   BLOCKED → TODO | IN_PROGRESS (reactivation)
 */
export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO:        ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['IN_REVIEW',   'BLOCKED'],
  IN_REVIEW:   ['DONE',        'BLOCKED'],
  DONE:        [],
  BLOCKED:     ['TODO', 'IN_PROGRESS'],
};

export function assertValidTransition(
  from: TaskStatus,
  to: TaskStatus
): void {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}

export function isTerminalStatus(status: TaskStatus): boolean {
  return status === TaskStatus.DONE;
}
