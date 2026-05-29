import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  listTasksQuerySchema,
} from './tasks.schema';
import * as tasksController from './tasks.controller';

// mergeParams: true is required to access :projectId from parent router
const router = Router({ mergeParams: true });

router.use(authenticate);

/**
 * @openapi
 * /projects/{projectId}/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task in a project (ADMIN, MANAGER)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *               assigneeId: { type: string }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Task created
 */
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(createTaskSchema),
  tasksController.createTask
);

/**
 * @openapi
 * /projects/{projectId}/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks with pagination and filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *       - in: query
 *         name: assigneeId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated task list (MEMBER only sees their own tasks)
 */
router.get(
  '/',
  validate(listTasksQuerySchema, 'query'),
  tasksController.listTasks
);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a task by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task details
 */
router.get('/:taskId', tasksController.getTask);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task fields (ADMIN, MANAGER can update any; MEMBER only their own)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task updated
 */
router.patch(
  '/:taskId',
  validate(updateTaskSchema),
  tasksController.updateTask
);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Advance task status via enforced state machine transitions
 *     description: |
 *       Allowed transitions:
 *       - TODO → IN_PROGRESS | BLOCKED
 *       - IN_PROGRESS → IN_REVIEW | BLOCKED
 *       - IN_REVIEW → DONE | BLOCKED
 *       - BLOCKED → TODO | IN_PROGRESS
 *       - DONE → (terminal, no further transitions)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED]
 *     responses:
 *       200:
 *         description: Status updated
 *       422:
 *         description: Invalid status transition
 *       403:
 *         description: Not the assignee or a MANAGER
 */
router.patch(
  '/:taskId/status',
  validate(updateTaskStatusSchema),
  tasksController.updateTaskStatus
);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task (ADMIN, MANAGER)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Task deleted
 */
router.delete(
  '/:taskId',
  authorize('ADMIN', 'MANAGER'),
  tasksController.deleteTask
);

export default router;
