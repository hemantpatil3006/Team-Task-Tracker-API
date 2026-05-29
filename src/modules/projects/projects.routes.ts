import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
} from './projects.schema';
import * as projectsController from './projects.controller';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a new project (ADMIN, MANAGER)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Project created
 */
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(createProjectSchema),
  projectsController.createProject
);

/**
 * @openapi
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List all projects in the organization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get(
  '/',
  validate(listProjectsQuerySchema, 'query'),
  projectsController.listProjects
);

/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a project by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project details
 */
router.get('/:id', projectsController.getProject);

/**
 * @openapi
 * /projects/{id}:
 *   patch:
 *     tags: [Projects]
 *     summary: Update a project (ADMIN, MANAGER)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project updated
 */
router.patch(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate(updateProjectSchema),
  projectsController.updateProject
);

/**
 * @openapi
 * /projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project (ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Project deleted
 */
router.delete(
  '/:id',
  authorize('ADMIN'),
  projectsController.deleteProject
);

export default router;
