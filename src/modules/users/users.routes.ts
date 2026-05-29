import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { updateRoleSchema, listUsersQuerySchema } from './users.schema';
import * as usersController from './users.controller';

const router = Router();

// All user management routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users in the organization (ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden
 */
router.get('/', validate(listUsersQuerySchema, 'query'), usersController.listUsers);

/**
 * @openapi
 * /users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Update a user's role (ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [ADMIN, MANAGER, MEMBER] }
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch('/:id/role', validate(updateRoleSchema), usersController.updateRole);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Remove a user from the organization (ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: User removed
 */
router.delete('/:id', usersController.deleteUser);

export default router;
