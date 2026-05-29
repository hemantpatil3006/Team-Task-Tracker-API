import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as analyticsController from './analytics.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'MANAGER'));

/**
 * @openapi
 * /analytics/overdue:
 *   get:
 *     tags: [Analytics]
 *     summary: Get overdue task count per user (ADMIN, MANAGER)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue counts per assignee
 */
router.get('/overdue', analyticsController.getOverdueTasks);

/**
 * @openapi
 * /analytics/completion:
 *   get:
 *     tags: [Analytics]
 *     summary: Get average task completion time per user in hours (ADMIN, MANAGER)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avg completion time per user
 */
router.get('/completion', analyticsController.getAvgCompletionTime);

export default router;
